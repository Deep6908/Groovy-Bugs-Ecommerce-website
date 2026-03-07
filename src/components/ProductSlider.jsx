import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productAPI } from "../services/api"; // Ensure this path is correct for productAPI

const ProductSlider = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Added error state for robustness

    useEffect(() => {
        const fetchFeaturedProducts = async () => {
            try {
                // Assuming productAPI has a getFeaturedProducts method
                const fetchedProducts = await productAPI.getFeatured();
                console.log("Fetched Featured products:", fetchedProducts); // Debug log
                setProducts(fetchedProducts);
            } catch (err) {
                console.error("Failed to fetch featured products:", err);
                setError("Failed to load featured products. Please try again."); // Set error state
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedProducts();
    }, []); // Empty dependency array means this effect runs once on component mount

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-white text-xl font-mono">Loading products...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center py-20 bg-main-bg">
                <div className="text-red-500 text-xl font-mono">{error}</div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex justify-center items-center py-20 bg-main-bg">
                <div className="text-gray-400 text-xl font-mono">No featured products available.</div>
            </div>
        );
    }

    return (
        <div className="bg-main-bg py-10">
            {/* Added scrollbar-hide to the div that controls horizontal overflow */}
            <div className="overflow-x-auto scrollbar-hide max-w-6xl mx-auto">
                <div className="flex gap-6 px-6 pb-4" style={{ width: 'max-content' }}>
                    {products.map(product => (
                        <Link
                            to={`/product/${product._id || product.id}`}
                            key={product._id || product.id}
                            className="no-underline text-inherit block"
                        >
                            <div className="group bg-gray-900 rounded-2xl min-w-72 max-w-72 flex-shrink-0 overflow-hidden transition-all duration-300 ease-out cursor-pointer border border-gray-800 hover:border-main-purple hover:transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
                                <div className="relative aspect-square overflow-hidden bg-gray-800">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    {/* Assuming 'Sale' is a fixed tag for featured products or based on a product property */}
                                    {/* You might want to adjust this based on your actual product data, e.g., product.onSale */}
                                    <span className="absolute left-3 top-3 bg-main-purple text-white text-sm font-bold py-1 px-3 rounded-lg tracking-wide font-mono">
                                        Sale {/* or product.tag if it exists */}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-white mb-3 tracking-wide font-mono uppercase">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mb-3">
                                        {/* Assuming originalPrice and price exist, and formatting for INR */}
                                        {product.originalPrice && product.price && product.originalPrice > product.price && (
                                            <span className="text-gray-400 line-through text-base font-mono">
                                                ₹{product.originalPrice.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                        <span className="text-white text-lg font-bold font-mono">
                                            ₹{product.price ? product.price.toLocaleString('en-IN') : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductSlider;