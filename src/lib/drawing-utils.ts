import { UserLayerData } from "@/lib/types";

export const LOCAL_STORAGE_DRAWINGS_KEY = 'drawings-storage';

const adjectives = [
  "Sparkling", "Cosmic", "Mystic", "Pixelated", "Dreamy",
  "Vibrant", "Lunar", "Solar", "Retro", "Futuristic",
  "Whimsical", "Abstract", "Geometric", "Surreal", "Playful",
  "Majestic", "Enchanted", "Celestial", "Galactic", "Ethereal",
  "Cybernetic", "Chromatic", "Holographic", "Quantum", "Mythic",
  "Neon", "Primal", "Astral", "Iridescent", "Arcane",
  "Prismatic", "Luminous", "Spectral", "Twilight", "Radiant",
  "Glitched", "Hypnotic", "Crystalline", "Digital", "Psychedelic",
];

const animals = [
  "Phoenix", "Griffin", "Dragon", "Sphinx", "Pegasus",
  "Kraken", "Hydra", "Basilisk", "Cerberus", "Chimera",
  "Robot", "Alien", "Stardust", "Nebula", "Comet",
  "Unicorn", "Wyvern", "Gorgon", "Minotaur", "Cyclops",
  "Gryphon", "Manticore", "Leviathan", "Roc", "Fenrir",
  "Behemoth", "Banshee", "Titan", "Centaur", "Djinn",
  "Gargoyle", "Nymph", "Wraith", "Triton", "Harpy",
  "Golem", "Specter", "Kelpie", "Siren", "Automaton",
];

export const generateRandomString = (length: number): string => {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const getRandomElement = <T,>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const generateNewDrawingId = (): string => {
  const adjective = getRandomElement(adjectives);
  const animal = getRandomElement(animals);
  const randomString = generateRandomString(6);
  return `${adjective.toLowerCase()}-${animal.toLowerCase()}-${randomString}`;
};

export const saveDrawingToLocalStorage = (
  drawingId: string,
  layers: UserLayerData[],
  storageKey: string = LOCAL_STORAGE_DRAWINGS_KEY
): boolean => {
  try {
    const allSavedDrawingsJSON = localStorage.getItem(storageKey);
    let allDrawings: { [key: string]: UserLayerData[] } = {};

    if (allSavedDrawingsJSON) {
      try {
        allDrawings = JSON.parse(allSavedDrawingsJSON);
      } catch (error) {
        console.error(`Failed to parse all drawings from localStorage (key: ${storageKey}) before saving`, error);
        allDrawings = {};
      }
    }
    allDrawings[drawingId] = layers;
    localStorage.setItem(storageKey, JSON.stringify(allDrawings));
    return true;
  } catch (error) {
    console.error(`Failed to save drawing ${drawingId} to localStorage (key: ${storageKey})`, error);
    return false;
  }
};

export const createDraftDrawing = (
  layers: UserLayerData[],
  storageKey: string = LOCAL_STORAGE_DRAWINGS_KEY
): string | null => {
  const newDrawingId = generateNewDrawingId();
  if (saveDrawingToLocalStorage(newDrawingId, layers, storageKey)) {
    return newDrawingId;
  }
  return null;
}; 