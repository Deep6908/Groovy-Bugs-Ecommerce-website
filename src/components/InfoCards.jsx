import React from "react";

const cards = [
  {
    image: "/images/playlist-wall.jpg",
    heading: "pure customization",
    desc: "display your playlist with poster prints each customized to your choice and taste",
  },
  {
    image: "/images/thick-high-quality-poster-paper.jpg",
    heading: "build",
    desc: "heavy-end machinery for our vibrant prints. matte finish poster paper w/ a thickness of 300gsm and an extra matte laminate for that premium texture",
  },
  {
    image: "/images/creation-wall.jpg",
    heading: "creation",
    desc: "every single order of ours is unique in its own kind of way",
  },
];

const InfoCards = () => (
  <section className="section bg-black">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-gray-900 rounded-none overflow-hidden shadow-2xl info-card-glow"
        >
          <img
            src={card.image}
            alt={card.heading}
            className="w-full h-48 sm:h-56 lg:h-64 object-cover"
          />
          <div className="p-4 sm:p-6">
            <h3 className="font-mono text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 uppercase tracking-wide">
              {card.heading}
            </h3>
            <p className="font-mono text-white text-sm sm:text-base leading-relaxed tracking-wide">
              {card.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default InfoCards;
