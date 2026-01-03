import type { TemplateLayout, TextConfig, SignatureConfig } from '../types/bill';
import { applyHueShift } from './imageEffects';

// Image cache to avoid reloading
const imageCache = new Map<string, HTMLImageElement>();

// Cache for hue-shifted templates: key = `${src}:${hue}`
const hueShiftedCache = new Map<string, string>();

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
  // No shift needed when hue is at source color (~160°)
  // Use a small tolerance range (155-165) for "original"
  if (hue >= 155 && hue <= 165) {
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
  templateSrc: string,
  portraitSrc: string | null,
  name: string,
  layout: TemplateLayout,
  width: number,
  height: number,
  portraitZoom: number = 1,
  portraitPanX: number = 0,
  portraitPanY: number = 0,
  templateHue: number = 0
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

  // Draw template (with optional hue shift)
  const template = await getHueShiftedTemplate(templateSrc, templateHue, width, height);
  drawTemplate(offCtx, template, width, height);

  // Draw portrait if available
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
  }

  // Draw name
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
  templateSrc: string,
  name: string,
  email: string,
  phone: string,
  description: string,
  layout: TemplateLayout,
  width: number,
  height: number,
  templateHue: number = 0,
  language: 'de' | 'en' = 'de'
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

  // Draw template (with optional hue shift)
  const template = await getHueShiftedTemplate(templateSrc, templateHue, width, height);
  drawTemplate(offCtx, template, width, height);

  // Draw contact info
  if (layout.contactInfo && (name || email || phone)) {
    drawContactInfo(offCtx, name, email, phone, layout.contactInfo);
  }

  // Draw description
  if (layout.description && description) {
    drawMultilineText(offCtx, description, layout.description);
  }

  // Draw name at bottom
  if (name) {
    drawText(offCtx, name, layout.namePlate);
  }

  // Draw signature field
  if (layout.signature) {
    const signatureLabel = language === 'de' ? 'Unterschrift' : 'Signature';
    drawSignature(offCtx, layout.signature, signatureLabel);
  }

  // Copy finished image to visible canvas in one operation (no flash)
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(offscreen, 0, 0);
}
