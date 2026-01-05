import { useCallback, useRef, useState, useEffect } from 'react';
import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';
import { useStabilityAI } from '../hooks/useStabilityAI';
import { ApiKeyModal } from './ApiKeyModal';
import { TouchSlider } from './TouchSlider';
import { resizeImage, compositeWithBackground, clearImageCache } from '../services/imageEffects';

export function PortraitUpload() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const portrait = useBillStore((state) => state.portrait);
  const setPortrait = useBillStore((state) => state.setPortrait);
  const setPortraitZoom = useBillStore((state) => state.setPortraitZoom);
  const setPortraitPan = useBillStore((state) => state.setPortraitPan);
  const setPortraitRawImage = useBillStore((state) => state.setPortraitRawImage);
  const setPortraitBgRemoved = useBillStore((state) => state.setPortraitBgRemoved);
  const setPortraitBgOpacity = useBillStore((state) => state.setPortraitBgOpacity);
  const setPortraitBgBlur = useBillStore((state) => state.setPortraitBgBlur);
  const setPortraitEngravingIntensity = useBillStore((state) => state.setPortraitEngravingIntensity);

  const { enhance, removeBg, isEnhancing, isRemovingBg, error: aiError, hasKey, setApiKey } = useStabilityAI();

  const trans = t(appLanguage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Debounce refs to track pending effect applications
  const engravingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgOpacityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use values from store
  const rawImage = portrait.rawImage;
  const bgRemovedImage = portrait.bgRemovedImage;
  const bgRemoved = portrait.bgRemoved;
  const bgOpacity = portrait.bgOpacity;
  const bgBlur = portrait.bgBlur;
  const engravingIntensity = portrait.engravingIntensity;

  // Initialize rawImage from original if not set (migration from old store format)
  useEffect(() => {
    if (portrait.original && !portrait.rawImage) {
      setPortraitRawImage(portrait.original);
    }
  }, [portrait.original, portrait.rawImage, setPortraitRawImage]);

  // Cleanup debounce timeouts on unmount
  useEffect(() => {
    return () => {
      if (engravingDebounceRef.current) clearTimeout(engravingDebounceRef.current);
      if (bgOpacityDebounceRef.current) clearTimeout(bgOpacityDebounceRef.current);
    };
  }, []);

  // Track templateHue for re-applying sepia effect
  const templateHue = useBillStore((state) => state.voucherConfig.templateHue);
  const templateHueRef = useRef(templateHue);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        // Resize image for better performance (max 1600px)
        const resizedImage = await resizeImage(dataUrl);
        // Clear cached images from previous photo
        clearImageCache();
        // Reset all portrait settings for new image
        setPortraitRawImage(resizedImage);
        setPortrait(resizedImage);
        setPortraitZoom(1);
        setPortraitPan(0, 0);
        setPortraitBgRemoved(false, null);
        setPortraitBgOpacity(0);
        setPortraitBgBlur(0);
        setPortraitEngravingIntensity(0);
      };
      reader.readAsDataURL(file);
    },
    [setPortrait, setPortraitRawImage, setPortraitZoom, setPortraitPan, setPortraitBgRemoved, setPortraitBgOpacity, setPortraitBgBlur, setPortraitEngravingIntensity]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Apply engraving effect to an image (tint matches template hue)
  const applyEngraving = useCallback(async (sourceImage: string, intensity: number, tintHue: number): Promise<string> => {
    try {
      return await enhance(sourceImage, intensity, tintHue);
    } catch (err) {
      console.error('Enhancement failed:', err);
      return sourceImage;
    }
  }, [enhance]);

  // Remove background and cache the result
  const applyBgRemoval = useCallback(async (sourceImage: string): Promise<string> => {
    try {
      const result = await removeBg(sourceImage);
      setPortraitBgRemoved(true, result);
      return result;
    } catch (err) {
      console.error('Background removal failed:', err);
      return sourceImage;
    }
  }, [removeBg, setPortraitBgRemoved]);

  // Apply all effects in correct order: composite -> sepia
  const applyAllEffects = useCallback(async () => {
    const state = useBillStore.getState();
    const portraitState = state.portrait;
    const currentHue = state.voucherConfig.templateHue;
    if (!portraitState.rawImage) return;

    let result: string;

    if (portraitState.bgRemoved && portraitState.bgRemovedImage) {
      // Background was removed - apply composite with opacity and blur
      result = await compositeWithBackground(portraitState.bgRemovedImage, portraitState.rawImage, portraitState.bgOpacity, portraitState.bgBlur);
    } else {
      // No background removal - use raw image
      result = portraitState.rawImage;
    }

    // Apply sepia effect if intensity > 0 (tint matches template hue)
    if (portraitState.engravingIntensity > 0) {
      result = await applyEngraving(result, portraitState.engravingIntensity, currentHue);
    }

    setPortrait(result);
  }, [applyEngraving, setPortrait]);

  // Re-apply sepia effect when templateHue changes (if sepia is active)
  useEffect(() => {
    // Skip initial render and only react to actual changes
    if (templateHueRef.current === templateHue) return;
    templateHueRef.current = templateHue;

    // Only re-apply if sepia effect is active
    const state = useBillStore.getState().portrait;
    if (state.engravingIntensity > 0 && state.rawImage) {
      // Clear any pending debounce
      if (engravingDebounceRef.current) {
        clearTimeout(engravingDebounceRef.current);
      }
      // Debounce the effect application
      engravingDebounceRef.current = setTimeout(applyAllEffects, 150);
    }
  }, [templateHue, applyAllEffects]);

  const handleToggleBgRemoval = async () => {
    if (!rawImage) return;

    // If enabling and no API key, show modal
    if (!bgRemoved && !hasKey) {
      setShowApiKeyModal(true);
      return;
    }

    const newBgRemoved = !bgRemoved;

    if (newBgRemoved) {
      // Turning ON background removal
      const bgRemovedResult = await applyBgRemoval(rawImage);
      // Get current state (may have changed during async operation)
      const state = useBillStore.getState();
      const portraitState = state.portrait;
      const currentHue = state.voucherConfig.templateHue;

      // Composite with background at current opacity (starts at 0 = no background)
      let result = await compositeWithBackground(bgRemovedResult, rawImage, portraitState.bgOpacity, portraitState.bgBlur);

      // Apply sepia if intensity > 0
      if (portraitState.engravingIntensity > 0) {
        result = await applyEngraving(result, portraitState.engravingIntensity, currentHue);
      }
      setPortrait(result);
    } else {
      // Turning OFF background removal - use raw image
      setPortraitBgRemoved(false, null);
      // Get current state from store (may have changed during async operation)
      const state = useBillStore.getState();
      const currentIntensity = state.portrait.engravingIntensity;
      const currentHue = state.voucherConfig.templateHue;
      if (currentIntensity > 0) {
        const result = await applyEngraving(rawImage, currentIntensity, currentHue);
        setPortrait(result);
      } else {
        setPortrait(rawImage);
      }
    }
  };

  const handleEngravingIntensityChange = (newIntensity: number) => {
    setPortraitEngravingIntensity(newIntensity);

    // Clear any pending debounce
    if (engravingDebounceRef.current) {
      clearTimeout(engravingDebounceRef.current);
    }

    if (!rawImage) return;

    // Debounce the effect application
    engravingDebounceRef.current = setTimeout(applyAllEffects, 150);
  };

  const handleApiKeySubmit = async (key: string) => {
    setApiKey(key);

    if (!rawImage) return;

    // Apply background removal
    const bgRemovedResult = await applyBgRemoval(rawImage);
    // Get current state
    const state = useBillStore.getState();
    const portraitState = state.portrait;
    const currentHue = state.voucherConfig.templateHue;

    // Composite with background at current opacity (starts at 0 = no background)
    let result = await compositeWithBackground(bgRemovedResult, rawImage, portraitState.bgOpacity, portraitState.bgBlur);

    // Apply sepia if intensity > 0
    if (portraitState.engravingIntensity > 0) {
      result = await applyEngraving(result, portraitState.engravingIntensity, currentHue);
    }
    setPortrait(result);
  };

  // Handle background opacity change
  const handleBgOpacityChange = (newOpacity: number) => {
    setPortraitBgOpacity(newOpacity);

    // Clear any pending debounce
    if (bgOpacityDebounceRef.current) {
      clearTimeout(bgOpacityDebounceRef.current);
    }

    if (!rawImage || !bgRemovedImage) return;

    // Debounce the composite application
    bgOpacityDebounceRef.current = setTimeout(applyAllEffects, 150);
  };

  // Handle background blur change
  const handleBgBlurChange = (newBlur: number) => {
    setPortraitBgBlur(newBlur);

    // Clear any pending debounce
    if (bgOpacityDebounceRef.current) {
      clearTimeout(bgOpacityDebounceRef.current);
    }

    if (!rawImage || !bgRemovedImage) return;

    // Debounce the composite application
    bgOpacityDebounceRef.current = setTimeout(applyAllEffects, 150);
  };

  return (
    <div className="space-y-4">
      {/* Sparkle animation keyframes - three stars blink in sequence */}
      <style>{`
        @keyframes sparkle1 {
          0%, 33%, 100% { opacity: 0.3; }
          16% { opacity: 1; }
        }
        @keyframes sparkle2 {
          0%, 33%, 66%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes sparkle3 {
          0%, 66%, 100% { opacity: 0.3; }
          83% { opacity: 1; }
        }
      `}</style>
      {/* Upload Area */}
      {!portrait.original ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isRemovingBg
              ? 'border-primary bg-primary/10 pointer-events-none'
              : isDragOver
                ? 'border-primary bg-primary/10'
                : 'border-base-300 hover:border-primary hover:bg-base-200'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          {isRemovingBg ? (
            <div className="flex flex-col items-center gap-2">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="font-medium">{appLanguage === 'de' ? 'Hintergrund wird entfernt...' : 'Removing background...'}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-base-content/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="font-medium">{trans.form.portrait.upload}</p>
              <p className="text-sm text-base-content/60">{trans.form.portrait.dragDrop}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {/* Zoom and Sepia Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Zoom Slider */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">{trans.form.portrait.zoom}</span>
                <span className="label-text-alt">{Math.round(portrait.zoom * 100)}%</span>
              </label>
              <TouchSlider
                min={0.5}
                max={2}
                step={0.05}
                value={portrait.zoom}
                onChange={setPortraitZoom}
                className="range range-primary range-sm"
              />
            </div>

            {/* Color Adjustment Slider */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  {appLanguage === 'de' ? 'Farbanpassung' : 'Color adjustment'}
                  {isEnhancing && <span className="loading loading-spinner loading-xs"></span>}
                </span>
                <span className="label-text-alt">{Math.round(engravingIntensity * 100)}%</span>
              </label>
              <TouchSlider
                min={0}
                max={1}
                step={0.05}
                value={engravingIntensity}
                onChange={handleEngravingIntensityChange}
                className="range range-secondary range-sm"
                disabled={isEnhancing || !rawImage}
              />
            </div>
          </div>

          {/* Background Removal - Button or Opacity Slider */}
          {!bgRemoved ? (
            // Show button when background not yet removed
            <div className="flex justify-center">
              <button
                className="btn btn-ghost btn gap-2 text-base-content/70"
                onClick={handleToggleBgRemoval}
                disabled={isRemovingBg || !rawImage}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {/* Large star (bottom-left) */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" style={isRemovingBg ? { animation: 'sparkle1 2.4s ease-in-out infinite' } : undefined} />
                  {/* Medium star (top-right) */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" style={isRemovingBg ? { animation: 'sparkle2 2.4s ease-in-out infinite' } : undefined} />
                  {/* Small star (bottom-right) */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" style={isRemovingBg ? { animation: 'sparkle3 2.4s ease-in-out infinite' } : undefined} />
                </svg>
                {isRemovingBg
                  ? (appLanguage === 'de' ? 'Hintergrund wird entfernt...' : 'Removing background...')
                  : (appLanguage === 'de' ? 'Hintergrund entfernen' : 'Remove background')
                }
                {!isRemovingBg && !hasKey && <span className="badge badge-sm badge-outline">API</span>}
              </button>
            </div>
          ) : (
            // Show opacity and blur sliders when background has been removed
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">
                    {appLanguage === 'de' ? 'Hintergrund' : 'Background'}
                  </span>
                  <span className="label-text-alt">{Math.round(bgOpacity * 100)}%</span>
                </label>
                <TouchSlider
                  min={0}
                  max={1}
                  step={0.05}
                  value={bgOpacity}
                  onChange={handleBgOpacityChange}
                  className="range range-primary range-sm"
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">
                    {appLanguage === 'de' ? 'Unschärfe' : 'Blur'}
                  </span>
                  <span className="label-text-alt">{Math.round(bgBlur * 100)}%</span>
                </label>
                <TouchSlider
                  min={0}
                  max={1}
                  step={0.05}
                  value={bgBlur}
                  onChange={handleBgBlurChange}
                  className="range range-primary range-sm"
                  disabled={bgOpacity === 0}
                />
              </div>
            </div>
          )}

          {aiError && (
            <div className="alert alert-warning text-sm py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{aiError}</span>
            </div>
          )}
        </div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSubmit={handleApiKeySubmit}
      />
    </div>
  );
}
