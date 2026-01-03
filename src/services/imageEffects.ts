// Local image effects that run in the browser (no API required)

// Maximum dimension for processing (prevents slow performance on mobile)
// Also keeps file size under API limits (Stability AI ~4MB limit)
const MAX_PROCESSING_SIZE = 1024;

/**
 * Resize image if it exceeds max dimensions
 * @param imageDataUrl - Base64 data URL of the image
 * @param maxSize - Maximum dimension (default 1600px)
 * @returns Resized image as data URL (or original if already small enough)
 */
export async function resizeImage(imageDataUrl: string, maxSize: number = MAX_PROCESSING_SIZE): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = Math.max(img.width, img.height);

      // No resize needed
      if (maxDim <= maxSize) {
        resolve(imageDataUrl);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Scale down proportionally
      const scale = maxSize / maxDim;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Use JPEG for smaller file size (better for API uploads)
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
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
  return new Promise((resolve, reject) => {
    const fgImg = new Image();
    const bgImg = new Image();
    let fgLoaded = false;
    let bgLoaded = false;

    const tryComposite = () => {
      if (!fgLoaded || !bgLoaded) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use foreground dimensions
      canvas.width = fgImg.width;
      canvas.height = fgImg.height;

      // Draw background with opacity and blur
      if (bgOpacity > 0) {
        const blurAmount = bgBlur * 20; // 0-20px blur

        ctx.save();
        ctx.globalAlpha = bgOpacity;
        if (blurAmount > 0) {
          ctx.filter = `blur(${blurAmount}px)`;
        }
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Draw foreground (bg-removed) on top (no blur, full opacity)
      ctx.drawImage(fgImg, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    fgImg.onload = () => {
      fgLoaded = true;
      tryComposite();
    };
    bgImg.onload = () => {
      bgLoaded = true;
      tryComposite();
    };
    fgImg.onerror = () => reject(new Error('Failed to load foreground image'));
    bgImg.onerror = () => reject(new Error('Failed to load background image'));

    fgImg.src = foregroundDataUrl;
    bgImg.src = backgroundDataUrl;
  });
}

/**
 * Apply engraving/sepia effect to an image
 * Preserves transparency for use with background-removed images
 * @param imageDataUrl - Base64 data URL of the image
 * @param intensity - Effect intensity from 0 (original) to 1 (full effect)
 */
export async function applyEngravingEffect(imageDataUrl: string, intensity: number = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Image should already be resized on upload, but use original dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Intensity affects contrast (more intensity = more contrast)
      const contrast = 1 + intensity * 0.8; // 1.0 at 0, 1.8 at 1

      // Apply vintage/sepia engraving effect pixel by pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3]; // Preserve alpha

        // Skip fully transparent pixels
        if (a === 0) continue;

        // Convert to grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply contrast
        let adjusted = ((gray / 255 - 0.5) * contrast + 0.5) * 255;
        adjusted = Math.max(0, Math.min(255, adjusted));

        // Apply sepia/vintage currency tone
        // These ratios create a warm, aged paper look
        const sepiaR = Math.min(255, adjusted * 0.9 + 25);
        const sepiaG = Math.min(255, adjusted * 0.78 + 15);
        const sepiaB = Math.min(255, adjusted * 0.55 + 5);

        // Blend with original based on intensity
        data[i] = Math.round(r * (1 - intensity) + sepiaR * intensity);
        data[i + 1] = Math.round(g * (1 - intensity) + sepiaG * intensity);
        data[i + 2] = Math.round(b * (1 - intensity) + sepiaB * intensity);
        // Keep original alpha: data[i + 3] = a;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}
