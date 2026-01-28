import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GeminiGenerationResult, GeminiModelOptionId } from '../services/geminiImageGenerator';
import { DEFAULT_MODEL_OPTION } from '../services/geminiImageGenerator';
import type { ProcessedVoucherImages, VoucherValidationResult } from '../services/voucherImageProcessor';
import { indexedDBStorage } from './indexedDBStorage';

interface GeminiState {
  apiKey: string;
  selectedModelOption: GeminiModelOptionId;
  // Generated image state (persisted in IndexedDB)
  generationResult: GeminiGenerationResult | null;
  processedImages: ProcessedVoucherImages | null;
  validationResult: VoucherValidationResult | null;
  referenceImage: string | null;
  // Actions
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
  setSelectedModelOption: (option: GeminiModelOptionId) => void;
  setGenerationResult: (result: GeminiGenerationResult | null) => void;
  setProcessedImages: (images: ProcessedVoucherImages | null) => void;
  setValidationResult: (result: VoucherValidationResult | null) => void;
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
      selectedModelOption: DEFAULT_MODEL_OPTION,
      generationResult: null,
      processedImages: null,
      validationResult: null,
      referenceImage: null,
      setApiKey: (apiKey: string) => set({ apiKey }),
      clearApiKey: () => set({ apiKey: '' }),
      setSelectedModelOption: (selectedModelOption) => set({ selectedModelOption }),
      setGenerationResult: (generationResult) => set({ generationResult }),
      setProcessedImages: (processedImages) => set({ processedImages }),
      setValidationResult: (validationResult) => set({ validationResult }),
      setReferenceImage: (referenceImage) => set({ referenceImage }),
      clearGeneratedImages: () => set({
        generationResult: null,
        processedImages: null,
        validationResult: null,
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
