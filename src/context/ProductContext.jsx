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
      console.log("Fetched products:", data); // Debug: See what data looks like

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
    fetchProducts();
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
