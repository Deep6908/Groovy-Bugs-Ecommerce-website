import React from "react";

const cards = [
  {
    image: "/images/playlist-wall.jpg",
    heading: "pure customization",
    desc: "display your playlist with poster prints each customized to your choice and taste"
  },
  {
    image: "/images/thick-high-quality-poster-paper.jpg",
    heading: "build",
    desc: "heavy-end machinery for our vibrant prints. matte finish poster paper w/ a thickness of 300gsm and an extra matte laminate for that premium texture"
  },
  {
    image: "/images/creation-wall.jpg",
    heading: "creation",
    desc: "every single order of ours is unique in its own kind of way"
  }
];

const InfoCards = () => (
  <div className="bg-main-bg py-20">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((card, i) => (
          <div 
            key={i}
            className="group bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl border border-gray-800 hover:border-main-purple"
          >
            <div className="aspect-video overflow-hidden">
              <img 
                src={card.image} 
                alt={card.heading} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-black text-white mb-4 font-mono uppercase tracking-wider">
                {card.heading}
              </h3>
              <p className="text-gray-300 leading-relaxed font-mono">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default InfoCards;