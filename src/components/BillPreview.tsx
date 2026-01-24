import { useRef, useEffect, useState, useCallback } from 'react';
import { useBillStore } from '../stores/billStore';
import { t, formatDescription } from '../constants/translations';
import { getTemplateByIdV2 } from '../templates';
import { renderTemplate, clearRendererCache } from '../templates/genericRenderer';
import type { TemplateV2 } from '../templates/schema';

// Debounce hook for expensive operations
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface BillPreviewProps {
  onPortraitClick?: () => void;
  onFileDrop?: (file: File) => void;
}

export function BillPreview({ onPortraitClick, onFileDrop }: BillPreviewProps = {}) {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const billLanguage = useBillStore((state) => state.voucherConfig.language);
  const hours = useBillStore((state) => state.voucherConfig.hours);
  const description = useBillStore((state) => state.voucherConfig.description);
  const templateHue = useBillStore((state) => state.voucherConfig.templateHue);
  const templateId = useBillStore((state) => state.voucherConfig.templateId);
  const personalInfo = useBillStore((state) => state.personalInfo);
  const portrait = useBillStore((state) => state.portrait);
  const currentSide = useBillStore((state) => state.currentSide);
  const flipSide = useBillStore((state) => state.flipSide);
  const setPortraitPan = useBillStore((state) => state.setPortraitPan);

  // Debounce templateHue to avoid expensive recalculations on every slider move
  const debouncedHue = useDebouncedValue(templateHue, 150);

  // V2 Template state - V2 is now the only renderer
  const [templateV2, setTemplateV2] = useState<TemplateV2 | null>(null);

  const trans = t(appLanguage);

  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isOverPortrait, setIsOverPortrait] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  // Pan tracking refs
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const lastPanUpdateRef = useRef<number>(0);

  // Calculate template dimensions from v2 template (fallback to standard bill size)
  const templateWidth = templateV2?.layout.dimensions.width ?? 3633;
  const templateHeight = templateV2?.layout.dimensions.height ?? 1920;

  // Use rawImage as fallback while portrait.original is being recomputed after reload
  const currentPortrait =
    portrait.useEnhanced && portrait.enhanced ? portrait.enhanced : (portrait.original || portrait.rawImage);

  const displayDescription = formatDescription(billLanguage, hours, description);

  const [isLoading, setIsLoading] = useState(true);

  // Load v2 template when templateId changes
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    async function loadV2Template() {
      try {
        clearRendererCache();
        const tmpl = await getTemplateByIdV2(templateId);
        if (mounted) {
          setTemplateV2(tmpl);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[BillPreview] Failed to load template:', err);
        if (mounted) {
          setTemplateV2(null);
          setIsLoading(false);
        }
      }
    }

    loadV2Template();
    return () => { mounted = false; };
  }, [templateId]);

  // Helper to load portrait image for v2 renderer
  const loadPortraitImage = useCallback(async (dataUrl: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }, []);

  // Render front side with v2 renderer
  useEffect(() => {
    if (!frontCanvasRef.current || !templateV2) return;
    let cancelled = false;

    const render = async () => {
      const renderData: Record<string, unknown> = {
        name: personalInfo.name || '',
        hours: hours,
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        description: displayDescription,
      };

      let portraitImage: HTMLImageElement | null = null;
      if (currentPortrait) {
        portraitImage = await loadPortraitImage(currentPortrait);
      }

      // Don't render if effect was cancelled (dependencies changed)
      if (cancelled || !frontCanvasRef.current) return;

      await renderTemplate(frontCanvasRef.current, templateV2, renderData, 'front', {
        scale: 0.5,
        hue: debouncedHue,
        language: billLanguage,
        portraitImage,
        portraitTransform: {
          scale: portrait.zoom,
          offsetX: portrait.panX,
          offsetY: portrait.panY,
        },
      });
    };

    render();
    return () => { cancelled = true; };
  }, [templateV2, currentPortrait, personalInfo, displayDescription, portrait.zoom, portrait.panX, portrait.panY, debouncedHue, hours, billLanguage, loadPortraitImage]);

  // Render back side with v2 renderer
  useEffect(() => {
    if (!backCanvasRef.current || !templateV2) return;
    let cancelled = false;

    const render = async () => {
      const renderData: Record<string, unknown> = {
        name: personalInfo.name || '',
        hours: hours,
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        description: displayDescription,
      };

      let portraitImage: HTMLImageElement | null = null;
      if (currentPortrait) {
        portraitImage = await loadPortraitImage(currentPortrait);
      }

      // Don't render if effect was cancelled (dependencies changed)
      if (cancelled || !backCanvasRef.current) return;

      await renderTemplate(backCanvasRef.current, templateV2, renderData, 'back', {
        scale: 0.5,
        hue: debouncedHue,
        language: billLanguage,
        portraitImage,
        portraitTransform: {
          scale: portrait.zoom,
          offsetX: portrait.panX,
          offsetY: portrait.panY,
        },
      });
    };

    render();
    return () => { cancelled = true; };
  }, [templateV2, currentPortrait, personalInfo, displayDescription, portrait.zoom, portrait.panX, portrait.panY, debouncedHue, hours, billLanguage, loadPortraitImage]);

  const handleFlip = () => {
    // Toggle the visual flip animation
    setIsFlipped(!isFlipped);
    // Toggle the logical side state
    flipSide();
  };

  // Sync isFlipped with currentSide state (for when side is changed externally)
  useEffect(() => {
    setIsFlipped(currentSide === 'back');
  }, [currentSide]);

  // Check if click is within portrait area (ellipse hit test)
  const isInPortraitArea = useCallback((clientX: number, clientY: number): boolean => {
    if (!containerRef.current || currentSide !== 'front') return false;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / templateWidth;
    const scaleY = rect.height / templateHeight;

    // Convert click to template coordinates
    const templateX = (clientX - rect.left) / scaleX;
    const templateY = (clientY - rect.top) / scaleY;

    // Get portrait dimensions from v2 template
    if (!templateV2) return false;

    const portraitLayer = templateV2.layout.front.layers.find(
      (layer) => layer.type === 'field' && 'fieldId' in layer && layer.fieldId === 'portrait'
    );
    if (!portraitLayer || !('position' in portraitLayer) || !('size' in portraitLayer)) {
      return false;
    }

    const cx = portraitLayer.position.x;
    const cy = portraitLayer.position.y;
    const size = portraitLayer.size as { radiusX?: number; radiusY?: number };
    const radiusX = size?.radiusX || 500;
    const radiusY = size?.radiusY || 500;

    const dx = (templateX - cx) / radiusX;
    const dy = (templateY - cy) / radiusY;

    return (dx * dx + dy * dy) <= 1;
  }, [currentSide, templateWidth, templateHeight, templateV2]);

  // Drag threshold in pixels - movement below this is considered a click
  const DRAG_THRESHOLD = 5;

  // Pan handlers
  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    // Allow panning when portrait exists
    if (!portrait.original) return;

    setIsPanning(true);
    panStartRef.current = {
      x: clientX,
      y: clientY,
      panX: portrait.panX,
      panY: portrait.panY,
    };
  }, [portrait.original, portrait.panX, portrait.panY]);

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isPanning || !panStartRef.current || !containerRef.current) return;

    // Throttle updates to ~30fps (every 33ms) for smooth but performant panning
    const now = performance.now();
    if (now - lastPanUpdateRef.current < 33) return;
    lastPanUpdateRef.current = now;

    const rect = containerRef.current.getBoundingClientRect();
    // Scale sensitivity with zoom - higher zoom needs more sensitivity for 1:1 feel
    const baseSensitivity = 4 / Math.max(rect.width, rect.height);
    const sensitivity = baseSensitivity * portrait.zoom;

    const deltaX = (clientX - panStartRef.current.x) * sensitivity;
    const deltaY = (clientY - panStartRef.current.y) * sensitivity;

    const newPanX = Math.max(-1, Math.min(1, panStartRef.current.panX + deltaX));
    const newPanY = Math.max(-1, Math.min(1, panStartRef.current.panY + deltaY));

    setPortraitPan(newPanX, newPanY);
  }, [isPanning, setPortraitPan, portrait.zoom]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
    mouseDownPosRef.current = null;
  }, []);

  // Handle click on portrait area (for upload/replace)
  const handlePortraitAreaClick = useCallback(() => {
    if (onPortraitClick) {
      onPortraitClick();
    }
  }, [onPortraitClick]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isInPortraitArea(e.clientX, e.clientY)) {
      e.preventDefault();
      // Store initial position and reset drag flag
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
      didDragRef.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update cursor state based on position
    setIsOverPortrait(isInPortraitArea(e.clientX, e.clientY));

    // Check if we should start panning (mouse is down and moved beyond threshold)
    if (mouseDownPosRef.current && portrait.original) {
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > DRAG_THRESHOLD && !isPanning) {
        // Start panning
        didDragRef.current = true;
        handlePanStart(mouseDownPosRef.current.x, mouseDownPosRef.current.y);
      }
    }

    // Continue panning if already started
    if (isPanning) {
      handlePanMove(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // If we didn't drag, treat as click (open file dialog)
    if (mouseDownPosRef.current && !didDragRef.current && isInPortraitArea(e.clientX, e.clientY)) {
      handlePortraitAreaClick();
    }
    handlePanEnd();
  };

  const handleMouseLeave = () => {
    handlePanEnd();
    setIsOverPortrait(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (isInPortraitArea(touch.clientX, touch.clientY)) {
        // Store initial position and reset drag flag
        mouseDownPosRef.current = { x: touch.clientX, y: touch.clientY };
        didDragRef.current = false;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && mouseDownPosRef.current && portrait.original) {
      const touch = e.touches[0];
      const dx = touch.clientX - mouseDownPosRef.current.x;
      const dy = touch.clientY - mouseDownPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > DRAG_THRESHOLD && !isPanning) {
        // Start panning
        didDragRef.current = true;
        handlePanStart(mouseDownPosRef.current.x, mouseDownPosRef.current.y);
      }

      // Continue panning if already started
      if (isPanning) {
        handlePanMove(touch.clientX, touch.clientY);
      }
    }
  };

  const handleTouchEnd = () => {
    // If we didn't drag, treat as click (open file dialog)
    if (mouseDownPosRef.current && !didDragRef.current) {
      // Use the stored position since touch has ended
      if (isInPortraitArea(mouseDownPosRef.current.x, mouseDownPosRef.current.y)) {
        handlePortraitAreaClick();
      }
    }
    handlePanEnd();
  };

  // Use ref to track panning state for event listener
  const isPanningRef = useRef(false);
  useEffect(() => {
    isPanningRef.current = isPanning;
  }, [isPanning]);

  // Prevent page scroll while panning the portrait
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isPanningRef.current) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      container.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Determine cursor style for panning
  const canPan = currentSide === 'front' && portrait.original;

  // Calculate aspect ratio for responsive sizing
  const aspectRatio = templateWidth / templateHeight;

  return (
    <div className="space-y-2">
      {/* Controls - above preview */}
      <div className="flex justify-between items-center mb-6">
        <div className="join border border-base-300 rounded-lg">
          <button
            className={`join-item btn btn-md ${currentSide === 'front' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => currentSide !== 'front' && handleFlip()}
          >
            {trans.preview.front}
          </button>
          <button
            className={`join-item btn btn-md ${currentSide === 'back' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => currentSide !== 'back' && handleFlip()}
          >
            {trans.preview.back}
          </button>
        </div>

        <button className="btn btn-ghost btn-md" onClick={handleFlip}>
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
          <span className="hidden sm:inline">{trans.preview.flip}</span>
        </button>
      </div>

      {/* Canvas Container with 3D perspective */}
      <div
        className="relative w-full overflow-visible"
        style={{ aspectRatio, perspective: '1500px' }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-300 rounded-lg z-10">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {/* Flip container - rotates on Y axis */}
        <div
          ref={containerRef}
          className={`relative w-full h-full shadow-lg ${isOverPortrait && canPan ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s ease-in-out, opacity 0.3s ease-in-out',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragOver={(e) => {
            e.preventDefault();
            if (currentSide === 'front') {
              setIsDragOver(true);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (currentSide === 'front' && onFileDrop) {
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith('image/')) {
                onFileDrop(file);
              }
            }
          }}
        >
          {/* Front Canvas */}
          <canvas
            ref={frontCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          />

          {/* Back Canvas - pre-rotated 180deg so it shows correctly when flipped */}
          <canvas
            ref={backCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          />

          {/* Portrait upload overlay - only shown when no photo exists */}
          {currentSide === 'front' && !portrait.original && templateV2 && (() => {
            // Get portrait position from v2 template
            const portraitLayer = templateV2.layout.front.layers.find(
              (layer) => layer.type === 'field' && 'fieldId' in layer && layer.fieldId === 'portrait'
            );
            if (!portraitLayer || !('position' in portraitLayer) || !('size' in portraitLayer)) {
              return null;
            }

            const px = portraitLayer.position.x;
            const py = portraitLayer.position.y;
            const size = portraitLayer.size as { radiusX?: number; radiusY?: number };
            const pRadiusX = size?.radiusX || 500;
            const pRadiusY = size?.radiusY || 500;

            return (
            <div
              className={`absolute flex flex-col items-center justify-center transition-colors duration-300 ease-in-out pointer-events-none ${
                isDragOver ? 'bg-primary/20' : 'hover:bg-base-content/5'
              }`}
              style={{
                left: `${((px - pRadiusX) / templateWidth) * 100}%`,
                top: `${((py - pRadiusY) / templateHeight) * 100}%`,
                width: `${((pRadiusX * 2) / templateWidth) * 100}%`,
                height: `${((pRadiusY * 2) / templateHeight) * 100}%`,
                borderRadius: '50%',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <button
                className="btn btn-dash hover:btn-dash hover:border-base-content/60 flex flex-col items-center gap-0.5 sm:gap-1 h-auto py-1.5 px-2.5 sm:py-3 sm:px-4 bg-base-100/20 hover:bg-base-100/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-6 sm:w-10 sm:h-9 text-base-content/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
                <span className="text-[10px] sm:text-xs text-center leading-tight whitespace-pre-line">{appLanguage === 'de' ? 'Foto\nhochladen' : 'Upload\nphoto'}</span>
              </button>
            </div>
            );
          })()}
        </div>
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
