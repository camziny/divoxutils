import React from "react";
import { FaTwitch, FaDiscord, FaCoffee } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import { CarouselItem } from "@/components/ui/carousel";
import HomeCarouselClient from "./HomeCarouselClient";

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
  {
    text: "DAoC community tools",
    description: "Character tracking, leaderboards, drafts, and more.",
    icon: <GiCrossedSwords className="mx-auto text-indigo-400 h-12 w-12 drop-shadow-lg" />,
    link: "/tools",
    openInNewTab: false,
  },
];

export default function HomeCarousel() {
  return (
    <HomeCarouselClient slideCount={slides.length}>
      {slides.map((slide, index) => (
        <CarouselItem key={index}>
          <a
            href={slide.link}
            target={slide.openInNewTab ? "_blank" : undefined}
            rel={slide.openInNewTab ? "noopener noreferrer" : undefined}
            aria-label={`${slide.text}${slide.openInNewTab ? " (opens in a new tab)" : ""}`}
            className="block p-12 sm:p-16 h-full w-full flex flex-col items-center justify-center text-center group transition-all duration-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-inset"
          >
            <div className="mb-6 transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1" aria-hidden="true">
              {slide.icon}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              {slide.text}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base font-medium opacity-90">
              {slide.description}
            </p>
          </a>
        </CarouselItem>
      ))}
    </HomeCarouselClient>
  );
}
