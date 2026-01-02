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
  setPortraitRawImage: (rawImage: string | null) => void;
  setPortraitBgRemoved: (bgRemoved: boolean, bgRemovedImage?: string | null) => void;
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
    rawImage: null,
    bgRemovedImage: null,
    bgRemoved: false,
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
            // Keep current zoom if updating existing portrait, reset to 1 for new portrait
            zoom: state.portrait.original && original ? state.portrait.zoom : 1,
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
        portrait: state.portrait,
      }),
    }
  )
);
