import { useRef, useEffect, useState, useCallback } from 'react';
import { useBillStore } from '../stores/billStore';
import { t, formatDescription } from '../constants/translations';
import { getPreviewTemplate, getPreviewLayout } from '../constants/templates';
import { renderFrontSide, renderBackSide } from '../services/canvasRenderer';

// Debounce hook for expensive operations
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function BillPreview() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const billLanguage = useBillStore((state) => state.voucherConfig.language);
  const hours = useBillStore((state) => state.voucherConfig.hours);
  const description = useBillStore((state) => state.voucherConfig.description);
  const templateHue = useBillStore((state) => state.voucherConfig.templateHue);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const portrait = useBillStore((state) => state.portrait);
  const currentSide = useBillStore((state) => state.currentSide);
  const flipSide = useBillStore((state) => state.flipSide);
  const setPortraitPan = useBillStore((state) => state.setPortraitPan);

  // Debounce templateHue to avoid expensive recalculations on every slider move
  const debouncedHue = useDebouncedValue(templateHue, 150);

  const trans = t(appLanguage);

  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFlipping, setIsFlipping] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const template = getPreviewTemplate(billLanguage, hours);
  const layout = getPreviewLayout(billLanguage);

  const currentPortrait =
    portrait.useEnhanced && portrait.enhanced ? portrait.enhanced : portrait.original;

  const displayDescription = formatDescription(billLanguage, hours, description);

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
      portrait.zoom,
      portrait.panX,
      portrait.panY,
      debouncedHue
    );
  }, [template, currentPortrait, personalInfo.name, layout, portrait.zoom, portrait.panX, portrait.panY, debouncedHue]);

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
      template.height,
      debouncedHue,
      billLanguage
    );
  }, [template, personalInfo, displayDescription, layout, debouncedHue, billLanguage]);

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      flipSide();
      setIsFlipping(false);
    }, 150);
  };

  // Check if click is within portrait area (ellipse hit test)
  const isInPortraitArea = useCallback((clientX: number, clientY: number): boolean => {
    if (!containerRef.current || currentSide !== 'front' || !portrait.original) return false;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / template.width;
    const scaleY = rect.height / template.height;

    // Convert click to template coordinates
    const templateX = (clientX - rect.left) / scaleX;
    const templateY = (clientY - rect.top) / scaleY;

    // Check if point is inside portrait ellipse
    const { x: cx, y: cy, radiusX, radiusY } = layout.front.portrait;
    const dx = (templateX - cx) / radiusX;
    const dy = (templateY - cy) / radiusY;

    return (dx * dx + dy * dy) <= 1;
  }, [currentSide, portrait.original, template.width, template.height, layout.front.portrait]);

  // Pan handlers
  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    if (portrait.zoom <= 1 || !isInPortraitArea(clientX, clientY)) return;

    setIsPanning(true);
    panStartRef.current = {
      x: clientX,
      y: clientY,
      panX: portrait.panX,
      panY: portrait.panY,
    };
  }, [portrait.zoom, portrait.panX, portrait.panY, isInPortraitArea]);

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isPanning || !panStartRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const sensitivity = 3 / Math.max(rect.width, rect.height);

    const deltaX = (clientX - panStartRef.current.x) * sensitivity;
    const deltaY = (clientY - panStartRef.current.y) * sensitivity;

    const newPanX = Math.max(-1, Math.min(1, panStartRef.current.panX + deltaX));
    const newPanY = Math.max(-1, Math.min(1, panStartRef.current.panY + deltaY));

    setPortraitPan(newPanX, newPanY);
  }, [isPanning, setPortraitPan]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (portrait.zoom > 1 && isInPortraitArea(e.clientX, e.clientY)) {
      e.preventDefault();
      handlePanStart(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handlePanMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => handlePanEnd();
  const handleMouseLeave = () => handlePanEnd();

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (portrait.zoom > 1 && isInPortraitArea(touch.clientX, touch.clientY)) {
        handlePanStart(touch.clientX, touch.clientY);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => handlePanEnd();

  // Determine cursor style
  const canPan = currentSide === 'front' && portrait.original && portrait.zoom > 1;

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
        className={`relative w-full overflow-hidden shadow-lg ${canPan ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        style={{ aspectRatio }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
