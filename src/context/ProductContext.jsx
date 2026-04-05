import React, { createContext, useContext, useEffect, useState } from "react";
import { productAPI } from "../services/api";

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAll();

      // ✅ Fix: Adjust this based on API response shape
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        throw new Error("Unexpected product data format");
      }

    } catch (err) {
      setError(err.message || "Failed to fetch products");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchProducts();

    // Background polling every 15 seconds to sync inventory
    const intervalId = setInterval(() => {
      // Pass silent=true to fetchProducts if we don't want to trigger full loading states every time
      fetchProducts(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  // Defensive checks to avoid crash if products is undefined or malformed
  const getFeaturedProducts = () => {
    if (!Array.isArray(products)) return [];
    return products.filter((product) => product.featured);
  };

  const getProductById = (id) => {
    if (!Array.isArray(products)) return null;
    return products.find((product) => product._id === id);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        getFeaturedProducts,
        getProductById,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
