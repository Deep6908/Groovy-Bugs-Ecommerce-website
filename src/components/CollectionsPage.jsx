import React from "react";
import { Link } from "react-router-dom";

const collections = [
  {
    name: "Posters",
    image: "src/images/collection-merch.jpg", // Using existing image as fallback
    link: "/posters",
  },
  {
    name: "Merchandise",
    image: "src/images/collection-posters.jpg", // Using existing image as fallback
    link: "/tees",
  },
  {
    name: "Tote Bags",
    image: "src/images/collection-tote.jpg", // Using existing image as fallback
    link: "/tote-bags",
  },
];

const CollectionsPage = () => (
  <div className="min-h-screen bg-black">
    <div className="section pt-20 sm:pt-24">
      <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-black text-white text-center mb-4 sm:mb-6 uppercase tracking-wider">
        Collections
      </h1>
      <p className="font-mono text-gray-300 text-base sm:text-lg text-center max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed">
        All our product collections featuring designs from music, philosophy,
        esoterica, movie-culture, memes, and much more.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {collections.map((col) => (
          <Link
            to={col.link}
            key={col.name}
            className="group collection-card"
          >
            <div className="relative overflow-hidden">
              <img
                src={col.image}
                alt={col.name}
                className="w-full h-48 sm:h-56 lg:h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
            </div>
            <div className="p-4 sm:p-6 text-center">
              <h3 className="font-mono text-lg sm:text-xl font-bold text-white uppercase tracking-wider group-hover:text-groovy-purple transition-colors duration-300">
                {col.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default CollectionsPage;
