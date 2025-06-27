import { UserLayerData } from "@/lib/types";
import { useEffect } from "react";

interface AutoSaveProps {
  layers: UserLayerData[];
  drawingId: string | null;
  isLoadedFromStorage: boolean;
  setIsLoadedFromStorage: (value: boolean) => void;
  history: UserLayerData[][];
  currentHistoryIndex: number;
  storageKey: string;
}

export default function AutoSave({
  layers,
  drawingId,
  isLoadedFromStorage,
  setIsLoadedFromStorage,
  history,
  currentHistoryIndex,
  storageKey,
}: AutoSaveProps) {
  useEffect(() => {
    if (!drawingId || !layers.length) {
      // Don't save if:
      // - drawingId is not yet available
      // - layers array is empty (e.g., during initial setup before default layer is added)
      return;
    }

    if (isLoadedFromStorage) {
      // If data was just loaded from storage, skip this save cycle
      // and signal that for the next change, saving should be allowed.
      setIsLoadedFromStorage(false);
      return;
    }

    if (history.length > 0 && currentHistoryIndex >= 0) {
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

        console.log(`Auto-saving drawing ${drawingId} to ${storageKey}`);
        localStorage.setItem(storageKey, JSON.stringify(allDrawings));
      } catch (error) {
        console.error(`Failed to save drawing ${drawingId} to localStorage (key: ${storageKey})`, error);
      }
    }
  }, [layers, drawingId, isLoadedFromStorage, setIsLoadedFromStorage, history, currentHistoryIndex, storageKey]);

  return null;
}
