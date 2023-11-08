"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaTwitch, FaDiscord, FaPaypal } from "react-icons/fa";
import cn from "classnames";

export default function HomeCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      text: "Follow me on Twitch",
      icon: <FaTwitch className="mx-auto text-indigo-600 h-16 w-16" />,
      link: "https://www.twitch.tv/divoxzy",
    },
    {
      text: "Suggestions and feedback",
      icon: <FaDiscord className="mx-auto text-indigo-500 h-16 w-16" />,
      link: "https://discordapp.com/users/.divox",
    },
    {
      text: "Support this project",
      icon: <FaPaypal className="mx-auto text-indigo-500 h-16 w-16" />,
      link: "https://www.paypal.com/donate/?business=3TUFNCTEM67K2&no_recurring=0&currency_code=USD",
    },
  ];

  const carouselRef = useRef(null);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="carousel-container relative bg-gray-900 rounded-lg overflow-hidden shadow-lg my-8 mx-auto w-11/12 sm:w-3/4">
      <div
        className="carousel-track flex transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        ref={carouselRef}
      >
        {slides.map((slide, index) => (
          <div
            className="carousel-slide w-full flex-shrink-0 flex flex-col items-center justify-center text-center"
            key={index}
            style={{ backgroundColor: "#1A202C" }}
          >
            <a
              href={slide.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-20 h-full w-full flex flex-col items-center justify-center"
            >
              <p className="carousel-text text-lg font-semibold text-white mb-2">
                {slide.text}
              </p>
              <div className="carousel-icon text-6xl my-2">{slide.icon}</div>
            </a>
          </div>
        ))}
      </div>
      <div className="carousel-controls absolute bottom-0 left-1/2 transform -translate-x-1/2 p-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Slide ${index + 1}`}
            className={cn(
              "carousel-dot rounded-full w-3 h-3 mx-2 transition duration-300 ease-out",
              {
                "bg-indigo-500": index === currentSlide,
                "bg-gray-700": index !== currentSlide,
              }
            )}
          />
        ))}
      </div>
    </div>
  );
}
