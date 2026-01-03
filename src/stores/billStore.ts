import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BillState, PersonalInfo, VoucherConfig, BillSide, HourValue, Language } from '../types/bill';

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
  setLanguage: (language: Language) => void;
  setHours: (hours: HourValue) => void;
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
    language: 'de',
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

      setPortrait: (original, enhanced = null) =>
        set((state) => ({
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
        })),

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

      setPortraitBgRemoved: (bgRemoved, bgRemovedImage) =>
        set((state) => ({
          portrait: {
            ...state.portrait,
            bgRemoved,
            bgRemovedImage: bgRemovedImage !== undefined ? bgRemovedImage : state.portrait.bgRemovedImage,
          },
        })),

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

      setLanguage: (language) =>
        set((state) => ({
          voucherConfig: { ...state.voucherConfig, language },
        })),

      setHours: (hours) =>
        set((state) => ({
          voucherConfig: { ...state.voucherConfig, hours },
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'money-generator-storage',
      partialize: (state) => ({
        personalInfo: state.personalInfo,
        voucherConfig: state.voucherConfig,
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
          bgRemoved: false, // Reset to false since we don't persist the image
          bgOpacity: 0, // Reset since we don't persist the image
          bgBlur: 0, // Reset since we don't persist the image
          engravingIntensity: state.portrait.engravingIntensity,
        },
      }),
    }
  )
);
