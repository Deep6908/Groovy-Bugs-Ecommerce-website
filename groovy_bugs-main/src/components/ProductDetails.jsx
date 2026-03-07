import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productAPI } from "../services/api"; // Only productAPI needed here now
import { useCart } from "../context/CartContext";
import { toast } from 'react-toastify';
import { useAuth, useClerk } from '@clerk/clerk-react';

const posterSizes = [
    { value: "A5", label: "A5 - 17 Posters" },
    { value: "A4", label: "A4 - 17 Posters" },
    { value: "A3", label: "A3 - 17 Posters" }
];
const TeesSizes = [
    { value: "S", label: "S" },
    { value: "M", label: "M" },
    { value: "L", label: "L" },
    { value: "XL", label: "XL" },
    { value: "XXL", label: "XXL" }
];
const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    // Renamed 'size' to 'selectedPosterSize' for clarity and added 'selectedTeeSize'
    const [selectedPosterSize, setSelectedPosterSize] = useState(posterSizes[0].value);
    const [selectedTeeSize, setSelectedTeeSize] = useState(TeesSizes[0].value);
    
    // Destructure `addToCart` from useCart and alias it to `contextAddToCart`
    const { addToCart: contextAddToCart } = useCart();
    const { isSignedIn } = useAuth();
    const { openSignIn } = useClerk();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const fetchedProduct = await productAPI.getById(id);
                setProduct(fetchedProduct);
                // Set initial size based on product category once fetched
                if (fetchedProduct.category && fetchedProduct.category.toLowerCase().includes("poster")) {
                    setSelectedPosterSize(posterSizes[0].value);
                } else if (fetchedProduct.category && fetchedProduct.category.toLowerCase().includes("tee")) {
                    setSelectedTeeSize(TeesSizes[0].value);
                }
            } catch (err) {
                console.error("Failed to fetch product:", err);
                setError("Failed to load product. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        } else {
            setLoading(false);
            setError("No product ID provided.");
        }
    }, [id]);

    if (loading) {
        return (
            <div className="bg-main-bg min-h-screen flex items-center justify-center">
                <div className="text-white text-2xl font-mono">Loading product details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-96 text-white text-xl bg-main-bg">
                <div className="text-center">
                    <p className="font-mono text-2xl mb-4">{error}</p>
                    <Link to="/" className="bg-main-purple text-white border-none rounded-2xl py-3 px-6 font-mono font-bold hover:bg-purple-600 transition-colors duration-200 no-underline">
                        Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex items-center justify-center min-h-96 text-white text-xl bg-main-bg">
                <div className="text-center">
                    <p className="font-mono text-2xl mb-4">Product not found.</p>
                    <Link to="/" className="bg-main-purple text-white border-none rounded-2xl py-3 px-6 font-mono font-bold hover:bg-purple-600 transition-colors duration-200 no-underline">
                        Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    // Determine product category for conditional rendering
    const isPosterCategory = product.category && product.category.toLowerCase().includes("poster");
    const isTeeCategory = product.category && product.category.toLowerCase().includes("tee");

    const handleAddToCart = async () => {
        if (!isSignedIn) {
            toast.warn("Please sign in or sign up to add items to your cart.", {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
            openSignIn(); // Opens the Clerk sign-in modal
            return;
        }

        // Determine the correct size to add based on category
        let selectedSize = undefined;
        if (isPosterCategory) {
            selectedSize = selectedPosterSize;
        } else if (isTeeCategory) {
            selectedSize = selectedTeeSize;
        }

        // Construct the item object as expected by CartContext's addToCart
        const itemToAdd = {
            _id: product._id || product.id, // Use _id for consistency with MongoDB IDs
            name: product.name,
            price: product.price,
            image: product.image,
            size: selectedSize, // Include the determined size
        };

        try {
            // Call the addToCart function from the CartContext
            // This function handles updating local state, localStorage, and syncing with the API.
            await contextAddToCart(itemToAdd, quantity);
            console.log(quantity, "items added to cart via context");

            // Reset the quantity to 1 after successfully adding to cart
            setQuantity(1);

            // The toast message is now handled internally by CartContext's addToCart
            // for more consistent feedback. No need for an explicit success toast here.

        } catch (err) {
            // Error handling for the context's addToCart (e.g., if API sync fails)
            // The context's addToCart should ideally toast its own errors.
            console.error("Failed to add item to cart via context:", err);
            // Fallback toast in case context doesn't handle it
            toast.error("Failed to add product to cart. Please try again.", {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
        }
    };

    return (
        <section className="bg-main-bg min-h-screen py-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Product Image */}
                    <div className="flex items-center justify-center">
                        <div className="relative max-w-lg w-full">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-auto object-contain bg-gray-800 rounded-2xl border-4 border-gray-700 shadow-2xl"
                                style={{ aspectRatio: '4/5' }}
                            />
                            {product.featured && (
                                <span className="absolute top-4 left-4 bg-main-purple text-white text-sm font-bold py-2 px-4 rounded-lg tracking-wide font-mono">
                                    FEATURED
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="text-white space-y-6">
                        <div>
                            <h1 className="font-black text-5xl font-mono text-white mb-4 tracking-wide uppercase">
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-3xl font-bold text-white font-mono">
                                    ₹{product.price}
                                </span>
                                {product.originalPrice && (
                                    <span className="text-xl text-gray-400 line-through font-mono">
                                        ₹{product.originalPrice}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-lg text-gray-300 leading-relaxed font-mono">
                            {product.description}
                        </div>

                        {/* Size Selection for Posters */}
                        {isPosterCategory && (
                            <div className="space-y-3">
                                <label htmlFor="poster-size-select" className="block text-white font-medium font-mono text-lg">
                                    Size
                                </label>
                                <select
                                    id="poster-size-select"
                                    value={selectedPosterSize}
                                    onChange={e => setSelectedPosterSize(e.target.value)}
                                    className="w-full py-3 px-4 rounded-lg border-2 border-main-purple bg-gray-800 text-white text-base font-mono focus:border-purple-400 focus:outline-none"
                                >
                                    {posterSizes.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Size Selection for Tees */}
                        {isTeeCategory && (
                            <div className="space-y-3">
                                <label htmlFor="tee-size-select" className="block text-white font-medium font-mono text-lg">
                                    Size
                                </label>
                                <select
                                    id="tee-size-select"
                                    value={selectedTeeSize}
                                    onChange={e => setSelectedTeeSize(e.target.value)}
                                    className="w-full py-3 px-4 rounded-lg border-2 border-main-purple bg-gray-800 text-white text-base font-mono focus:border-purple-400 focus:outline-none"
                                >
                                    {TeesSizes.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Quantity Selection */}
                        <div className="space-y-3">
                            <label htmlFor="quantity-input" className="block text-white font-medium font-mono text-lg">
                                Quantity
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="bg-main-purple text-white border-none rounded-lg w-12 h-12 text-xl font-bold cursor-pointer transition-colors duration-200 flex items-center justify-center hover:bg-purple-600 font-mono"
                                >
                                    -
                                </button>
                                <input
                                    id="quantity-input"
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                                    className="w-20 text-center text-lg border-2 border-main-purple rounded-lg bg-gray-800 text-white py-3 px-2 font-mono focus:border-purple-400 focus:outline-none"
                                />
                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="bg-main-purple text-white border-none rounded-lg w-12 h-12 text-xl font-bold cursor-pointer transition-colors duration-200 flex items-center justify-center hover:bg-purple-600 font-mono"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            className="bg-main-purple text-blue-50 hover:text-black border-none rounded-2xl py-4 px-9 text-xl font-bold cursor-pointer transition-all duration-200 hover:bg-white hover:transform hover:scale-100 font-mono tracking-wider uppercase shadow-lg"
                            onClick={handleAddToCart}
                        >
                            Add to Cart
                        </button>

                        {/* Product Features */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-gray-700">
                            <div className="text-center p-4 bg-gray-900 rounded-lg">
                                <h4 className="font-bold text-white mb-2 font-mono">Free Shipping</h4>
                                <p className="text-sm text-gray-400 font-mono">On orders over ₹1500</p>
                            </div>
                            <div className="text-center p-4 bg-gray-900 rounded-lg">
                                <h4 className="font-bold text-white mb-2 font-mono">Premium Quality</h4>
                                <p className="text-sm text-gray-400 font-mono">220 gsm matte finish</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductDetails;
