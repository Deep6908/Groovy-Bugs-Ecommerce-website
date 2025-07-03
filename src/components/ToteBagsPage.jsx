import React from "react";
import { Link } from "react-router-dom";
import products from "../data/products";

const toteBagProducts = products.filter(
  (p) => p.category && p.category.toLowerCase().includes("tote bag")
);

const ToteBagsPage = () => (
  <div className="min-h-screen bg-black">
    <div className="section pt-20 sm:pt-24">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
        <div></div>
        <div className="font-mono text-white text-sm sm:text-base">
          {toteBagProducts.length} products
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {toteBagProducts.map((product) => (
          <Link
            to={`/product/${product.id}`}
            key={product.id}
            className="group bg-groovy-gray rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-700 hover:border-groovy-purple"
          >
            <div className="relative overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 sm:h-56 lg:h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="p-4 text-center">
              <h3 className="font-sans text-sm sm:text-base font-black text-white mb-2 uppercase tracking-wide">
                {product.name}
              </h3>
              <p className="font-mono text-white text-sm sm:text-base">
                From Rs. {product.price}.00
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default ToteBagsPage;
