import type { HourValue, Language } from '../types/bill';
import { loadImage } from './canvasRenderer';

// Use Vite's BASE_URL if available, otherwise default to '/'
const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL || '/';

// Layer paths for compositing
const LAYERS = {
  background: `${base}templates/background.webp`,
  frontFrame: `${base}templates/front_frame.webp`,
  backFrame: `${base}templates/back_frame.webp`,
};

// Number badge paths
const NUMBER_BADGES: Record<HourValue, string> = {
  1: `${base}templates/1.png`,
  5: `${base}templates/5.png`,
  10: `${base}templates/10.png`,
};

// Translations for banner text
const TRANSLATIONS = {
  de: {
    banner: {
      1: 'EINE STUNDE',
      5: 'FÜNF STUNDEN',
      10: 'ZEHN STUNDEN',
    },
  },
  en: {
    banner: {
      1: 'ONE HOUR',
      5: 'FIVE HOURS',
      10: 'TEN HOURS',
    },
  },
};

// Template dimensions (3633x1920 - native webp resolution for 600 DPI)
export const TEMPLATE_WIDTH = 3633;
export const TEMPLATE_HEIGHT = 1920;

// Preview scale factor (0.75 = 2725x1440, higher quality preview)
const PREVIEW_SCALE = 0.5;
export const PREVIEW_WIDTH = Math.round(TEMPLATE_WIDTH * PREVIEW_SCALE);
export const PREVIEW_HEIGHT = Math.round(TEMPLATE_HEIGHT * PREVIEW_SCALE);

// Badge size scaled for 3633x1920 resolution
const BADGE_SIZE = 330;

// Layout positions for compositing (relative to 3633x1920)
// These positions are calibrated to match the ornament positions in the template
const LAYOUT = {
  // Number badge positions (4 corners) - centered at ornament positions
  badges: {
    topLeft: { x: 282, y: 237 },
    topRight: { x: 3340, y: 230 },
    bottomLeft: { x: 282, y: 1655 },
    bottomRight: { x: 3345, y: 1655 },
  },
  // Banner arc text settings
  banner: {
    centerX: 1816,      // Center X of the arc
    centerY: 3820,      // Center Y of the arc (far below banner = subtle curve)
    radius: 3610,       // Large radius = gentle curve
    fontSize: 103,
    color: '#2a3a2a',
  },
};

// Separate caches for preview (small) and full resolution
const previewCache = new Map<string, string>();
const fullResCache = new Map<string, string>();

// Cache for base layer (background + badges, without frame)
const baseLayerCache = new Map<string, string>();

// Cache for frame layer (scaled frame images)
const frameLayerCache = new Map<string, string>();

/**
 * Draw text along an arc (curved text for banner)
 * The arc center is below the text, so text curves upward (like a smile)
 * @param ctx - Canvas 2D context
 * @param text - Text to draw
 * @param centerX - X coordinate of arc center
 * @param centerY - Y coordinate of arc center (should be below the text)
 * @param radius - Radius of the arc
 * @param fontSize - Font size in pixels
 * @param color - Text color
 */
function drawTextOnArc(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  radius: number,
  fontSize: number,
  color: string
): void {
  ctx.save();
  ctx.font = `900 ${fontSize}px "Times New Roman", Georgia, serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Measure total text width
  const textWidth = ctx.measureText(text).width;

  // Calculate the angle span based on text width and radius
  // Arc length = radius * angle, so angle = arc_length / radius
  const angleSpan = textWidth / radius;

  // Center the text on the arc (at -90 degrees = top of circle)
  const startAngle = -Math.PI / 2 - angleSpan / 2;

  // Get individual character widths
  const chars = text.split('');
  const charWidths: number[] = [];
  for (const char of chars) {
    charWidths.push(ctx.measureText(char).width);
  }

  // Draw each character
  let currentAngle = startAngle;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const charWidth = charWidths[i];

    // Angle for this character's center
    const charAngle = currentAngle + (charWidth / 2) / radius;

    // Calculate position on arc
    const x = centerX + radius * Math.cos(charAngle);
    const y = centerY + radius * Math.sin(charAngle);

    ctx.save();
    ctx.translate(x, y);
    // Rotate to follow the arc tangent, +90° to make text upright
    ctx.rotate(charAngle + Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();

    // Move to next character
    currentAngle += charWidth / radius;
  }

  ctx.restore();
}

// Preloaded images for faster compositing
let preloadedImages: {
  background: HTMLImageElement | null;
  frontFrame: HTMLImageElement | null;
  backFrame: HTMLImageElement | null;
  badges: Record<HourValue, HTMLImageElement | null>;
} = {
  background: null,
  frontFrame: null,
  backFrame: null,
  badges: { 1: null, 5: null, 10: null },
};

/**
 * Preload base images for faster compositing
 */
export async function preloadBaseImages(): Promise<void> {
  const [background, frontFrame, backFrame, badge1, badge5, badge10] = await Promise.all([
    loadImage(LAYERS.background),
    loadImage(LAYERS.frontFrame),
    loadImage(LAYERS.backFrame),
    loadImage(NUMBER_BADGES[1]),
    loadImage(NUMBER_BADGES[5]),
    loadImage(NUMBER_BADGES[10]),
  ]);
  preloadedImages = {
    background,
    frontFrame,
    backFrame,
    badges: { 1: badge1, 5: badge5, 10: badge10 },
  };
}

/**
 * Compose base layer (background + badges) without frame or banner
 * This layer goes UNDER the portrait
 * Banner text is drawn separately AFTER the frame
 */
function composeBaseLayer(
  _hours: HourValue,
  _language: Language,
  scale: number,
  background: HTMLImageElement,
  badge: HTMLImageElement
): string {
  const width = Math.round(TEMPLATE_WIDTH * scale);
  const height = Math.round(TEMPLATE_HEIGHT * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Layer 1: Draw background
  ctx.drawImage(background, 0, 0, width, height);

  // Layer 2: Draw badges at scaled positions
  const badgeSize = BADGE_SIZE * scale;
  const halfBadge = badgeSize / 2;
  const badgePositions = LAYOUT.badges;

  const drawBadge = (pos: { x: number; y: number }) => {
    const x = pos.x * scale - halfBadge;
    const y = pos.y * scale - halfBadge;
    ctx.drawImage(badge, x, y, badgeSize, badgeSize);
  };

  drawBadge(badgePositions.topLeft);
  drawBadge(badgePositions.topRight);
  drawBadge(badgePositions.bottomLeft);
  drawBadge(badgePositions.bottomRight);

  // NOTE: Banner text is NOT drawn here - it must be drawn AFTER the frame
  // to appear on top of everything

  const quality = scale < 1 ? 0.8 : 0.95;
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Get banner text for a given hour value and language
 */
export function getBannerText(hours: HourValue, language: Language): string {
  return TRANSLATIONS[language].banner[hours];
}

/**
 * Get banner layout configuration (scaled)
 */
export function getBannerConfig(scale: number = 1) {
  return {
    centerX: LAYOUT.banner.centerX * scale,
    centerY: LAYOUT.banner.centerY * scale,
    radius: LAYOUT.banner.radius * scale,
    fontSize: LAYOUT.banner.fontSize * scale,
    color: LAYOUT.banner.color,
  };
}

/**
 * Draw banner text on a canvas context
 */
export function drawBannerText(
  ctx: CanvasRenderingContext2D,
  hours: HourValue,
  language: Language,
  scale: number = 1
): void {
  const bannerText = TRANSLATIONS[language].banner[hours];
  drawTextOnArc(
    ctx,
    bannerText,
    LAYOUT.banner.centerX * scale,
    LAYOUT.banner.centerY * scale,
    LAYOUT.banner.radius * scale,
    LAYOUT.banner.fontSize * scale,
    LAYOUT.banner.color
  );
}

/**
 * Internal function to compose template at given scale
 * Layer order (bottom to top):
 * 1. Background
 * 2. Badges (number overlays)
 * 3. Frame (front or back)
 * 4. Banner text
 */
function composeTemplateInternal(
  hours: HourValue,
  language: Language,
  side: 'front' | 'back',
  scale: number,
  background: HTMLImageElement,
  frame: HTMLImageElement,
  badge: HTMLImageElement
): string {
  const width = Math.round(TEMPLATE_WIDTH * scale);
  const height = Math.round(TEMPLATE_HEIGHT * scale);

  // Create canvas at target size
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Layer 1: Draw background
  ctx.drawImage(background, 0, 0, width, height);

  // Layer 2: Draw badges at scaled positions (only on front side)
  if (side === 'front') {
    const badgeSize = BADGE_SIZE * scale;
    const halfBadge = badgeSize / 2;
    const badgePositions = LAYOUT.badges;

    const drawBadge = (pos: { x: number; y: number }) => {
      const x = pos.x * scale - halfBadge;
      const y = pos.y * scale - halfBadge;
      ctx.drawImage(badge, x, y, badgeSize, badgeSize);
    };

    drawBadge(badgePositions.topLeft);
    drawBadge(badgePositions.topRight);
    drawBadge(badgePositions.bottomLeft);
    drawBadge(badgePositions.bottomRight);
  }

  // Layer 3: Draw frame on top
  ctx.drawImage(frame, 0, 0, width, height);

  // Layer 4: Draw banner text along an arc (only on front side)
  if (side === 'front') {
    const bannerText = TRANSLATIONS[language].banner[hours];
    drawTextOnArc(
      ctx,
      bannerText,
      LAYOUT.banner.centerX * scale,
      LAYOUT.banner.centerY * scale,
      LAYOUT.banner.radius * scale,
      LAYOUT.banner.fontSize * scale,
      LAYOUT.banner.color
    );
  }

  // Use lower quality for preview, higher for export
  const quality = scale < 1 ? 0.8 : 0.95;
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Compose a template for PREVIEW (smaller, faster)
 * @param hours - The hour value (1, 5, or 10)
 * @param language - The language ('de' or 'en')
 * @param side - 'front' or 'back'
 * @returns Data URL of the composited template at preview resolution
 */
export async function composeTemplate(
  hours: HourValue,
  language: Language,
  side: 'front' | 'back'
): Promise<string> {
  const cacheKey = `${hours}-${language}-${side}`;

  // Return cached version if available
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!;
  }

  // Get images (use preloaded if available)
  const background = preloadedImages.background || await loadImage(LAYERS.background);
  const frame = side === 'front'
    ? (preloadedImages.frontFrame || await loadImage(LAYERS.frontFrame))
    : (preloadedImages.backFrame || await loadImage(LAYERS.backFrame));
  const badge = preloadedImages.badges[hours] || await loadImage(NUMBER_BADGES[hours]);

  const dataUrl = composeTemplateInternal(hours, language, side, PREVIEW_SCALE, background, frame, badge);
  previewCache.set(cacheKey, dataUrl);

  return dataUrl;
}

/**
 * Compose a template at FULL resolution for PDF export
 * @param hours - The hour value (1, 5, or 10)
 * @param language - The language ('de' or 'en')
 * @param side - 'front' or 'back'
 * @returns Data URL of the composited template at full resolution
 */
export async function composeTemplateFullRes(
  hours: HourValue,
  language: Language,
  side: 'front' | 'back'
): Promise<string> {
  const cacheKey = `${hours}-${language}-${side}`;

  // Return cached version if available
  if (fullResCache.has(cacheKey)) {
    return fullResCache.get(cacheKey)!;
  }

  // Get images (use preloaded if available)
  const background = preloadedImages.background || await loadImage(LAYERS.background);
  const frame = side === 'front'
    ? (preloadedImages.frontFrame || await loadImage(LAYERS.frontFrame))
    : (preloadedImages.backFrame || await loadImage(LAYERS.backFrame));
  const badge = preloadedImages.badges[hours] || await loadImage(NUMBER_BADGES[hours]);

  const dataUrl = composeTemplateInternal(hours, language, side, 1, background, frame, badge);

  // Limit full-res cache size (these are large)
  if (fullResCache.size > 4) {
    const firstKey = fullResCache.keys().next().value;
    if (firstKey) fullResCache.delete(firstKey);
  }

  fullResCache.set(cacheKey, dataUrl);

  return dataUrl;
}

/**
 * Get the template dimensions
 */
export function getTemplateDimensions() {
  return {
    width: TEMPLATE_WIDTH,
    height: TEMPLATE_HEIGHT,
  };
}

/**
 * Clear the compositor cache (useful when templates are updated)
 */
export function clearCompositorCache(): void {
  previewCache.clear();
  fullResCache.clear();
  baseLayerCache.clear();
  frameLayerCache.clear();
}

/**
 * Get separate layers for rendering (front or back)
 * Returns base (background + badges) and frame as separate URLs
 * This allows content to be rendered BETWEEN these layers
 */
export async function getTemplateLayers(
  hours: HourValue,
  language: Language,
  side: 'front' | 'back' = 'front',
  scale: number = PREVIEW_SCALE
): Promise<{ base: string; frame: string }> {
  const cacheKey = `${hours}-${language}-${side}-${scale}`;

  // Check cache for base layer
  let baseUrl = baseLayerCache.get(cacheKey);

  if (!baseUrl) {
    // Get images
    const background = preloadedImages.background || await loadImage(LAYERS.background);
    const badge = preloadedImages.badges[hours] || await loadImage(NUMBER_BADGES[hours]);

    baseUrl = composeBaseLayer(hours, language, scale, background, badge);
    baseLayerCache.set(cacheKey, baseUrl);
  }

  // Get frame URL (front or back frame) - cached to ensure consistent data URLs for hue shift caching
  const frameCacheKey = `${side}-${scale}`;
  let frameUrl = frameLayerCache.get(frameCacheKey);

  if (!frameUrl) {
    const frameImg = side === 'front'
      ? (preloadedImages.frontFrame || await loadImage(LAYERS.frontFrame))
      : (preloadedImages.backFrame || await loadImage(LAYERS.backFrame));
    const width = Math.round(TEMPLATE_WIDTH * scale);
    const height = Math.round(TEMPLATE_HEIGHT * scale);

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = width;
    frameCanvas.height = height;
    const frameCtx = frameCanvas.getContext('2d');
    if (!frameCtx) throw new Error('Failed to get canvas context');
    frameCtx.drawImage(frameImg, 0, 0, width, height);

    frameUrl = frameCanvas.toDataURL('image/png'); // PNG for transparency
    frameLayerCache.set(frameCacheKey, frameUrl);
  }

  return { base: baseUrl, frame: frameUrl };
}

/**
 * Preload all template combinations for faster access
 */
export async function preloadAllTemplates(): Promise<void> {
  const hours: HourValue[] = [1, 5, 10];
  const languages: Language[] = ['de', 'en'];
  const sides: ('front' | 'back')[] = ['front', 'back'];

  const promises: Promise<string>[] = [];

  for (const h of hours) {
    for (const l of languages) {
      for (const s of sides) {
        promises.push(composeTemplate(h, l, s));
      }
    }
  }

  await Promise.all(promises);
}
