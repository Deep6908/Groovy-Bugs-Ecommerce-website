import React from "react";
import { Link } from "react-router-dom";
import "../styles/ProductCard.css";

const ProductCard = ({ product, onAddToCart }) => (
  <div className="product-card pop">
    <Link to={`/product/${product.id}`}>
      <img src={product.image} alt={product.name} className="product-image" />
    </Link>
    <div className="product-info">
      <Link to={`/product/${product.id}`} className="product-link">
        <h3>{product.name}</h3>
      </Link>
      <p className="product-price">₹{product.price}</p>
      <button className="add-cart-btn" onClick={() => onAddToCart(product)}>
        Add to Cart
      </button>
    </div>
  </div>
);

export default ProductCard;
