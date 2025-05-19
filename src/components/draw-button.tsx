"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

const adjectives = [
  "Sparkling", "Cosmic", "Mystic", "Pixelated", "Dreamy",
  "Vibrant", "Lunar", "Solar", "Retro", "Futuristic",
  "Whimsical", "Abstract", "Geometric", "Surreal", "Playful",
];

const animals = [
  "Phoenix", "Griffin", "Dragon", "Sphinx", "Pegasus",
  "Kraken", "Hydra", "Basilisk", "Cerberus", "Chimera",
  "Robot", "Alien", "Stardust", "Nebula", "Comet",
];

const generateRandomString = (length: number): string => {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const getRandomElement = <T,>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export function DrawButton() {
  const router = useRouter();

  const handleDrawClick = () => {
    const adjective = getRandomElement(adjectives);
    const animal = getRandomElement(animals);
    const randomString = generateRandomString(6);
    const url = `/draw/${adjective.toLowerCase()}-${animal.toLowerCase()}-${randomString}`;
    router.push(url);
  };

  return (
    <Button className="w-10 h-10" onClick={handleDrawClick} variant="secondary" size="default">
      <PlusIcon strokeWidth={3} className="w-4 h-4" />
    </Button>
  );
} 