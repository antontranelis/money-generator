import type { TemplateLayout, TextConfig, SignatureConfig, HourValue, Language } from '../types/bill';
import { applyHueShift, clearImageCache as clearEffectsImageCache } from './imageEffects';
import { drawBannerText } from './templateCompositor';

// Image cache to avoid reloading
const imageCache = new Map<string, HTMLImageElement>();

// Cache for hue-shifted templates: key = `${src}:${hue}`
const hueShiftedCache = new Map<string, string>();

/**
 * Clear the hue-shifted template cache
 * Call this when templateHue changes to ensure fresh rendering
 */
export function clearHueShiftedCache(): void {
  hueShiftedCache.clear();
  // Also clear the image cache to force fresh loading of templates
  // This ensures we don't get stale hue-shifted images from the cache
  imageCache.clear();
  // Clear the image cache in imageEffects.ts as well
  clearEffectsImageCache();
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function drawTemplate(
  ctx: CanvasRenderingContext2D,
  template: HTMLImageElement,
  width: number,
  height: number
): void {
  ctx.drawImage(template, 0, 0, width, height);
}

// The original template color is beige at ~29° hue
const SOURCE_HUE = 29;
const SOURCE_HUE_TOLERANCE = 5;

/**
 * Get or create a hue-shifted template image
 * Uses caching to avoid reprocessing the same hue shift
 * @param templateSrc - URL of the template image
 * @param hue - Hue shift in degrees (0-360)
 * @param targetWidth - Target width for processing (for performance)
 * @param targetHeight - Target height for processing (for performance)
 */
async function getHueShiftedTemplate(
  templateSrc: string,
  hue: number,
  targetWidth: number,
  targetHeight: number
): Promise<HTMLImageElement> {
  // No shift needed when hue is at or near source color (~29° beige)
  if (Math.abs(hue - SOURCE_HUE) <= SOURCE_HUE_TOLERANCE) {
    return loadImage(templateSrc);
  }

  // Include dimensions in cache key for different resolutions
  const cacheKey = `${templateSrc}:${hue}:${targetWidth}x${targetHeight}`;

  // Check cache first
  if (hueShiftedCache.has(cacheKey)) {
    return loadImage(hueShiftedCache.get(cacheKey)!);
  }

  // Load original template
  const originalImg = await loadImage(templateSrc);

  // Create temp canvas at TARGET size (smaller for preview, full for export)
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = targetWidth;
  tempCanvas.height = targetHeight;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('Failed to get canvas context');

  // Draw scaled to target dimensions
  tempCtx.drawImage(originalImg, 0, 0, targetWidth, targetHeight);
  const originalDataUrl = tempCanvas.toDataURL('image/png');

  // Apply hue shift (now on smaller image for preview)
  const shiftedDataUrl = await applyHueShift(originalDataUrl, hue);

  // Limit cache size
  if (hueShiftedCache.size > 20) {
    const firstKey = hueShiftedCache.keys().next().value;
    if (firstKey) hueShiftedCache.delete(firstKey);
  }

  // Cache the result
  hueShiftedCache.set(cacheKey, shiftedDataUrl);

  return loadImage(shiftedDataUrl);
}

export function drawPortraitPlaceholder(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  _language: Language = 'de'
): void {
  ctx.save();

  // Draw dashed ellipse border only - button overlay handles the rest
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.closePath();
  ctx.setLineDash([20, 10]);
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw portrait as a faded watermark with radial fade effect
 * Center is visible (~15-20% opacity), edges fade to transparent
 */
export function drawWatermarkPortrait(
  ctx: CanvasRenderingContext2D,
  portrait: HTMLImageElement,
  centerX: number,
  centerY: number,
  size: number,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0
): void {
  ctx.save();

  // Create offscreen canvas for the watermark effect
  const watermarkCanvas = document.createElement('canvas');
  watermarkCanvas.width = size;
  watermarkCanvas.height = size;
  const wmCtx = watermarkCanvas.getContext('2d');
  if (!wmCtx) {
    ctx.restore();
    return;
  }

  // Calculate image dimensions to cover the circle
  const imgAspect = portrait.width / portrait.height;
  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > 1) {
    drawHeight = size;
    drawWidth = size * imgAspect;
  } else {
    drawWidth = size;
    drawHeight = size / imgAspect;
  }

  drawWidth *= zoom;
  drawHeight *= zoom;

  const maxPanX = Math.max(0, (drawWidth - size) / 2);
  const maxPanY = Math.max(0, (drawHeight - size) / 2);

  const drawX = (size - drawWidth) / 2 + panX * maxPanX;
  const drawY = (size - drawHeight) / 2 + panY * maxPanY;

  // Draw portrait with desaturation and brightness
  wmCtx.filter = 'grayscale(70%) brightness(1.4) contrast(0.6)';
  wmCtx.drawImage(portrait, drawX, drawY, drawWidth, drawHeight);
  wmCtx.filter = 'none';

  // Apply radial gradient mask (center visible, edges transparent)
  wmCtx.globalCompositeOperation = 'destination-in';
  const gradient = wmCtx.createRadialGradient(
    size / 2, size / 2, 0,           // inner circle (center)
    size / 2, size / 2, size / 2     // outer circle (edge)
  );
  gradient.addColorStop(0, 'rgba(0,0,0,1)');      // center: fully visible
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.8)');  // mid: mostly visible
  gradient.addColorStop(0.8, 'rgba(0,0,0,0.3)');  // near edge: fading
  gradient.addColorStop(1, 'rgba(0,0,0,0)');      // edge: transparent

  wmCtx.fillStyle = gradient;
  wmCtx.fillRect(0, 0, size, size);

  // Draw the watermark onto main canvas with low opacity
  ctx.globalAlpha = 0.18;
  ctx.drawImage(watermarkCanvas, centerX - size / 2, centerY - size / 2);
  ctx.globalAlpha = 1;

  ctx.restore();
}

export function drawOvalPortrait(
  ctx: CanvasRenderingContext2D,
  portrait: HTMLImageElement,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0
): void {
  ctx.save();

  // Create elliptical clipping path
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Calculate scaling to cover the ellipse (cover, not contain)
  const imgAspect = portrait.width / portrait.height;
  const ellipseAspect = radiusX / radiusY;
  const ellipseWidth = radiusX * 2;
  const ellipseHeight = radiusY * 2;

  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > ellipseAspect) {
    // Image is wider relative to ellipse - fit by height
    drawHeight = ellipseHeight;
    drawWidth = ellipseHeight * imgAspect;
  } else {
    // Image is taller relative to ellipse - fit by width
    drawWidth = ellipseWidth;
    drawHeight = ellipseWidth / imgAspect;
  }

  // Apply zoom factor
  drawWidth *= zoom;
  drawHeight *= zoom;

  // Calculate max pan distance (how far the image extends beyond the ellipse)
  const maxPanX = Math.max(0, (drawWidth - ellipseWidth) / 2);
  const maxPanY = Math.max(0, (drawHeight - ellipseHeight) / 2);

  // Center the image within the ellipse, with pan offset
  const drawX = centerX - drawWidth / 2 + panX * maxPanX;
  const drawY = centerY - drawHeight / 2 + panY * maxPanY;

  ctx.drawImage(portrait, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  config: TextConfig,
  color: string = '#2a3a2a'
): void {
  ctx.save();

  ctx.font = `${config.fontSize}px "Times New Roman", serif`;
  ctx.textAlign = config.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;

  if (config.maxWidth) {
    ctx.fillText(text, config.x, config.y, config.maxWidth);
  } else {
    ctx.fillText(text, config.x, config.y);
  }

  ctx.restore();
}

export function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  config: TextConfig,
  color: string = '#2a3a2a'
): void {
  ctx.save();

  ctx.font = `${config.fontSize}px "Times New Roman", serif`;
  ctx.textAlign = config.align || 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;

  const maxWidth = config.maxWidth || 400;
  const lineHeight = config.lineHeight || config.fontSize * 1.4;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Calculate starting Y to center the text block
  const totalHeight = lines.length * lineHeight;
  let startY = config.y - totalHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, config.x, startY);
    startY += lineHeight;
  }

  ctx.restore();
}

export function drawContactInfo(
  ctx: CanvasRenderingContext2D,
  name: string,
  email: string,
  phone: string,
  config: TextConfig,
  color: string = '#2a3a2a'
): void {
  ctx.save();

  ctx.font = `${config.fontSize}px "Times New Roman", serif`;
  ctx.textAlign = config.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;

  const lineHeight = config.lineHeight || config.fontSize * 1.8;
  const lines = [name, email, phone].filter(Boolean);

  // Calculate starting Y to center the text block
  const totalHeight = (lines.length - 1) * lineHeight;
  let y = config.y - totalHeight / 2;

  for (const line of lines) {
    if (line) {
      ctx.fillText(line, config.x, y);
      y += lineHeight;
    }
  }

  ctx.restore();
}

export function drawSignature(
  ctx: CanvasRenderingContext2D,
  config: SignatureConfig,
  label: string,
  color: string = '#2a3a2a'
): void {
  ctx.save();

  // Draw signature line at (x, y)
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, config.labelFontSize / 16);
  ctx.beginPath();
  ctx.moveTo(config.x - config.width / 2, config.y);
  ctx.lineTo(config.x + config.width / 2, config.y);
  ctx.stroke();

  // Draw label below line
  ctx.font = `${config.labelFontSize}px "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.fillText(label, config.x, config.y + config.labelFontSize * 0.3);

  ctx.restore();
}

export async function renderFrontSide(
  canvas: HTMLCanvasElement,
  backgroundSrc: string,
  badgesSrc: string,
  frameSrc: string,
  portraitSrc: string | null,
  name: string,
  layout: TemplateLayout,
  width: number,
  height: number,
  portraitZoom: number = 1,
  portraitPanX: number = 0,
  portraitPanY: number = 0,
  templateHue: number = 0,
  hours: HourValue = 1,
  language: Language = 'de'
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Double buffering: render to off-screen canvas first to prevent white flash
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  // Clear off-screen canvas
  offCtx.clearRect(0, 0, width, height);

  // Layer 1: Draw background - WITH hue shift
  const background = await getHueShiftedTemplate(backgroundSrc, templateHue, width, height);
  drawTemplate(offCtx, background, width, height);

  // Layer 2: Draw watermark portrait on right side (if portrait available)
  if (portraitSrc) {
    try {
      const portrait = await loadImage(portraitSrc);
      // Position: right side of the bill, vertically centered
      // Size: roughly 60% of height for a prominent but subtle watermark
      const watermarkSize = height * 0.6;
      const watermarkX = width * 0.78 + 70;  // Right side
      const watermarkY = height * 0.5;  // Vertically centered
      drawWatermarkPortrait(
        offCtx,
        portrait,
        watermarkX,
        watermarkY,
        watermarkSize,
        portraitZoom,
        portraitPanX,
        portraitPanY
      );
    } catch (e) {
      console.error('Failed to draw watermark:', e);
    }
  }

  // Layer 3: Draw badges - NO hue shift (keep original colors)
  const badges = await loadImage(badgesSrc);
  drawTemplate(offCtx, badges, width, height);

  // Layer 4: Draw main portrait if available, or placeholder (UNDER the frame)
  if (portraitSrc) {
    try {
      const portrait = await loadImage(portraitSrc);
      drawOvalPortrait(
        offCtx,
        portrait,
        layout.portrait.x,
        layout.portrait.y,
        layout.portrait.radiusX,
        layout.portrait.radiusY,
        portraitZoom,
        portraitPanX,
        portraitPanY
      );
    } catch (e) {
      console.error('Failed to load portrait:', e);
    }
  } else {
    // Draw placeholder when no portrait
    drawPortraitPlaceholder(
      offCtx,
      layout.portrait.x,
      layout.portrait.y,
      layout.portrait.radiusX,
      layout.portrait.radiusY,
      language
    );
  }

  // Layer 5: Draw frame ON TOP of portrait - NO hue shift (frame stays original)
  const frame = await loadImage(frameSrc);
  drawTemplate(offCtx, frame, width, height);

  // Layer 6: Draw banner text ON TOP of frame
  // Calculate scale based on preview vs full resolution
  // Preview is 0.5 scale (width ~1816), full is 1.0 (width 3633)
  const scale = width / 3633;
  drawBannerText(offCtx, hours, language, scale);

  // Layer 7: Draw name
  if (name) {
    drawText(offCtx, name, layout.namePlate);
  }

  // Copy finished image to visible canvas in one operation (no flash)
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(offscreen, 0, 0);
}

export async function renderBackSide(
  canvas: HTMLCanvasElement,
  backgroundSrc: string,
  badgesSrc: string,
  frameSrc: string,
  portraitSrc: string | null,
  name: string,
  email: string,
  phone: string,
  description: string,
  layout: TemplateLayout,
  width: number,
  height: number,
  portraitZoom: number = 1,
  portraitPanX: number = 0,
  portraitPanY: number = 0,
  templateHue: number = 0,
  hours: HourValue = 1,
  language: Language = 'de'
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Double buffering: render to off-screen canvas first to prevent white flash
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  // Clear off-screen canvas
  offCtx.clearRect(0, 0, width, height);

  // Layer 1: Draw background - WITH hue shift
  const background = await getHueShiftedTemplate(backgroundSrc, templateHue, width, height);
  drawTemplate(offCtx, background, width, height);

  // Layer 2: Draw watermark portrait in center (if portrait available)
  if (portraitSrc) {
    try {
      const portrait = await loadImage(portraitSrc);
      // Position: center of the bill
      const watermarkSize = height * 0.6;
      const watermarkX = width * 0.5;
      const watermarkY = height * 0.5;
      drawWatermarkPortrait(
        offCtx,
        portrait,
        watermarkX,
        watermarkY,
        watermarkSize,
        portraitZoom,
        portraitPanX,
        portraitPanY
      );
    } catch (e) {
      console.error('Failed to draw watermark:', e);
    }
  }

  // Layer 3: Draw badges - NO hue shift (keep original colors)
  const badges = await loadImage(badgesSrc);
  drawTemplate(offCtx, badges, width, height);

  // Layer 4: Draw frame ON TOP - NO hue shift (frame stays original)
  const frame = await loadImage(frameSrc);
  drawTemplate(offCtx, frame, width, height);

  // Layer 5: Draw banner text ON TOP of frame
  const scale = width / 3633;
  drawBannerText(offCtx, hours, language, scale);

  // Layer 6: Draw contact info
  if (layout.contactInfo && (name || email || phone)) {
    drawContactInfo(offCtx, name, email, phone, layout.contactInfo);
  }

  // Layer 7: Draw description
  if (layout.description && description) {
    drawMultilineText(offCtx, description, layout.description);
  }

  // Layer 8: Draw name at bottom
  if (name) {
    drawText(offCtx, name, layout.namePlate);
  }

  // Layer 9: Draw signature field
  if (layout.signature) {
    const signatureLabel = language === 'de' ? 'Unterschrift' : 'Signature';
    drawSignature(offCtx, layout.signature, signatureLabel);
  }

  // Copy finished image to visible canvas in one operation (no flash)
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(offscreen, 0, 0);
}
