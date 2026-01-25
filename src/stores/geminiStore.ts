import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GeminiGenerationResult } from '../services/geminiImageGenerator';
import type { ProcessedVoucherImages } from '../services/voucherImageProcessor';
import { indexedDBStorage } from './indexedDBStorage';

interface GeminiState {
  apiKey: string;
  // Generated image state (persisted in IndexedDB)
  generationResult: GeminiGenerationResult | null;
  processedImages: ProcessedVoucherImages | null;
  referenceImage: string | null;
  // Actions
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
  setGenerationResult: (result: GeminiGenerationResult | null) => void;
  setProcessedImages: (images: ProcessedVoucherImages | null) => void;
  setReferenceImage: (image: string | null) => void;
  clearGeneratedImages: () => void;
}

/**
 * Store for Gemini API key and generated images
 * Persisted to IndexedDB (handles large image data)
 */
export const useGeminiStore = create<GeminiState>()(
  persist(
    (set) => ({
      apiKey: '',
      generationResult: null,
      processedImages: null,
      referenceImage: null,
      setApiKey: (apiKey: string) => set({ apiKey }),
      clearApiKey: () => set({ apiKey: '' }),
      setGenerationResult: (generationResult) => set({ generationResult }),
      setProcessedImages: (processedImages) => set({ processedImages }),
      setReferenceImage: (referenceImage) => set({ referenceImage }),
      clearGeneratedImages: () => set({
        generationResult: null,
        processedImages: null
      }),
    }),
    {
      name: 'gemini-store',
      storage: createJSONStorage(() => indexedDBStorage),
      skipHydration: true,
    }
  )
);

/**
 * Initialize the gemini store - must be called on client-side
 * This triggers hydration from IndexedDB
 */
export function initializeGeminiStore(): void {
  if (typeof window !== 'undefined') {
    useGeminiStore.persist.rehydrate();
  }
}
