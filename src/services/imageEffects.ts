// Local image effects that run in the browser (no API required)
// Optimized with: image caching, Uint32Array pixel ops, reusable canvas

// Maximum dimension for processing (prevents slow performance on mobile)
// Also keeps file size under API limits (Stability AI ~4MB limit)
const MAX_PROCESSING_SIZE = 1024;

// Image cache to avoid reloading the same data URL
const imageCache = new Map<string, HTMLImageElement>();

// Reusable canvas for effects (avoids GC pressure)
let reusableCanvas: HTMLCanvasElement | null = null;
let reusableCtx: CanvasRenderingContext2D | null = null;

function getReusableCanvas(width: number, height: number): CanvasRenderingContext2D {
  if (!reusableCanvas) {
    reusableCanvas = document.createElement('canvas');
    reusableCtx = reusableCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (reusableCanvas.width !== width || reusableCanvas.height !== height) {
    reusableCanvas.width = width;
    reusableCanvas.height = height;
  }
  return reusableCtx!;
}

/**
 * Load image with caching
 */
function loadImageCached(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Limit cache size to prevent memory issues
      if (imageCache.size > 10) {
        const firstKey = imageCache.keys().next().value;
        if (firstKey) imageCache.delete(firstKey);
      }
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Clear image cache (call when portrait is removed)
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Resize image if it exceeds max dimensions
 * @param imageDataUrl - Base64 data URL of the image
 * @param maxSize - Maximum dimension (default 1024px)
 * @returns Resized image as data URL (or original if already small enough)
 */
export async function resizeImage(imageDataUrl: string, maxSize: number = MAX_PROCESSING_SIZE): Promise<string> {
  const img = await loadImageCached(imageDataUrl);
  const maxDim = Math.max(img.width, img.height);

  // No resize needed
  if (maxDim <= maxSize) {
    return imageDataUrl;
  }

  // Scale down proportionally
  const scale = maxSize / maxDim;
  const newWidth = Math.round(img.width * scale);
  const newHeight = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  canvas.width = newWidth;
  canvas.height = newHeight;
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  // Use JPEG for smaller file size (better for API uploads)
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Composite a foreground image (with transparency) over a background image
 * Used to blend bg-removed portrait with original at specified opacity and blur
 * @param foregroundDataUrl - Image with transparency (bg-removed)
 * @param backgroundDataUrl - Original image to show through
 * @param bgOpacity - Background opacity from 0 (invisible) to 1 (full)
 * @param bgBlur - Background blur from 0 (no blur) to 1 (max blur ~20px)
 */
export async function compositeWithBackground(
  foregroundDataUrl: string,
  backgroundDataUrl: string,
  bgOpacity: number,
  bgBlur: number = 0
): Promise<string> {
  // Load both images with caching
  const [fgImg, bgImg] = await Promise.all([
    loadImageCached(foregroundDataUrl),
    loadImageCached(backgroundDataUrl),
  ]);

  // Use reusable canvas
  const ctx = getReusableCanvas(fgImg.width, fgImg.height);

  // Clear previous content
  ctx.clearRect(0, 0, fgImg.width, fgImg.height);

  // Draw background with opacity and blur
  if (bgOpacity > 0) {
    const blurAmount = bgBlur * 20; // 0-20px blur

    ctx.save();
    ctx.globalAlpha = bgOpacity;
    if (blurAmount > 0) {
      ctx.filter = `blur(${blurAmount}px)`;
    }
    ctx.drawImage(bgImg, 0, 0, fgImg.width, fgImg.height);
    ctx.restore();
  }

  // Draw foreground (bg-removed) on top (no blur, full opacity)
  ctx.drawImage(fgImg, 0, 0);

  return reusableCanvas!.toDataURL('image/png');
}

/**
 * Apply engraving/sepia effect to an image
 * Preserves transparency for use with background-removed images
 * Optimized with: image caching, Uint32Array for fast pixel ops, reusable canvas
 * @param imageDataUrl - Base64 data URL of the image
 * @param intensity - Effect intensity from 0 (original) to 1 (full effect)
 */
export async function applyEngravingEffect(imageDataUrl: string, intensity: number = 0.5): Promise<string> {
  const img = await loadImageCached(imageDataUrl);

  // Use reusable canvas
  const ctx = getReusableCanvas(img.width, img.height);
  ctx.drawImage(img, 0, 0);

  // Get image data for pixel manipulation
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  // Use Uint32Array view for faster pixel access (4 bytes per pixel as single 32-bit value)
  const pixels = new Uint32Array(data.buffer);

  // Intensity affects contrast (more intensity = more contrast)
  const contrast = 1 + intensity * 0.8; // 1.0 at 0, 1.8 at 1
  const invIntensity = 1 - intensity;

  // Apply vintage/sepia engraving effect pixel by pixel
  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];

    // Extract RGBA (little-endian: ABGR in memory)
    const r = pixel & 0xff;
    const g = (pixel >> 8) & 0xff;
    const b = (pixel >> 16) & 0xff;
    const a = (pixel >> 24) & 0xff;

    // Skip fully transparent pixels
    if (a === 0) continue;

    // Convert to grayscale (using integer approximation: 77*R + 150*G + 29*B) >> 8
    const gray = (77 * r + 150 * g + 29 * b) >> 8;

    // Apply contrast
    let adjusted = ((gray / 255 - 0.5) * contrast + 0.5) * 255;
    if (adjusted < 0) adjusted = 0;
    else if (adjusted > 255) adjusted = 255;

    // Apply sepia/vintage currency tone
    let sepiaR = adjusted * 0.9 + 25;
    let sepiaG = adjusted * 0.78 + 15;
    let sepiaB = adjusted * 0.55 + 5;
    if (sepiaR > 255) sepiaR = 255;
    if (sepiaG > 255) sepiaG = 255;
    if (sepiaB > 255) sepiaB = 255;

    // Blend with original based on intensity
    const newR = (r * invIntensity + sepiaR * intensity) | 0;
    const newG = (g * invIntensity + sepiaG * intensity) | 0;
    const newB = (b * invIntensity + sepiaB * intensity) | 0;

    // Pack back into 32-bit value (little-endian: ABGR)
    pixels[i] = (a << 24) | (newB << 16) | (newG << 8) | newR;
  }

  ctx.putImageData(imageData, 0, 0);
  return reusableCanvas!.toDataURL('image/png');
}

// RGB to HSL conversion
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
}

// HSL to RGB conversion
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
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

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * Replace cool colors (greens, cyans, blues) with target hue
 * Maps all cool colors to the target hue while preserving saturation and lightness
 * @param imageDataUrl - Base64 data URL of the image
 * @param targetHue - Target hue in degrees (0-360). 160 = original (no shift)
 * @returns Image with cool colors replaced by target hue
 */
export async function applyHueShift(imageDataUrl: string, targetHue: number): Promise<string> {
  // No shift needed when hue is at source color (~160°)
  if (targetHue >= 155 && targetHue <= 165) {
    return imageDataUrl;
  }

  const img = await loadImageCached(imageDataUrl);

  // Use reusable canvas
  const ctx = getReusableCanvas(img.width, img.height);
  ctx.drawImage(img, 0, 0);

  // Get image data for pixel manipulation
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  // Use Uint32Array view for faster pixel access
  const pixels = new Uint32Array(data.buffer);

  // Target hue in 0-1 range
  const targetH = (targetHue % 360) / 360;

  // Cool color range to replace: green to blue (roughly 60° to 260°)
  const coolHueMin = 60 / 360;   // ~0.17 (yellow-green)
  const coolHueMax = 260 / 360;  // ~0.72 (blue-violet)

  // Process pixels in chunks to avoid blocking UI
  const CHUNK_SIZE = 100000; // Process 100k pixels per chunk
  const totalPixels = pixels.length;

  for (let start = 0; start < totalPixels; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, totalPixels);

    // Process chunk
    for (let i = start; i < end; i++) {
      const pixel = pixels[i];

      // Extract RGBA (little-endian: ABGR in memory)
      const r = pixel & 0xff;
      const g = (pixel >> 8) & 0xff;
      const b = (pixel >> 16) & 0xff;
      const a = (pixel >> 24) & 0xff;

      // Skip fully transparent pixels
      if (a === 0) continue;

      // Convert RGB to HSL
      const [h, s, l] = rgbToHsl(r, g, b);

      // Skip very low saturation pixels (grays)
      if (s < 0.06) continue;

      // Only replace cool colors (greens, cyans, blues)
      if (h < coolHueMin || h > coolHueMax) continue;

      // Direct replacement: set hue to target, keep saturation and lightness
      const newH = targetH;

      // Convert back to RGB
      const [newR, newG, newB] = hslToRgb(newH, s, l);

      // Pack back into 32-bit value (little-endian: ABGR)
      pixels[i] = (a << 24) | (newB << 16) | (newG << 8) | newR;
    }

    // Yield to browser between chunks (except for last chunk)
    if (end < totalPixels) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return reusableCanvas!.toDataURL('image/png');
}
