import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";

const posterSizes = [
  { value: "A5", label: "A5 - 17 Posters" },
  { value: "A4", label: "A4 - 17 Posters" },
  { value: "A3", label: "A3 - 17 Posters" }
];

const ProductDetails = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(posterSizes[0].value);

  if (!product) {
    return (
      <div className="min-h-screen bg-groovy-dark flex items-center justify-center">
        <div className="text-white text-xl">Product not found.</div>
      </div>
    );
  }

  const isPoster = product.category && product.category.toLowerCase().includes("poster");

  const handleAddToCart = () => {
    onAddToCart({ ...product, quantity, size: isPoster ? size : undefined });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="section pt-20 sm:pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Product Image */}
          <div className="flex justify-center">
            <div className="w-full max-w-md lg:max-w-lg">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-auto aspect-[4/5] object-contain bg-groovy-gray border-4 border-gray-200 shadow-lg" 
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 uppercase tracking-wide">
                {product.name}
              </h1>
              <div className="text-xl sm:text-2xl font-bold text-white mb-4">
                ₹{product.price}
              </div>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Size Selection for Posters */}
            {isPoster && (
              <div className="space-y-2">
                <label htmlFor="size-select" className="block text-white font-medium">
                  Size
                </label>
                <select
                  id="size-select"
                  value={size}
                  onChange={e => setSize(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 border-2 border-groovy-purple bg-groovy-gray text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-groovy-purple"
                >
                  {posterSizes.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity Selection */}
            <div className="space-y-2">
              <label htmlFor="quantity" className="block text-white font-medium">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="bg-groovy-purple text-white w-10 h-10 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors duration-200"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-16 text-center py-2 border-2 border-groovy-purple bg-groovy-gray text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-groovy-purple"
                />
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="bg-groovy-purple text-white w-10 h-10 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button 
              onClick={handleAddToCart}
              className="btn-primary w-full sm:w-auto text-lg py-4 px-8"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;