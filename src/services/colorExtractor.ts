/**
 * Color Extraction Utility
 *
 * Extracts dominant colors from an image using canvas pixel analysis.
 * Uses HSL-based clustering to ensure diverse colors are selected.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

interface ColorCluster {
  pixels: RGB[];
  totalCount: number;
  hueCategory: string; // 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'gray'
}

/**
 * Convert RGB to HEX string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s, l };
}

/**
 * Categorize a color by its hue into broad color families
 */
function getHueCategory(hsl: HSL): string {
  // Gray/neutral detection: low saturation
  if (hsl.s < 0.15) {
    return 'gray';
  }

  // Categorize by hue angle
  const h = hsl.h;
  if (h < 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 75) return 'yellow';
  if (h < 150) return 'green';
  if (h < 195) return 'cyan';
  if (h < 255) return 'blue';
  if (h < 315) return 'purple';
  return 'pink';
}

/**
 * Check if a color is too close to pure white or pure black (background)
 */
function isExtremeColor(hsl: HSL): boolean {
  // Too close to white (very light)
  if (hsl.l > 0.95) return true;
  // Too close to black (very dark)
  if (hsl.l < 0.05) return true;
  return false;
}

/**
 * Calculate average RGB from array of pixels
 */
function averageRgb(pixels: RGB[]): RGB {
  if (pixels.length === 0) return { r: 128, g: 128, b: 128 };

  const sum = pixels.reduce(
    (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
    { r: 0, g: 0, b: 0 }
  );

  return {
    r: Math.round(sum.r / pixels.length),
    g: Math.round(sum.g / pixels.length),
    b: Math.round(sum.b / pixels.length),
  };
}

/**
 * Extract dominant colors from an image data URL
 *
 * Uses HSL-based clustering to ensure diverse colors from different hue families
 * are selected, rather than multiple shades of the same color.
 *
 * @param imageDataUrl - Base64 data URL of the image
 * @param numColors - Number of colors to extract (default: 5)
 * @param includeGrays - Include gray/neutral colors as a separate category (default: true)
 * @returns Promise resolving to array of HEX color strings
 */
export async function extractColorsFromImage(
  imageDataUrl: string,
  numColors: number = 5,
  includeGrays: boolean = true
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Create a small canvas for sampling (50x50 for performance)
      const sampleSize = 50;
      const canvas = document.createElement('canvas');
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw image scaled down
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const pixels = imageData.data;

      // Cluster colors by hue category
      const clusters = new Map<string, ColorCluster>();

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        const rgb: RGB = { r, g, b };
        const hsl = rgbToHsl(rgb);

        // Skip extreme whites/blacks
        if (isExtremeColor(hsl)) continue;

        // Skip grays if not wanted
        const category = getHueCategory(hsl);
        if (category === 'gray' && !includeGrays) continue;

        // Add to appropriate cluster
        if (!clusters.has(category)) {
          clusters.set(category, {
            pixels: [],
            totalCount: 0,
            hueCategory: category,
          });
        }

        const cluster = clusters.get(category)!;
        cluster.pixels.push(rgb);
        cluster.totalCount++;
      }

      // Sort clusters by pixel count (most dominant categories first)
      const sortedClusters = Array.from(clusters.values())
        .sort((a, b) => b.totalCount - a.totalCount);

      // Extract one representative color from each cluster
      const resultColors: string[] = [];

      for (const cluster of sortedClusters) {
        if (resultColors.length >= numColors) break;

        // Get average color for this cluster
        const avgRgb = averageRgb(cluster.pixels);
        const hex = rgbToHex(avgRgb.r, avgRgb.g, avgRgb.b);
        resultColors.push(hex);
      }

      // If we still need more colors, add lighter/darker variants
      if (resultColors.length < numColors && resultColors.length > 0) {
        const originalCount = resultColors.length;
        for (let i = 0; i < originalCount && resultColors.length < numColors; i++) {
          const rgb = hexToRgb(resultColors[i]);
          if (rgb) {
            const hsl = rgbToHsl(rgb);
            // Create a lighter variant if the original is dark, or darker if light
            const newL = hsl.l > 0.5 ? hsl.l - 0.25 : hsl.l + 0.25;
            const variant = hslToRgb({ h: hsl.h, s: hsl.s, l: Math.max(0.1, Math.min(0.9, newL)) });
            resultColors.push(rgbToHex(variant.r, variant.g, variant.b));
          }
        }
      }

      resolve(resultColors);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for color extraction'));
    };

    img.src = imageDataUrl;
  });
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  const hNorm = h / 360;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

/**
 * Convert HEX to RGB
 */
function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Generate a color palette description for prompts
 */
export function describeColorPalette(colors: string[], lang: 'de' | 'en'): string {
  if (colors.length === 0) return '';

  const colorList = colors.join(', ');

  if (lang === 'de') {
    return `Farbpalette basierend auf dem Firmenlogo: ${colorList}. Verwende diese Farben harmonisch im Design.`;
  } else {
    return `Color palette based on the company logo: ${colorList}. Use these colors harmoniously in the design.`;
  }
}
