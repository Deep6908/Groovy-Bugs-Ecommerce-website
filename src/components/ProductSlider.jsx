import React from "react";
import { Link } from "react-router-dom";

const ProductSlider = ({ products, onAddToCart }) => (
  <div className="overflow-x-auto scrollbar-hide pb-6">
    <div className="flex gap-8 px-4 sm:px-8 min-w-max">
      {products.map((product) => (
        <Link
          to={`/product/${product.id}`}
          key={product.id}
          className="flex-shrink-0 w-72 group relative animate-fade-in"
        >
          <div className="bg-groovy-dark border-2 border-groovy-purple rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105">
            {/* Sale Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-groovy-purple text-white text-xs font-bold px-2 py-1 rounded shadow">
                Sale
              </span>
            </div>
            {/* Product Image */}
            <div className="relative overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            {/* Product Info */}
            <div className="p-5 text-center">
              <h3 className="font-display text-base font-bold text-groovy-purple uppercase tracking-wider mb-2 drop-shadow">
                {product.name}
              </h3>
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-gray-500 line-through text-sm">
                  Rs. 2,000.00
                </span>
                <span className="text-white font-bold text-lg">
                  Rs. {product.price}.00
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onAddToCart(product);
                }}
                className="mt-2 px-4 py-2 bg-groovy-purple text-white rounded-lg font-bold uppercase tracking-wider shadow hover:bg-groovy-pink transition-colors duration-200"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default ProductSlider;
