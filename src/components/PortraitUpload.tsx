import { useCallback, useRef, useState, useEffect } from 'react';
import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';
import { useStabilityAI } from '../hooks/useStabilityAI';
import { ApiKeyModal } from './ApiKeyModal';
import { resizeImage, compositeWithBackground, clearImageCache } from '../services/imageEffects';

export function PortraitUpload() {
  const language = useBillStore((state) => state.voucherConfig.language);
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

  const trans = t(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

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
        // Store raw image and set as portrait
        setPortraitRawImage(resizedImage);
        setPortrait(resizedImage);
        setPortraitBgRemoved(false, null);
        setPortraitEngravingIntensity(0);
      };
      reader.readAsDataURL(file);
    },
    [setPortrait, setPortraitRawImage, setPortraitBgRemoved, setPortraitEngravingIntensity]
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

  // Apply engraving effect to an image
  const applyEngraving = useCallback(async (sourceImage: string, intensity: number): Promise<string> => {
    try {
      return await enhance(sourceImage, intensity);
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
    const state = useBillStore.getState().portrait;
    if (!state.rawImage) return;

    let result: string;

    if (state.bgRemoved && state.bgRemovedImage) {
      // Background was removed - apply composite with opacity and blur
      result = await compositeWithBackground(state.bgRemovedImage, state.rawImage, state.bgOpacity, state.bgBlur);
    } else {
      // No background removal - use raw image
      result = state.rawImage;
    }

    // Apply sepia effect if intensity > 0
    if (state.engravingIntensity > 0) {
      result = await applyEngraving(result, state.engravingIntensity);
    }

    setPortrait(result);
  }, [applyEngraving, setPortrait]);

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
      const state = useBillStore.getState().portrait;

      // Composite with background at current opacity (starts at 0 = no background)
      let result = await compositeWithBackground(bgRemovedResult, rawImage, state.bgOpacity, state.bgBlur);

      // Apply sepia if intensity > 0
      if (state.engravingIntensity > 0) {
        result = await applyEngraving(result, state.engravingIntensity);
      }
      setPortrait(result);
    } else {
      // Turning OFF background removal - use raw image
      setPortraitBgRemoved(false, null);
      // Get current intensity from store (may have changed during async operation)
      const currentIntensity = useBillStore.getState().portrait.engravingIntensity;
      if (currentIntensity > 0) {
        const result = await applyEngraving(rawImage, currentIntensity);
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
    const state = useBillStore.getState().portrait;

    // Composite with background at current opacity (starts at 0 = no background)
    let result = await compositeWithBackground(bgRemovedResult, rawImage, state.bgOpacity, state.bgBlur);

    // Apply sepia if intensity > 0
    if (state.engravingIntensity > 0) {
      result = await applyEngraving(result, state.engravingIntensity);
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

  const handleRemove = () => {
    setPortrait(null);
    setPortraitRawImage(null);
    setPortraitBgRemoved(false, null);
    setPortraitBgOpacity(0);
    setPortraitBgBlur(0);
    setPortraitEngravingIntensity(0);
    // Clear cached images to free memory
    clearImageCache();
  };

  // Pan handlers for dragging the portrait when zoomed
  const handlePanStart = (clientX: number, clientY: number) => {
    if (portrait.zoom <= 1) return; // Only allow panning when zoomed in
    setIsPanning(true);
    panStartRef.current = {
      x: clientX,
      y: clientY,
      panX: portrait.panX,
      panY: portrait.panY,
    };
  };

  const handlePanMove = (clientX: number, clientY: number) => {
    if (!isPanning || !panStartRef.current || !portraitRef.current) return;

    const rect = portraitRef.current.getBoundingClientRect();
    const sensitivity = 2 / Math.max(rect.width, rect.height); // Normalize by element size

    const deltaX = (clientX - panStartRef.current.x) * sensitivity;
    const deltaY = (clientY - panStartRef.current.y) * sensitivity;

    // Calculate new pan values (clamped to -1 to 1)
    const newPanX = Math.max(-1, Math.min(1, panStartRef.current.panX + deltaX));
    const newPanY = Math.max(-1, Math.min(1, panStartRef.current.panY + deltaY));

    setPortraitPan(newPanX, newPanY);
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePanStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handlePanMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handlePanEnd();
  };

  const handleMouseLeave = () => {
    handlePanEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    handlePanEnd();
  };

  return (
    <div className="space-y-4">
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
              <p className="font-medium">{language === 'de' ? 'Hintergrund wird entfernt...' : 'Removing background...'}</p>
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
        <div className="flex flex-col items-center space-y-4">
          {/* Preview */}
          <div className="relative">
            <div
              ref={portraitRef}
              className={`w-32 h-32 rounded-full overflow-hidden border-4 border-currency-gold shadow-lg ${
                portrait.zoom > 1 ? 'cursor-grab' : ''
              } ${isPanning ? 'cursor-grabbing' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={portrait.original || ''}
                alt="Portrait"
                className="w-full h-full object-cover pointer-events-none select-none"
                style={{
                  transform: `scale(${portrait.zoom}) translate(${portrait.panX * 50 * (portrait.zoom - 1)}%, ${portrait.panY * 50 * (portrait.zoom - 1)}%)`,
                }}
                draggable={false}
              />
            </div>
            <button
              className="btn btn-circle btn-xs btn-error absolute -top-1 -right-1"
              onClick={handleRemove}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Zoom and Sepia Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Zoom Slider */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">{trans.form.portrait.zoom}</span>
                <span className="label-text-alt">{Math.round(portrait.zoom * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={portrait.zoom}
                onChange={(e) => {
                  const newZoom = parseFloat(e.target.value);
                  setPortraitZoom(newZoom);
                  // Reset pan when zooming out to 1 or less
                  if (newZoom <= 1 && (portrait.panX !== 0 || portrait.panY !== 0)) {
                    setPortraitPan(0, 0);
                  }
                }}
                className="range range-primary range-sm"
              />
            </div>

            {/* Engraving Effect Slider */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  {language === 'de' ? 'Sepia-Effekt' : 'Sepia effect'}
                  {isEnhancing && <span className="loading loading-spinner loading-xs"></span>}
                </span>
                <span className="label-text-alt">{Math.round(engravingIntensity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={engravingIntensity}
                onChange={(e) => handleEngravingIntensityChange(parseFloat(e.target.value))}
                className="range range-secondary range-sm"
                disabled={isEnhancing || !rawImage}
              />
            </div>
          </div>

          {/* Background Removal - Toggle or Opacity Slider */}
          {!bgRemoved ? (
            // Show toggle when background not yet removed
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className={`toggle toggle-primary ${isRemovingBg ? 'opacity-50' : ''}`}
                  checked={bgRemoved}
                  onChange={handleToggleBgRemoval}
                  disabled={isRemovingBg || !rawImage}
                />
                <span className="label-text flex items-center gap-2">
                  {isRemovingBg ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      {language === 'de' ? 'Hintergrund wird entfernt...' : 'Removing background...'}
                    </>
                  ) : (
                    language === 'de' ? 'Hintergrund entfernen' : 'Remove background'
                  )}
                  {!hasKey && (
                    <span className="badge badge-sm badge-outline">API</span>
                  )}
                </span>
              </label>
            </div>
          ) : (
            // Show opacity and blur sliders when background has been removed
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">
                    {language === 'de' ? 'Hintergrund' : 'Background'}
                  </span>
                  <span className="label-text-alt">{Math.round(bgOpacity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgOpacity}
                  onChange={(e) => handleBgOpacityChange(parseFloat(e.target.value))}
                  className="range range-primary range-sm"
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">
                    {language === 'de' ? 'Unschärfe' : 'Blur'}
                  </span>
                  <span className="label-text-alt">{Math.round(bgBlur * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgBlur}
                  onChange={(e) => handleBgBlurChange(parseFloat(e.target.value))}
                  className="range range-primary range-sm"
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
