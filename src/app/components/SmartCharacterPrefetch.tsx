"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface SmartCharacterPrefetchProps {
  characters: Array<{
    webId: string;
    characterName: string;
    heraldRealmPoints: number;
  }>;
  maxPrefetchCount?: number;
}

export function SmartCharacterPrefetch({ 
  characters, 
  maxPrefetchCount = 3 
}: SmartCharacterPrefetchProps) {
  const router = useRouter();

  useEffect(() => {
    const sortedByRealmPoints = [...characters]
      .sort((a, b) => b.heraldRealmPoints - a.heraldRealmPoints)
      .slice(0, maxPrefetchCount);

    const prefetchTimer = setTimeout(() => {
      sortedByRealmPoints.forEach((character) => {
        router.prefetch(`/character/${character.webId}`);
      });
    }, 2000);

    return () => clearTimeout(prefetchTimer);
  }, [characters, maxPrefetchCount, router]);

  return null;
} 