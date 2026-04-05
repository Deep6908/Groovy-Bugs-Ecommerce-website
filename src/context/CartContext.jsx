import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { cartAPI, setTokenGetter } from '../services/api';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { isSignedIn, userId, isLoaded, getToken } = useAuth();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);

    // Bug 10 fix: register the live Clerk getToken function with our Axios service
    // so every request always gets a fresh, non-expired JWT.
    // This replaces the stale localStorage token approach.
    useEffect(() => {
        if (getToken) {
            setTokenGetter(getToken);
        }
    }, [getToken]);

    const isSyncingRef = useRef(false);

    const [specialInstructions, setSpecialInstructions] = useState('');

    // Helper to find an item in the cart state by product _id and size
    const findCartItemIndex = useCallback((productId, size) => {
        return cart.findIndex(item =>
            (item.product === productId) &&
            (item.size === size || (!item.size && !size))
        );
    }, [cart]);

    // Load cart from localStorage (guest users)
    const loadCartFromLocalStorage = useCallback(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                const transformedCart = parsedCart.map(item => ({
                    ...item,
                    cartId: item.product + (item.size || '')
                }));
                setCart(transformedCart);
            } else {
                setCart([]);
            }
        } catch (e) {
            console.warn('Failed to parse cart from localStorage:', e);
            setCart([]);
        }
    }, []);

    const loadCartFromAPI = useCallback(async () => {
        if (!userId) return;
        // Skip poll if a sync is in progress to avoid overwriting optimistic state
        if (isSyncingRef.current) return;

        try {
            setLoading(true);
            const cartData = await cartAPI.getCart(userId);
            const transformedCart = (cartData.items || []).map(item => ({
                product: item.product?._id || item.product,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                size: item.size,
                cartId: (item.product?._id || item.product) + (item.size || '')
            }));
            setCart(transformedCart);
            setSpecialInstructions(cartData.specialInstructions || '');
        } catch (error) {
            console.error('Error loading cart from API:', error);
            toast.error('Failed to load cart from server. Using local cart if available.', { theme: 'dark' });
            loadCartFromLocalStorage();
        } finally {
            setLoading(false);
        }
    }, [userId, loadCartFromLocalStorage]);

    const syncCartItemsToAPI = useCallback(async (currentCart) => {
        if (isSignedIn && userId) {
            isSyncingRef.current = true;
            try {
                const cartDataToSend = currentCart.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    size: item.size,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                }));
                await cartAPI.updateCart(userId, cartDataToSend);
            } catch (error) {
                console.error('Error syncing cart items to API:', error);
                toast.error('Failed to sync cart items to server. Please try again.', { theme: 'dark' });
            } finally {
                isSyncingRef.current = false;
            }
        }
    }, [isSignedIn, userId]);

    const updateSpecialInstructions = useCallback(async (instructions) => {
        if (!isSignedIn || !userId) {
            toast.error('Please sign in to save special instructions.', { theme: 'dark' });
            return;
        }
        try {
            setSpecialInstructions(instructions);
            await cartAPI.updateCartDetails(userId, { specialInstructions: instructions });
            toast.success('Special instructions saved!', { theme: 'dark' });
        } catch (error) {
            console.error('Error updating special instructions:', error);
            toast.error('Failed to save special instructions.', { theme: 'dark' });
            loadCartFromAPI();
        }
    }, [isSignedIn, userId, loadCartFromAPI]);

    // Removed: applyDiscountCode, updateShippingAddress
    // — discount system removed; address is managed locally in CartSidebar

    /**
     * Bug 23 fix: Cart polling improvements
     * 1. Interval increased from 15s → 60s to reduce server load.
     * 2. Page Visibility API: polling pauses when the tab is hidden and resumes
     *    on tab focus — prevents N open tabs all hammering the API simultaneously.
     */
    useEffect(() => {
        let intervalId = null;

        if (!isLoaded) return;

        if (isSignedIn && userId) {
            loadCartFromAPI();

            const startPolling = () => {
                if (intervalId) return; // already running
                intervalId = setInterval(() => {
                    if (!document.hidden) {
                        loadCartFromAPI();
                    }
                }, 60000); // 60 seconds (was 15s — reduced server load)
            };

            const stopPolling = () => {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            };

            // Pause/resume polling based on tab visibility
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    stopPolling();
                } else {
                    // Immediately re-fetch when tab becomes visible again
                    loadCartFromAPI();
                    startPolling();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            startPolling();

            return () => {
                stopPolling();
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        } else {
            // Signed out: use localStorage
            loadCartFromLocalStorage();
        }
    }, [isSignedIn, userId, isLoaded, loadCartFromAPI, loadCartFromLocalStorage]);

    // Save cart to localStorage for guest users only
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            const cartDataToStore = cart.map(({ cartId, ...rest }) => rest);
            localStorage.setItem('cart', JSON.stringify(cartDataToStore));
        }
    }, [cart, isSignedIn, isLoaded]);

    const addToCart = async (productToAdd, quantityToAdd = 1) => {
        if (!isLoaded) {
            toast.error('Authentication not loaded yet. Please wait.', { theme: 'dark' });
            return;
        }

        const productId = productToAdd._id || productToAdd.id;
        const itemSize = productToAdd.size;

        const existingItemIndex = findCartItemIndex(productId, itemSize);
        let updatedCart;

        if (existingItemIndex > -1) {
            updatedCart = cart.map((item, index) =>
                index === existingItemIndex
                    ? { ...item, quantity: item.quantity + quantityToAdd }
                    : item
            );
            toast.success(`Increased quantity of ${productToAdd.name} in cart!`, { theme: 'dark' });
        } else {
            const newItem = {
                product: productId,
                name: productToAdd.name,
                price: productToAdd.price,
                image: productToAdd.image,
                size: itemSize,
                quantity: quantityToAdd,
                cartId: productId + (itemSize || '')
            };
            updatedCart = [...cart, newItem];
            toast.success(`${productToAdd.name} added to cart!`, { theme: 'dark' });
        }

        setCart(updatedCart);
        await syncCartItemsToAPI(updatedCart);
    };

    const removeFromCart = async (productId, size = undefined) => {
        const newCart = cart.filter(item =>
            !(item.product === productId && (item.size === size || (!item.size && !size)))
        );
        setCart(newCart);
        toast.info('Item removed from cart.', { theme: 'dark' });
        await syncCartItemsToAPI(newCart);
    };

    const updateQuantity = async (productId, size = undefined, change) => {
        const existingItemIndex = findCartItemIndex(productId, size);

        if (existingItemIndex === -1) {
            console.warn('Attempted to update quantity for a non-existent item:', productId, size);
            return;
        }

        let updatedCart;
        const currentQuantity = cart[existingItemIndex].quantity;

        if (currentQuantity + change <= 0) {
            updatedCart = cart.filter((_, index) => index !== existingItemIndex);
            toast.info('Item quantity reduced to zero and removed.', { theme: 'dark' });
        } else {
            updatedCart = cart.map((item, index) =>
                index === existingItemIndex
                    ? { ...item, quantity: item.quantity + change }
                    : item
            );
        }

        setCart(updatedCart);
        await syncCartItemsToAPI(updatedCart);
    };

    const clearCart = async () => {
        setCart([]);
        setSpecialInstructions('');
        toast.info('Cart cleared!', { theme: 'dark' });
        if (isSignedIn && userId) {
            try {
                await cartAPI.clearCart(userId);
            } catch (err) {
                console.error('Error clearing cart on server:', err);
            }
        }
    };

    const getCartTotal = useCallback(() => {
        return cart.reduce(
            (total, item) => total + (parseFloat(item.price) || 0) * (item.quantity || 0),
            0
        );
    }, [cart]);

    const getCartCount = useCallback(() => {
        return cart.reduce((total, item) => total + (item.quantity || 0), 0);
    }, [cart]);

    const getGroupedCart = useCallback(() => {
        return cart.map(item => ({
            ...item,
            _id: item.product,
            id: item.product,
        }));
    }, [cart]);

    const value = {
        cart,
        loading,
        specialInstructions,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getGroupedCart,
        updateSpecialInstructions,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};