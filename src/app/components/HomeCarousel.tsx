"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaTwitch, FaDiscord, FaCoffee } from "react-icons/fa";
import cn from "classnames";

export default function HomeCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const slides = [
    {
      text: "Support this project",
      description: "Help keep divoxutils running",
      icon: <FaCoffee className="mx-auto text-indigo-400 h-12 w-12 drop-shadow-lg" />,
      link: "/contribute",
      openInNewTab: false,
    },
    {
      text: "Follow me on Twitch",
      description: "Join the community",
      icon: <FaTwitch className="mx-auto text-indigo-400 h-12 w-12 drop-shadow-lg" />,
      link: "https://www.twitch.tv/divoxzy",
      openInNewTab: true,
    },
    {
      text: "Suggestions and feedback",
      description: "Share your ideas",
      icon: <FaDiscord className="mx-auto text-indigo-400 h-12 w-12 drop-shadow-lg" />,
      link: "https://discord.com/users/310750671576236033",
      openInNewTab: true,
    },
  ];

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);
    return () => mediaQuery.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isHovered || hasFocusWithin) return;
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length, isHovered, hasFocusWithin, prefersReducedMotion]);

  return (
    <div className="relative my-12 mx-auto max-w-2xl">
      <div
        ref={containerRef}
        className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setHasFocusWithin(true)}
        onBlurCapture={(event) => {
          const nextFocused = event.relatedTarget as Node | null;
          if (nextFocused && containerRef.current?.contains(nextFocused)) return;
          setHasFocusWithin(false);
        }}
      >
        <div
          className={cn("flex", {
            "transition-transform duration-700 ease-out": !prefersReducedMotion,
          })}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          ref={carouselRef}
        >
          {slides.map((slide, index) => (
            <div
              className="w-full flex-shrink-0"
              key={index}
            >
              <a
                href={slide.link}
                target={slide.openInNewTab ? "_blank" : undefined}
                rel={slide.openInNewTab ? "noopener noreferrer" : undefined}
                aria-label={`${slide.text}${slide.openInNewTab ? " (opens in a new tab)" : ""}`}
                className="block p-12 sm:p-16 h-full w-full flex flex-col items-center justify-center text-center group transition-all duration-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-inset"
              >
                <div
                  className={cn("mb-6", {
                    "transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1":
                      !prefersReducedMotion,
                  })}
                  aria-hidden="true"
                >
                  {slide.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                  {slide.text}
                </h3>
                <p className="text-gray-400 text-sm sm:text-base font-medium opacity-90">
                  {slide.description}
                </p>
              </a>
            </div>
          ))}
        </div>
        
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentSlide ? "true" : undefined}
                className={cn(
                  "transition-all duration-300 ease-out rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40",
                  {
                    "w-8 h-2 bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/25": index === currentSlide,
                    "w-2 h-2 bg-transparent border-gray-600 hover:border-gray-400": index !== currentSlide,
                  }
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
