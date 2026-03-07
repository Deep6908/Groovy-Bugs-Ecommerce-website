import React, { useEffect, useRef, useState } from "react";
import slide1 from "../images/slide1.jpg";
import slide2 from "../images/slide2.jpg";
import slide3 from "../images/slide3.jpg";

const images = [slide1, slide2, slide3];

const SLIDE_INTERVAL = 3500;

const HeroSlider = () => {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  const goTo = (i) => setIndex(i);
  const prev = () =>
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  const next = () => setIndex((prev) => (prev + 1) % images.length);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_INTERVAL);
    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  return (
    <section className="hero-slider-section">
      <div className="slider-wrapper">
        <div
          className="slider-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((img, i) => (
            <img src={img} alt="hero slide" className="slider-image" key={i} />
          ))}
        </div>
      </div>
      <div className="hero-slider-content">
        <h1 className="text-white text-4xl sm:text-5xl font-bold font-display uppercase text-center mb-4 tracking-wider">
          REJECT MINIMALISM
        </h1>
        <p>
          Groovy Bugs brings you the boldest Rock Band Merch, Posters, and
          Accessories for your room and lifestyle.
        </p>
      </div>
    </section>
  );
};

export default HeroSlider;
