import { useCallback, useRef, useState } from 'react';
import { useBillStore } from '../stores/billStore';
import { t } from '../constants/translations';
import { useStabilityAI } from '../hooks/useStabilityAI';
import { ApiKeyModal } from './ApiKeyModal';

export function PortraitUpload() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const portrait = useBillStore((state) => state.portrait);
  const setPortrait = useBillStore((state) => state.setPortrait);
  const setEnhancedPortrait = useBillStore((state) => state.setEnhancedPortrait);
  const toggleUseEnhanced = useBillStore((state) => state.toggleUseEnhanced);
  const setPortraitZoom = useBillStore((state) => state.setPortraitZoom);

  const { enhance, isEnhancing, error: aiError, hasKey, setApiKey } = useStabilityAI();

  const trans = t(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPortrait(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [setPortrait]
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

  const handleEnhance = async () => {
    if (!portrait.original) return;

    // If no API key, show modal to ask for one (but will still use fallback)
    if (!hasKey) {
      setShowApiKeyModal(true);
      return;
    }

    try {
      const enhanced = await enhance(portrait.original, 'vintage');
      setEnhancedPortrait(enhanced);
    } catch (err) {
      console.error('Enhancement failed:', err);
    }
  };

  const handleApiKeySubmit = async (key: string) => {
    setApiKey(key);
    // After setting key, try to enhance
    if (portrait.original) {
      try {
        const enhanced = await enhance(portrait.original, 'vintage');
        setEnhancedPortrait(enhanced);
      } catch (err) {
        console.error('Enhancement failed:', err);
      }
    }
  };

  const handleRemove = () => {
    setPortrait(null);
  };

  const currentPortrait = portrait.useEnhanced && portrait.enhanced ? portrait.enhanced : portrait.original;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!portrait.original ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragOver
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
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-currency-gold shadow-lg">
                <img
                  src={currentPortrait || ''}
                  alt="Portrait"
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${portrait.zoom})` }}
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
          </div>

          {/* Zoom Slider */}
          <div className="form-control">
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
              onChange={(e) => setPortraitZoom(parseFloat(e.target.value))}
              className="range range-primary range-sm"
            />
          </div>

          {/* AI Enhancement - only show if API key is present */}
          {hasKey && (
            <div className="flex flex-col gap-2">
              <button
                className={`btn btn-secondary ${isEnhancing ? 'loading' : ''}`}
                onClick={handleEnhance}
                disabled={isEnhancing}
              >
                {isEnhancing ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {trans.form.portrait.enhancing}
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    {trans.form.portrait.enhance}
                  </>
                )}
              </button>

              {aiError && (
                <div className="alert alert-warning text-sm py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{aiError}</span>
                </div>
              )}

              {portrait.enhanced && (
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={portrait.useEnhanced}
                      onChange={toggleUseEnhanced}
                    />
                    <span className="label-text">
                      {portrait.useEnhanced
                        ? trans.form.portrait.useEnhanced
                        : trans.form.portrait.useOriginal}
                    </span>
                  </label>
                </div>
              )}
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
