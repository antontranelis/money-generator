import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type PrintGeneratorConfig,
  type StyleContext,
  type PromptLanguage,
  type ColorScheme,
  type ExtendedColorScheme,
  type CentralMotif,
  type Mood,
  type Energy,
  type VisualStyle,
  type SpiritualSource,
  type TextStyle,
  type TextClarity,
  type Feeling,
  type Industry,
  type Tone,
  type CtaStyle,
  type BusinessDesignStyle,
  type BusinessValue,
  type ValueDisplay,
  type ValuePosition,
  type BackSideStyle,
  DEFAULT_CONFIG,
} from '../types/printGenerator';
import { indexedDBStorage } from './indexedDBStorage';

// ============================================
// STORE STATE INTERFACE
// ============================================

interface PrintGeneratorState extends PrintGeneratorConfig {
  // Style
  setStyleContext: (context: StyleContext) => void;

  // Generation settings
  setPromptLanguage: (lang: PromptLanguage) => void;

  // Design
  setColorScheme: (scheme: ColorScheme | ExtendedColorScheme) => void;
  setCentralMotif: (motif: CentralMotif) => void;

  // Spiritual
  setMood: (mood: Mood) => void;
  setEnergy: (energy: Energy) => void;
  setVisualStyle: (style: VisualStyle) => void;
  setSources: (sources: SpiritualSource[]) => void;
  toggleSource: (source: SpiritualSource) => void;
  setTextStyle: (style: TextStyle) => void;
  setTextClarity: (clarity: TextClarity) => void;
  setFeelings: (feelings: Feeling[]) => void;
  toggleFeeling: (feeling: Feeling) => void;

  // Business
  setIndustry: (industry: Industry) => void;
  setTone: (tone: Tone) => void;
  setCtaStyle: (style: CtaStyle) => void;
  setBusinessDesignStyle: (style: BusinessDesignStyle) => void;
  setBusinessValues: (values: BusinessValue[]) => void;
  toggleBusinessValue: (value: BusinessValue) => void;
  setLogoImage: (image: string | null) => void;
  setLogoColors: (colors: string[]) => void;

  // Portrait
  setPortraitImage: (image: string | null) => void;

  // Motif Images
  setMotifImages: (images: string[]) => void;
  addMotifImage: (image: string) => void;
  removeMotifImage: (index: number) => void;

  // Value
  setValueDisplay: (display: ValueDisplay) => void;
  setValuePosition: (position: ValuePosition) => void;
  setCustomValueText: (text: string) => void;
  setVoucherValue: (value: string) => void;
  setBackSideStyle: (style: BackSideStyle) => void;
  setBackSideText: (text: string) => void;

  // Contact
  setPersonName: (name: string) => void;
  setContactEmail: (email: string) => void;
  setContactPhone: (phone: string) => void;
  setContactWebsite: (website: string) => void;

  // QR Code
  setQrCodeEnabled: (enabled: boolean) => void;
  setQrCodeUrl: (url: string) => void;

  // Reset
  reset: () => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const usePrintGeneratorStore = create<PrintGeneratorState>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,

      // Style - also reset color scheme and motif to context-appropriate defaults
      setStyleContext: (styleContext) =>
        set({
          styleContext,
          // Reset to appropriate defaults when switching context
          colorScheme: styleContext === 'spiritual' ? 'gold-gruen' : 'navy-gold',
          centralMotif: styleContext === 'spiritual' ? 'licht' : 'logo-zentral',
        }),

      // Generation settings
      setPromptLanguage: (promptLanguage) => set({ promptLanguage }),

      // Design
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setCentralMotif: (centralMotif) => set({ centralMotif }),

      // Spiritual
      setMood: (mood) => set({ mood }),
      setEnergy: (energy) => set({ energy }),
      setVisualStyle: (visualStyle) => set({ visualStyle }),
      setSources: (sources) => set({ sources }),
      toggleSource: (source) =>
        set((state) => ({
          sources: state.sources.includes(source)
            ? state.sources.filter((s) => s !== source)
            : [...state.sources, source],
        })),
      setTextStyle: (textStyle) => set({ textStyle }),
      setTextClarity: (textClarity) => set({ textClarity }),
      setFeelings: (feelings) => set({ feelings }),
      toggleFeeling: (feeling) =>
        set((state) => ({
          feelings: state.feelings.includes(feeling)
            ? state.feelings.filter((f) => f !== feeling)
            : [...state.feelings, feeling],
        })),

      // Business
      setIndustry: (industry) => set({ industry }),
      setTone: (tone) => set({ tone }),
      setCtaStyle: (ctaStyle) => set({ ctaStyle }),
      setBusinessDesignStyle: (businessDesignStyle) => set({ businessDesignStyle }),
      setBusinessValues: (businessValues) => set({ businessValues }),
      toggleBusinessValue: (value) =>
        set((state) => ({
          businessValues: state.businessValues.includes(value)
            ? state.businessValues.filter((v) => v !== value)
            : [...state.businessValues, value],
        })),
      setLogoImage: (logoImage) => set({ logoImage }),
      setLogoColors: (logoColors) => set({ logoColors }),

      // Portrait
      setPortraitImage: (portraitImage) => set({ portraitImage }),

      // Motif Images
      setMotifImages: (motifImages) => set({ motifImages }),
      addMotifImage: (image) =>
        set((state) => ({ motifImages: [...state.motifImages, image] })),
      removeMotifImage: (index) =>
        set((state) => ({
          motifImages: state.motifImages.filter((_, i) => i !== index),
        })),

      // Value
      setValueDisplay: (valueDisplay) => set({ valueDisplay }),
      setValuePosition: (valuePosition) => set({ valuePosition }),
      setCustomValueText: (customValueText) => set({ customValueText }),
      setVoucherValue: (voucherValue) => set({ voucherValue }),
      setBackSideStyle: (backSideStyle) => set({ backSideStyle }),
      setBackSideText: (backSideText) => set({ backSideText }),

      // Contact
      setPersonName: (personName) => set({ personName }),
      setContactEmail: (contactEmail) => set({ contactEmail }),
      setContactPhone: (contactPhone) => set({ contactPhone }),
      setContactWebsite: (contactWebsite) => set({ contactWebsite }),

      // QR Code
      setQrCodeEnabled: (qrCodeEnabled) => set({ qrCodeEnabled }),
      setQrCodeUrl: (qrCodeUrl) => set({ qrCodeUrl }),

      // Reset
      reset: () => set(DEFAULT_CONFIG),
    }),
    {
      name: 'print-generator-store',
      storage: createJSONStorage(() => indexedDBStorage),
      skipHydration: true,
      partialize: (state): PrintGeneratorConfig => ({
        styleContext: state.styleContext,
        promptLanguage: state.promptLanguage,
        colorScheme: state.colorScheme,
        centralMotif: state.centralMotif,
        mood: state.mood,
        energy: state.energy,
        visualStyle: state.visualStyle,
        sources: state.sources,
        textStyle: state.textStyle,
        textClarity: state.textClarity,
        feelings: state.feelings,
        industry: state.industry,
        tone: state.tone,
        ctaStyle: state.ctaStyle,
        businessDesignStyle: state.businessDesignStyle,
        businessValues: state.businessValues,
        logoImage: state.logoImage,
        logoColors: state.logoColors,
        portraitImage: state.portraitImage,
        motifImages: state.motifImages,
        valueDisplay: state.valueDisplay,
        valuePosition: state.valuePosition,
        customValueText: state.customValueText,
        voucherValue: state.voucherValue,
        backSideStyle: state.backSideStyle,
        backSideText: state.backSideText,
        personName: state.personName,
        contactEmail: state.contactEmail,
        contactPhone: state.contactPhone,
        contactWebsite: state.contactWebsite,
        qrCodeEnabled: state.qrCodeEnabled,
        qrCodeUrl: state.qrCodeUrl,
      }),
    }
  )
);

// ============================================
// INITIALIZATION
// ============================================

export function initializePrintGeneratorStore(): void {
  if (typeof window !== 'undefined') {
    usePrintGeneratorStore.persist.rehydrate();
  }
}

// Hook to check if store has been hydrated
export function useHasHydrated(): boolean {
  const [hasHydrated, setHasHydrated] = useState(
    usePrintGeneratorStore.persist.hasHydrated()
  );

  useEffect(() => {
    const unsubFinishHydration = usePrintGeneratorStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hasHydrated;
}
