// Local image effects that run in the browser (no API required)

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

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
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
