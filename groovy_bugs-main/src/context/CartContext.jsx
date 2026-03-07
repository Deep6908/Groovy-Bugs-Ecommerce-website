import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { cartAPI } from '../services/api'; // Assuming your cartAPI is in services/api.js
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
    const { isSignedIn, userId, isLoaded } = useAuth();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);

    // NEW: States for cart-level details
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [discountCode, setDiscountCode] = useState(null); // Will store { code, discount, discountType }
    const [shippingAddress, setShippingAddress] = useState(null); // Will store the address object

    // Helper to find an item in the cart state by product _id and size
    const findCartItemIndex = useCallback((productId, size) => {
        return cart.findIndex(item =>
            (item.product === productId) &&
            (item.size === size || (!item.size && !size))
        );
    }, [cart]);

    // Function to load cart from localStorage
    const loadCartFromLocalStorage = useCallback(() => {
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
    }, []);

    // Memoized function to load cart from API
    const loadCartFromAPI = useCallback(async () => {
        if (!userId) {
            return;
        }
        try {
            setLoading(true);
            const cartData = await cartAPI.getCart(userId);
            const transformedCart = cartData.items.map(item => ({
                product: item.product,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                size: item.size,
                cartId: item.product + (item.size || '')
            }));
            setCart(transformedCart || []);
            // NEW: Set cart-level details from the API response
            setSpecialInstructions(cartData.specialInstructions || "");
            setDiscountCode(cartData.discountCode || null);
            setShippingAddress(cartData.shippingAddress || null);

        } catch (error) {
            console.error('Error loading cart from API:', error);
            toast.error("Failed to load cart from server. Using local cart if available.", { theme: "dark" });
            loadCartFromLocalStorage(); // Fallback to localStorage on API error
        } finally {
            setLoading(false);
        }
    }, [userId, loadCartFromLocalStorage]);

    // Memoized function to sync cart *items* to API
    // This function only sends items array to the backend
    const syncCartItemsToAPI = useCallback(async (currentCart) => {
        if (isSignedIn && userId) {
            try {
                const cartDataToSend = currentCart.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    size: item.size,
                    name: item.name, // Include name, price, image for backend if needed for calculations/pre-save
                    price: item.price,
                    image: item.image,
                }));
                // Using updateCart for items
                await cartAPI.updateCart(userId, cartDataToSend);
            } catch (error) {
                console.error('Error syncing cart items to API:', error);
                toast.error("Failed to sync cart items to server. Please try again.", { theme: "dark" });
            }
        }
    }, [isSignedIn, userId]);

    // NEW: Functions to update cart-level details and send to API
    const updateSpecialInstructions = useCallback(async (instructions) => {
        if (!isSignedIn || !userId) {
            toast.error("Please sign in to save special instructions.", { theme: "dark" });
            return;
        }
        try {
            // Optimistic update
            setSpecialInstructions(instructions);
            await cartAPI.updateCartDetails(userId, { specialInstructions: instructions });
            toast.success("Special instructions saved!", { theme: "dark" });
        } catch (error) {
            console.error('Error updating special instructions:', error);
            toast.error("Failed to save special instructions.", { theme: "dark" });
            // Revert on error or re-fetch cart to ensure consistency
            loadCartFromAPI();
        }
    }, [isSignedIn, userId, loadCartFromAPI]);

    const applyDiscountCode = useCallback(async (code) => {
        if (!isSignedIn || !userId) {
            toast.error("Please sign in to apply a discount.", { theme: "dark" });
            return false;
        }
        let discountDetails = null;
        // Basic frontend validation for codes - actual validation should happen on backend
        if (code.toLowerCase() === "groovy20") {
            discountDetails = { code: code, discount: 20, discountType: 'percentage' };
        } else if (code.toLowerCase() === "welcome10") {
            discountDetails = { code: code, discount: 10, discountType: 'percentage' };
        } else {
            toast.error("Invalid discount code", { theme: "dark" });
            return false;
        }

        try {
            // Optimistic update
            setDiscountCode(discountDetails);
            const response = await cartAPI.updateCartDetails(userId, { discountCode: discountDetails });
            // The backend's pre-save hook will calculate the total and send it back.
            // You might want to re-fetch the entire cart or update totalAmount based on response.
            loadCartFromAPI(); // Re-fetch to ensure all cart states are in sync
            toast.success(`Discount '${code}' applied!`, { theme: "dark" });
            return true;
        } catch (error) {
            console.error('Error applying discount code:', error);
            toast.error("Failed to apply discount.", { theme: "dark" });
            // Revert on error
            // setDiscountCode(null);
            loadCartFromAPI(); // Re-fetch to ensure consistency
            return false;
        }
    }, [isSignedIn, userId, loadCartFromAPI]);

    const updateShippingAddress = useCallback(async (addressData) => {
        if (!isSignedIn || !userId) {
            toast.error("Please sign in to save your shipping address.", { theme: "dark" });
            return;
        }
        try {
            // Optimistic update
            setShippingAddress(addressData);
            await cartAPI.updateCartDetails(userId, { shippingAddress: addressData });
            toast.success("Shipping address saved!", { theme: "dark" });
        } catch (error) {
            console.error('Error updating shipping address:', error);
            toast.error("Failed to save shipping address.", { theme: "dark" });
            // Revert on error or re-fetch cart
            loadCartFromAPI();
        }
    }, [isSignedIn, userId, loadCartFromAPI]);


    // Effect to load cart on sign-in/out or initial load
    useEffect(() => {
        if (isLoaded) {
            if (isSignedIn && userId) {
                loadCartFromAPI(); // Signed in: API is primary
            } else {
                loadCartFromLocalStorage(); // Signed out: localStorage is primary
            }
        }
    }, [isSignedIn, userId, isLoaded, loadCartFromAPI, loadCartFromLocalStorage]);

    // Effect to save cart to localStorage for guest users
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            const cartDataToStore = cart.map(({ cartId, ...rest }) => rest);
            localStorage.setItem('cart', JSON.stringify(cartDataToStore));
        }
    }, [cart, isSignedIn, isLoaded]);


    const addToCart = async (productToAdd, quantityToAdd = 1) => {
        if (!isLoaded) {
            toast.error("Authentication not loaded yet. Please wait.", { theme: "dark" });
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
            toast.success(`Increased quantity of ${productToAdd.name} in cart!`, { theme: "dark" });
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
            toast.success(`${productToAdd.name} added to cart!`, { theme: "dark" });
        }

        setCart(updatedCart);
        await syncCartItemsToAPI(updatedCart); // Use syncCartItemsToAPI for item changes
    };

    const removeFromCart = async (productId, size = undefined) => {
        const newCart = cart.filter(item =>
            !(item.product === productId && (item.size === size || (!item.size && !size)))
        );
        setCart(newCart);
        toast.info("Item removed from cart.", { theme: "dark" });
        await syncCartItemsToAPI(newCart); // Use syncCartItemsToAPI for item changes
    };

    const updateQuantity = async (productId, size = undefined, change) => {
        const existingItemIndex = findCartItemIndex(productId, size);

        if (existingItemIndex === -1) {
            console.warn("Attempted to update quantity for a non-existent item in cart:", productId, size);
            return;
        }

        let updatedCart;
        const currentQuantity = cart[existingItemIndex].quantity;

        if (currentQuantity + change <= 0) {
            updatedCart = cart.filter((item, index) => index !== existingItemIndex);
            toast.info("Item quantity reduced to zero and removed.", { theme: "dark" });
        } else {
            updatedCart = cart.map((item, index) =>
                index === existingItemIndex
                    ? { ...item, quantity: item.quantity + change }
                    : item
            );
        }

        setCart(updatedCart);
        await syncCartItemsToAPI(updatedCart); // Use syncCartItemsToAPI for item changes
    };

    const clearCart = async () => {
        setCart([]);
        toast.info("Cart cleared!", { theme: "dark" });
        await syncCartItemsToAPI([]); // Use syncCartItemsToAPI for item changes
        // Also clear cart-level details on backend
        if (isSignedIn && userId) {
            await cartAPI.updateCartDetails(userId, {
                specialInstructions: "",
                discountCode: null,
                shippingAddress: null
            });
        }
    };

    const getCartTotal = useCallback(() => {
        // This total needs to come from the backend or be calculated considering the discount
        // For now, it calculates locally based on current items
        let currentTotal = cart.reduce((total, item) => total + (parseFloat(item.price) || 0) * (item.quantity || 0), 0);

        // Apply discount if exists in context state
        if (discountCode && discountCode.discount) {
            if (discountCode.discountType === 'percentage') {
                currentTotal = currentTotal * (1 - discountCode.discount / 100);
            } else {
                currentTotal = Math.max(0, currentTotal - discountCode.discount);
            }
        }
        return currentTotal;
    }, [cart, discountCode]); // Add discountCode to dependencies

    const getCartCount = useCallback(() => {
        return cart.reduce((total, item) => total + (item.quantity || 0), 0);
    }, [cart]);

    const getGroupedCart = useCallback(() => {
        return cart.map(item => ({
            ...item,
            _id: item.product,
            id: item.product,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            size: item.size,

        }));
    }, [cart]);


    const value = {
        cart,
        loading,
        specialInstructions, // Expose special instructions
        discountCode,      // Expose discount code
        shippingAddress,   // Expose shipping address
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getGroupedCart,
        updateSpecialInstructions, // NEW: Function to update special instructions
        applyDiscountCode,         // NEW: Function to apply discount code
        updateShippingAddress,     // NEW: Function to update shipping address
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};