import React from "react";
import { Link } from "react-router-dom";

const collections = [
  {
    name: "Posters",
    // Changed path to reference from the public root
    image: "src/images/collection-posters.jpg",
    link: "/posters"
  },
  {
    name: "Merchandise",
    // Changed path to reference from the public root
    image: "src/images/collection-merch.jpg",
    link: "/tees"
  },
  {
    name: "Tote Bags",
    // Changed path to reference from the public root
    image: "src/images/collection-tote.jpg",
    link: "/tote-bags"
  }
];

const CollectionsPage = () => (
  <div className="bg-main-bg min-h-screen py-20">
    <div className="max-w-6xl mx-auto px-6">
      <h1 className="text-5xl font-black text-white text-center mb-6 font-mono tracking-wider uppercase">
        COLLECTIONS
      </h1>
      <p className="text-xl text-gray-300 text-center mb-16 max-w-4xl mx-auto font-mono leading-relaxed">
        All our product collections featuring designs from music, philosophy, esoterica, movie-culture, memes, and much more.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {collections.map(col => (
          <Link
            to={col.link}
            key={col.name}
            className="group relative overflow-hidden rounded-2xl bg-gray-900 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl no-underline"
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={col.image} // This path will now correctly resolve if images are in /public/images
                alt={col.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl font-black text-white font-mono tracking-wider uppercase">
                {col.name}
              </h3>
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-main-purple transition-colors duration-300 rounded-2xl"></div>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default CollectionsPage;