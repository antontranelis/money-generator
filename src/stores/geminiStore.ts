import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GeminiState {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
}

/**
 * Store for Gemini API key
 * Persisted to sessionStorage (cleared when browser closes)
 */
export const useGeminiStore = create<GeminiState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (apiKey: string) => set({ apiKey }),
      clearApiKey: () => set({ apiKey: '' }),
    }),
    {
      name: 'gemini-api-key',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
