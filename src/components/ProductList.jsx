import React from "react";
import ProductCard from "./ProductCard";
import "../styles/ProductList.css";

const ProductList = ({ products, onAddToCart }) => (
  <div className="product-list">
    {products.map(product => (
      <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
    ))}
  </div>
);

export default ProductList; 