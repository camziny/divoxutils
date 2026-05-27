"use client";

import React, { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type HomeCarouselClientProps = {
  children: ReactNode;
  slideCount: number;
};

export default function HomeCarouselClient({ children, slideCount }: HomeCarouselClientProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [snapCount, setSnapCount] = useState(slideCount);

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) return;
    setCurrentSlide(api.selectedScrollSnap());
    setSnapCount(api.scrollSnapList().length);
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  return (
    <Carousel
      setApi={setApi}
      opts={{ align: "start", loop: true }}
      spacing="none"
      className="relative my-12 mx-auto max-w-2xl"
      aria-label="Homepage links"
    >
      <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 shadow-2xl backdrop-blur-sm overflow-hidden">
        <CarouselContent>{children}</CarouselContent>
      </div>

      <div className="mt-5 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          aria-label="Previous slide"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          {Array.from({ length: snapCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentSlide ? "true" : undefined}
              className={cn(
                "rounded-full transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40",
                index === currentSlide
                  ? "h-2 w-7 bg-indigo-500"
                  : "h-2 w-2 bg-gray-600 hover:bg-gray-400"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => api?.scrollNext()}
          aria-label="Next slide"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Carousel>
  );
}
