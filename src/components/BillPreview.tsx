import { useRef, useEffect, useState } from 'react';
import { useBillStore } from '../stores/billStore';
import { t, formatDescription } from '../constants/translations';
import { getTemplate, getLayout } from '../constants/templates';
import { renderFrontSide, renderBackSide } from '../services/canvasRenderer';

export function BillPreview() {
  const language = useBillStore((state) => state.voucherConfig.language);
  const hours = useBillStore((state) => state.voucherConfig.hours);
  const description = useBillStore((state) => state.voucherConfig.description);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const portrait = useBillStore((state) => state.portrait);
  const currentSide = useBillStore((state) => state.currentSide);
  const flipSide = useBillStore((state) => state.flipSide);

  const trans = t(language);

  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFlipping, setIsFlipping] = useState(false);

  const template = getTemplate(language, hours);
  const layout = getLayout(language);

  const currentPortrait =
    portrait.useEnhanced && portrait.enhanced ? portrait.enhanced : portrait.original;

  const displayDescription = formatDescription(language, hours, description);

  // Render front side
  useEffect(() => {
    if (!frontCanvasRef.current) return;

    renderFrontSide(
      frontCanvasRef.current,
      template.front,
      currentPortrait,
      personalInfo.name,
      layout.front,
      template.width,
      template.height,
      portrait.zoom
    );
  }, [template, currentPortrait, personalInfo.name, layout, portrait.zoom]);

  // Render back side
  useEffect(() => {
    if (!backCanvasRef.current) return;

    renderBackSide(
      backCanvasRef.current,
      template.back,
      personalInfo.name,
      personalInfo.email,
      personalInfo.phone,
      displayDescription,
      layout.back,
      template.width,
      template.height
    );
  }, [template, personalInfo, displayDescription, layout]);

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      flipSide();
      setIsFlipping(false);
    }, 150);
  };

  // Calculate aspect ratio for responsive sizing
  const aspectRatio = template.width / template.height;

  return (
    <div className="space-y-4">
      {/* Controls - above preview */}
      <div className="flex justify-between items-center">
        <div className="tabs tabs-boxed bg-base-200">
          <button
            className={`tab ${currentSide === 'front' ? 'tab-active bg-primary text-primary-content font-semibold' : ''}`}
            onClick={() => currentSide !== 'front' && handleFlip()}
          >
            {trans.preview.front}
          </button>
          <button
            className={`tab ${currentSide === 'back' ? 'tab-active bg-primary text-primary-content font-semibold' : ''}`}
            onClick={() => currentSide !== 'back' && handleFlip()}
          >
            {trans.preview.back}
          </button>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={handleFlip}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {trans.preview.flip}
        </button>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden  shadow-lg"
        style={{ aspectRatio }}
      >
        {/* Front Canvas */}
        <canvas
          ref={frontCanvasRef}
          className={`absolute inset-0 w-full h-full transition-all duration-300 ${
            currentSide === 'front'
              ? isFlipping
                ? 'opacity-0 scale-95'
                : 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        />

        {/* Back Canvas */}
        <canvas
          ref={backCanvasRef}
          className={`absolute inset-0 w-full h-full transition-all duration-300 ${
            currentSide === 'back'
              ? isFlipping
                ? 'opacity-0 scale-95'
                : 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        />
      </div>
    </div>
  );
}

// Export canvas refs for PDF generation
export function useBillCanvasRefs() {
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  return { frontCanvasRef, backCanvasRef };
}
