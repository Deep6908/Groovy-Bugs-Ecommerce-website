import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productAPI } from "../services/api";

const placeholderCropTops = [
  { id: "crop-placeholder-1", name: "Classic Crop Top", price: 499 },
  { id: "crop-placeholder-2", name: "Ribbed Crop Top", price: 549 },
  { id: "crop-placeholder-3", name: "Graphic Crop Top", price: 599 },
  { id: "crop-placeholder-4", name: "Relaxed Crop Top", price: 649 },
];

const CropTopsPage = () => {
  const [cropTopProducts, setCropTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCropTops = async () => {
      try {
        const products = await productAPI.getByCategory("Crop Tops");
        setCropTopProducts(products);
      } catch (err) {
        console.error("Failed to fetch Crop Tops:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCropTops();
  }, []);

  if (loading) {
    return (
      <div className="bg-main-bg min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl font-mono">Loading crop tops...</div>
      </div>
    );
  }

  const usingPlaceholders = cropTopProducts.length === 0;
  const itemsToRender = usingPlaceholders ? placeholderCropTops : cropTopProducts;

  return (
    <div className="bg-main-bg min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black text-white font-mono tracking-wider uppercase">
            CROP TOPS
          </h1>
          <div className="text-gray-400 font-mono">{cropTopProducts.length} products</div>
        </div>

        {usingPlaceholders && (
          <p className="text-gray-400 font-mono mb-8">
            Placeholder items shown until crop tops are added to inventory.
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

export default CropTopsPage;
