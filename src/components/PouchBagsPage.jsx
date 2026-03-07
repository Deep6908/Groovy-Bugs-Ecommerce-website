import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productAPI } from "../services/api";

const placeholderPouchBags = [
  { id: "pouch-placeholder-1", name: "Canvas Pouch", price: 499 },
  { id: "pouch-placeholder-2", name: "Travel Pouch", price: 599 },
  { id: "pouch-placeholder-3", name: "Utility Pouch", price: 549 },
  { id: "pouch-placeholder-4", name: "Mini Zip Pouch", price: 449 },
];

const PouchBagsPage = () => {
  const [pouchBagProducts, setPouchBagProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPouchBags = async () => {
      try {
        const products = await productAPI.getByCategory("Pouch Bags");
        setPouchBagProducts(products);
      } catch (err) {
        console.error("Failed to fetch Pouch Bags:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPouchBags();
  }, []);

  if (loading) {
    return (
      <div className="bg-main-bg min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl font-mono">Loading pouch bags...</div>
      </div>
    );
  }

  const usingPlaceholders = pouchBagProducts.length === 0;
  const itemsToRender = usingPlaceholders ? placeholderPouchBags : pouchBagProducts;

  return (
    <div className="bg-main-bg min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black text-white font-mono tracking-wider uppercase">
            POUCH BAGS
          </h1>
          <div className="text-gray-400 font-mono">{pouchBagProducts.length} products</div>
        </div>

        {usingPlaceholders && (
          <p className="text-gray-400 font-mono mb-8">
            Placeholder items shown until pouch bags are added to inventory.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {itemsToRender.map((product) => {
            const isPlaceholder = usingPlaceholders;
            const cardClassName =
              "group bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl no-underline border border-gray-800 hover:border-main-purple";

            const cardContent = (
              <>
                <div className="aspect-square overflow-hidden bg-gray-800 flex items-center justify-center">
                  {isPlaceholder ? (
                    <span className="text-gray-300 font-mono text-sm tracking-widest uppercase">Placeholder</span>
                  ) : (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase tracking-wide">
                    {product.name}
                  </h3>
                  <p className="text-gray-400 font-mono">From Rs. {product.price}.00</p>
                  {!isPlaceholder && (
                    <p
                      style={{
                        color: product.inStock ? "green" : "red",
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </p>
                  )}
                </div>
              </>
            );

            if (isPlaceholder) {
              return (
                <div key={product.id} className={cardClassName}>
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                to={`/product/${product._id || product.id}`}
                key={product._id || product.id}
                className={cardClassName}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PouchBagsPage;
