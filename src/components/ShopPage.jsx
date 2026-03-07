import React, { useState } from "react";
import ProductList from "./ProductList";
import "../styles/ShopPage.css";

const categories = ["All", "Tees", "Posters", "Tote Bags"];

const ShopPage = ({ products, onAddToCart }) => {
  const [selected, setSelected] = useState("All");
  const filtered = selected === "All" ? products : products.filter(p => p.category === selected);

  return (
    <section className="section">
      <h2 className="section-title">Shop All</h2>
      <div className="category-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn${selected === cat ? " active" : ""}`}
            onClick={() => setSelected(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <ProductList products={filtered} onAddToCart={onAddToCart} />
    </section>
  );
};

export default ShopPage; 