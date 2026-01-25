import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type SpiritualPromptState,
  type SpiritualPromptConfig,
  type Mood,
  type Energy,
  type Style,
  type SpiritualSource,
  type ValueDisplay,
  type ValuePosition,
  type CentralMotif,
  type TextStyle,
  type TextClarity,
  type BackSideStyle,
  type Feeling,
  type PromptLanguage,
  type PhotoAttachment,
  type ColorScheme,
  DEFAULT_SPIRITUAL_PROMPT_CONFIG,
} from '../types/spiritualPrompt';
import { indexedDBStorage } from './indexedDBStorage';

export const useSpiritualPromptStore = create<SpiritualPromptState>()(
  persist(
    (set) => ({
      ...DEFAULT_SPIRITUAL_PROMPT_CONFIG,

      setMood: (mood: Mood) => set({ mood }),

      setEnergy: (energy: Energy) => set({ energy }),

      setStyle: (style: Style) => set({ style }),

      setSources: (sources: SpiritualSource[]) => set({ sources }),

      toggleSource: (source: SpiritualSource) =>
        set((state) => ({
          sources: state.sources.includes(source)
            ? state.sources.filter((s) => s !== source)
            : [...state.sources, source],
        })),

      setValueDisplay: (valueDisplay: ValueDisplay) => set({ valueDisplay }),

      setValuePosition: (valuePosition: ValuePosition) => set({ valuePosition }),

      setCustomValueText: (customValueText: string) => set({ customValueText }),

      setCentralMotif: (centralMotif: CentralMotif) => set({ centralMotif }),

      setTextStyle: (textStyle: TextStyle) => set({ textStyle }),

      setTextClarity: (textClarity: TextClarity) => set({ textClarity }),

      setBackSideStyle: (backSideStyle: BackSideStyle) => set({ backSideStyle }),

      setFeelings: (feelings: Feeling[]) => set({ feelings }),

      toggleFeeling: (feeling: Feeling) =>
        set((state) => ({
          feelings: state.feelings.includes(feeling)
            ? state.feelings.filter((f) => f !== feeling)
            : [...state.feelings, feeling],
        })),

      setPersonName: (personName: string) => set({ personName }),

      setVoucherValue: (voucherValue: string) => set({ voucherValue }),

      setContactEmail: (contactEmail: string) => set({ contactEmail }),

      setContactPhone: (contactPhone: string) => set({ contactPhone }),

      setContactWebsite: (contactWebsite: string) => set({ contactWebsite }),

      setContactSocial: (contactSocial: string) => set({ contactSocial }),

      setPromptLanguage: (promptLanguage: PromptLanguage) => set({ promptLanguage }),

      setPhotoAttachment: (photoAttachment: PhotoAttachment) => set({ photoAttachment }),

      setColorScheme: (colorScheme: ColorScheme) => set({ colorScheme }),

      reset: () => set(DEFAULT_SPIRITUAL_PROMPT_CONFIG),
    }),
    {
      name: 'spiritual-prompt-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      skipHydration: true,
      version: 1,
      partialize: (state): SpiritualPromptConfig => ({
        mood: state.mood,
        energy: state.energy,
        style: state.style,
        sources: state.sources,
        valueDisplay: state.valueDisplay,
        valuePosition: state.valuePosition,
        customValueText: state.customValueText,
        centralMotif: state.centralMotif,
        textStyle: state.textStyle,
        textClarity: state.textClarity,
        backSideStyle: state.backSideStyle,
        feelings: state.feelings,
        personName: state.personName,
        voucherValue: state.voucherValue,
        contactEmail: state.contactEmail,
        contactPhone: state.contactPhone,
        contactWebsite: state.contactWebsite,
        contactSocial: state.contactSocial,
        promptLanguage: state.promptLanguage,
        photoAttachment: state.photoAttachment,
        colorScheme: state.colorScheme,
      }),
    }
  )
);

/**
 * Initialize the spiritual prompt store - must be called on client-side
 * This triggers hydration from IndexedDB
 */
export function initializeSpiritualPromptStore(): void {
  if (typeof window !== 'undefined') {
    useSpiritualPromptStore.persist.rehydrate();
  }
}
