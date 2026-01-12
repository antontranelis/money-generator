import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BillState, PersonalInfo, VoucherConfig, BillSide, HourValue, Language } from '../types/bill';
import { resizeImageForStorage } from '../services/imageEffects';

// Storage keys for portrait images (separate from main store to handle size limits)
const PORTRAIT_STORAGE_KEY = 'money-generator-portrait';
const BG_REMOVED_STORAGE_KEY = 'money-generator-bg-removed';

/**
 * Save portrait to localStorage with fallback
 * Clears old data before saving to prevent overflow
 */
async function savePortraitToStorage(imageDataUrl: string | null): Promise<void> {
  try {
    // Always clear old portrait first to prevent overflow
    localStorage.removeItem(PORTRAIT_STORAGE_KEY);

    if (!imageDataUrl) return;

    // Resize for storage (1200px max, PNG for transparency)
    const resized = await resizeImageForStorage(imageDataUrl);

    try {
      localStorage.setItem(PORTRAIT_STORAGE_KEY, resized);
    } catch (e) {
      // Storage quota exceeded - silently fail, image will only be in memory
      console.warn('Could not persist portrait to localStorage:', e);
    }
  } catch (e) {
    console.warn('Error processing portrait for storage:', e);
  }
}

/**
 * Save background-removed image to localStorage
 */
async function saveBgRemovedToStorage(imageDataUrl: string | null): Promise<void> {
  try {
    // Always clear old image first to prevent overflow
    localStorage.removeItem(BG_REMOVED_STORAGE_KEY);

    if (!imageDataUrl) return;

    // Resize for storage (1200px max, PNG for transparency)
    const resized = await resizeImageForStorage(imageDataUrl);

    try {
      localStorage.setItem(BG_REMOVED_STORAGE_KEY, resized);
    } catch (e) {
      // Storage quota exceeded - silently fail, image will only be in memory
      console.warn('Could not persist bg-removed image to localStorage:', e);
    }
  } catch (e) {
    console.warn('Error processing bg-removed image for storage:', e);
  }
}

/**
 * Load portrait from localStorage
 */
function loadPortraitFromStorage(): string | null {
  try {
    return localStorage.getItem(PORTRAIT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Load background-removed image from localStorage
 */
function loadBgRemovedFromStorage(): string | null {
  try {
    return localStorage.getItem(BG_REMOVED_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear all portrait data from localStorage
 */
function clearPortraitFromStorage(): void {
  try {
    localStorage.removeItem(PORTRAIT_STORAGE_KEY);
    localStorage.removeItem(BG_REMOVED_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

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
        // Save to localStorage asynchronously (fire and forget)
        savePortraitToStorage(original);

        return set((state) => ({
          portrait: {
            ...state.portrait,
            original,
            enhanced,
            useEnhanced: false,
            // Keep current zoom/pan if updating existing portrait, reset for new portrait
            zoom: state.portrait.original && original ? state.portrait.zoom : 1,
            panX: state.portrait.original && original ? state.portrait.panX : 0,
            panY: state.portrait.original && original ? state.portrait.panY : 0,
          },
        }));
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

      setPortraitRawImage: (rawImage) =>
        set((state) => ({
          portrait: {
            ...state.portrait,
            rawImage,
          },
        })),

      setPortraitBgRemoved: (bgRemoved, bgRemovedImage) => {
        // Save bg-removed image to localStorage asynchronously
        if (bgRemovedImage !== undefined) {
          saveBgRemovedToStorage(bgRemovedImage);
        }

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

      setTemplateHue: (templateHue) =>
        set((state) => ({
          voucherConfig: { ...state.voucherConfig, templateHue },
        })),

      reset: () => {
        clearPortraitFromStorage();
        return set(initialState);
      },
    }),
    {
      name: 'money-generator-storage',
      // Skip hydration to prevent blocking the main thread
      // Hydration will be triggered manually after the page is interactive
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      // Migrate old storage to reset values
      migrate: (persistedState: unknown) => {
        const state = persistedState as BillState;
        if (state?.voucherConfig) {
          state.voucherConfig.templateHue = 29; // Reset to default
          state.voucherConfig.hours = 1; // Always start at 1 hour
          state.voucherConfig.language = browserLanguage; // Follow browser
        }
        if (state) {
          state.appLanguage = browserLanguage; // Follow browser
        }
        return state;
      },
      version: 1,
      partialize: (state): BillState => ({
        personalInfo: state.personalInfo,
        voucherConfig: {
          ...state.voucherConfig,
          // Persist hours and language selections
          templateHue: 29, // Always reset to default - hue slider is disabled
        },
        appLanguage: state.appLanguage, // Persist app language selection
        // Only persist small settings, NOT image data (too large for localStorage)
        portrait: {
          original: null, // Don't persist - too large
          enhanced: null, // Don't persist - too large
          useEnhanced: state.portrait.useEnhanced,
          zoom: state.portrait.zoom,
          panX: state.portrait.panX,
          panY: state.portrait.panY,
          rawImage: null, // Don't persist - too large
          bgRemovedImage: null, // Don't persist - too large
          // Persist background removal settings so UI shows correct controls after reload
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

// Hydrate the store and restore portraits after the page is interactive
// This prevents blocking the main thread during initial render
if (typeof window !== 'undefined') {
  const hydrateAndRestorePortraits = () => {
    // First, hydrate the zustand store
    useBillStore.persist.rehydrate();

    // Then restore portrait images from localStorage
    const storedPortrait = loadPortraitFromStorage();
    const storedBgRemoved = loadBgRemovedFromStorage();

    if (storedPortrait) {
      const state = useBillStore.getState();
      // Only restore if no portrait is currently set (avoid overwriting fresh uploads)
      if (!state.portrait.original) {
        // Check if we have bgRemoved state but missing image - reset if so
        const hasBgRemovedState = state.portrait.bgRemoved;
        const hasBgRemovedImage = storedBgRemoved !== null;

        useBillStore.setState({
          portrait: {
            ...state.portrait,
            original: storedPortrait,
            rawImage: storedPortrait, // Also restore rawImage for effects
            // Restore bg-removed image if available
            bgRemovedImage: storedBgRemoved,
            // Only keep bgRemoved state if we have the image
            bgRemoved: hasBgRemovedState && hasBgRemovedImage,
            bgOpacity: hasBgRemovedState && hasBgRemovedImage ? state.portrait.bgOpacity : 0,
            bgBlur: hasBgRemovedState && hasBgRemovedImage ? state.portrait.bgBlur : 0,
          },
        });
      }
    }
  };

  // Schedule hydration when browser is idle, after page load
  const scheduleHydration = () => {
    setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(hydrateAndRestorePortraits);
      } else {
        hydrateAndRestorePortraits();
      }
    }, 1000); // Wait 1 second after page load
  };

  if (document.readyState === 'complete') {
    scheduleHydration();
  } else {
    window.addEventListener('load', scheduleHydration, { once: true });
  }
}
