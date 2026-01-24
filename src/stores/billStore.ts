import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BillState, PersonalInfo, VoucherConfig, BillSide, HourValue, Language } from '../types/bill';
import { clearRendererCache } from '../templates/genericRenderer';
import { indexedDBStorage } from './indexedDBStorage';

// Detect browser language and return 'de' or 'en'
function getBrowserLanguage(): Language {
  const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'de';
  // Check if browser language starts with 'de' (e.g., 'de', 'de-DE', 'de-AT')
  return browserLang.toLowerCase().startsWith('de') ? 'de' : 'en';
}

const browserLanguage = getBrowserLanguage();

interface BillActions {
  setPersonalInfo: (info: Partial<PersonalInfo>) => void;
  setVoucherConfig: (config: Partial<VoucherConfig>) => void;
  setPortrait: (original: string | null, enhanced?: string | null) => void;
  setEnhancedPortrait: (enhanced: string | null) => void;
  toggleUseEnhanced: () => void;
  setPortraitZoom: (zoom: number) => void;
  setPortraitPan: (panX: number, panY: number) => void;
  setPortraitRawImage: (rawImage: string | null) => void;
  setPortraitBgRemoved: (bgRemoved: boolean, bgRemovedImage?: string | null) => void;
  setPortraitBgOpacity: (opacity: number) => void;
  setPortraitBgBlur: (blur: number) => void;
  setPortraitEngravingIntensity: (intensity: number) => void;
  setCurrentSide: (side: BillSide) => void;
  flipSide: () => void;
  setIsEnhancing: (value: boolean) => void;
  setIsExporting: (value: boolean) => void;
  setAppLanguage: (language: Language) => void;
  setBillLanguage: (language: Language) => void;
  setHours: (hours: HourValue) => void;
  setTemplateHue: (hue: number) => void;
  setTemplateId: (templateId: string) => void;
  reset: () => void;
}

const initialState: BillState = {
  personalInfo: {
    name: '',
    email: '',
    phone: '',
  },
  voucherConfig: {
    hours: 1,
    description: '',
    language: browserLanguage, // Bill/template language - follows browser
    templateHue: 29, // Default to original beige color (~29°)
    templateId: 'classic-time-voucher', // Default template
  },
  portrait: {
    original: null,
    enhanced: null,
    useEnhanced: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    rawImage: null,
    bgRemovedImage: null,
    bgRemoved: false,
    bgOpacity: 0,
    bgBlur: 0,
    engravingIntensity: 0,
  },
  currentSide: 'front',
  isEnhancing: false,
  isExporting: false,
  appLanguage: browserLanguage, // UI language - follows browser
};

export const useBillStore = create<BillState & BillActions>()(
  persist(
    (set) => ({
      ...initialState,

      setPersonalInfo: (info) =>
        set((state) => ({
          personalInfo: { ...state.personalInfo, ...info },
        })),

      setVoucherConfig: (config) =>
        set((state) => ({
          voucherConfig: { ...state.voucherConfig, ...config },
        })),

      setPortrait: (original, enhanced = null) => {
        return set((state) => {
          // Keep zoom/pan if we already have a portrait (original OR rawImage)
          // This preserves settings during reload when original is null but rawImage exists
          const hasExistingPortrait = state.portrait.original || state.portrait.rawImage;
          return {
            portrait: {
              ...state.portrait,
              original,
              enhanced,
              useEnhanced: false,
              // Keep current zoom/pan if updating existing portrait, reset for new portrait
              zoom: hasExistingPortrait && original ? state.portrait.zoom : 1,
              panX: hasExistingPortrait && original ? state.portrait.panX : 0,
              panY: hasExistingPortrait && original ? state.portrait.panY : 0,
            },
          };
        });
      },

      setEnhancedPortrait: (enhanced) =>
        set((state) => ({
          portrait: {
            ...state.portrait,
            enhanced,
            useEnhanced: enhanced !== null,
          },
        })),

      toggleUseEnhanced: () =>
        set((state) => ({
          portrait: {
            ...state.portrait,
            useEnhanced: state.portrait.enhanced ? !state.portrait.useEnhanced : false,
          },
        })),

      setPortraitZoom: (zoom) =>
        set((state) => ({
          portrait: {
            ...state.portrait,
            zoom,
          },
        })),

      setPortraitPan: (panX, panY) =>
        set((state) => ({
          portrait: {
            ...state.portrait,
            panX,
            panY,
          },
        })),

      setPortraitRawImage: (rawImage) => {
        return set((state) => ({
          portrait: {
            ...state.portrait,
            rawImage,
          },
        }));
      },

      setPortraitBgRemoved: (bgRemoved, bgRemovedImage) => {
        return set((state) => ({
          portrait: {
            ...state.portrait,
            bgRemoved,
            bgRemovedImage: bgRemovedImage !== undefined ? bgRemovedImage : state.portrait.bgRemovedImage,
          },
        }));
      },

      setPortraitBgOpacity: (bgOpacity) =>
        set((state) => ({
          portrait: {
            ...state.portrait,
            bgOpacity,
          },
        })),

      setPortraitBgBlur: (bgBlur) =>
        set((state) => ({
          portrait: {
            ...state.portrait,
            bgBlur,
          },
        })),

      setPortraitEngravingIntensity: (engravingIntensity) =>
        set((state) => ({
          portrait: {
            ...state.portrait,
            engravingIntensity,
          },
        })),

      setCurrentSide: (side) => set({ currentSide: side }),

      flipSide: () =>
        set((state) => ({
          currentSide: state.currentSide === 'front' ? 'back' : 'front',
        })),

      setIsEnhancing: (value) => set({ isEnhancing: value }),

      setIsExporting: (value) => set({ isExporting: value }),

      setAppLanguage: (appLanguage) => set({ appLanguage }),

      setBillLanguage: (language) =>
        set((state) => ({
          voucherConfig: { ...state.voucherConfig, language },
        })),

      setHours: (hours) =>
        set((state) => ({
          voucherConfig: { ...state.voucherConfig, hours },
        })),

      setTemplateHue: (templateHue) => {
        // Clear V2 renderer cache to ensure fresh rendering with new hue
        clearRendererCache();
        return set((state) => ({
          voucherConfig: { ...state.voucherConfig, templateHue },
        }));
      },

      setTemplateId: (templateId) => {
        // Clear V2 renderer cache when switching templates
        clearRendererCache();
        return set((state) => ({
          voucherConfig: { ...state.voucherConfig, templateId },
        }));
      },

      reset: () => {
        return set(initialState);
      },
    }),
    {
      name: 'money-generator-storage',
      // Use IndexedDB for storage - handles large images without localStorage limits
      storage: createJSONStorage(() => indexedDBStorage),
      // Skip automatic hydration - consumer must call useBillStore.persist.rehydrate()
      // This prevents SSR/client mismatch issues with Next.js
      skipHydration: true,
      // Migrate old storage - preserve user settings
      migrate: (persistedState: unknown) => {
        const state = persistedState as BillState;
        if (state?.voucherConfig) {
          // Keep templateHue if set, otherwise use default
          if (state.voucherConfig.templateHue === undefined) {
            state.voucherConfig.templateHue = 29;
          }
          // Set default templateId if not present
          if (!state.voucherConfig.templateId) {
            state.voucherConfig.templateId = 'classic-time-voucher';
          }
          state.voucherConfig.hours = 1; // Always start at 1 hour
          state.voucherConfig.language = browserLanguage; // Follow browser
        }
        if (state) {
          state.appLanguage = browserLanguage; // Follow browser
        }
        return state;
      },
      version: 4, // Bump version for templateId
      // Store everything in IndexedDB - no size limits!
      partialize: (state): BillState => ({
        personalInfo: state.personalInfo,
        voucherConfig: state.voucherConfig,
        appLanguage: state.appLanguage,
        portrait: {
          original: null, // Don't persist processed image - recompute from rawImage
          enhanced: null, // Don't persist - recompute if needed
          useEnhanced: state.portrait.useEnhanced,
          zoom: state.portrait.zoom,
          panX: state.portrait.panX,
          panY: state.portrait.panY,
          rawImage: state.portrait.rawImage, // Persist raw image in IndexedDB
          bgRemovedImage: state.portrait.bgRemovedImage, // Persist bg-removed in IndexedDB
          bgRemoved: state.portrait.bgRemoved,
          bgOpacity: state.portrait.bgOpacity,
          bgBlur: state.portrait.bgBlur,
          engravingIntensity: state.portrait.engravingIntensity,
        },
        currentSide: 'front',
        isEnhancing: false,
        isExporting: false,
      }),
    }
  )
);

/**
 * Initialize the bill store - must be called on client-side
 * This triggers hydration from IndexedDB
 */
export function initializeBillStore(): void {
  if (typeof window !== 'undefined') {
    useBillStore.persist.rehydrate();
  }
}
