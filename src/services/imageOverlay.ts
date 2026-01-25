/**
 * Utility functions for overlaying QR codes onto generated images
 */

export interface OverlayOptions {
  /** Base64 encoded image to overlay onto */
  baseImageBase64: string;
  /** Base64 encoded QR code to overlay */
  qrCodeBase64: string;
  /** Position of QR code on the image */
  position: 'bottom-right-back' | 'bottom-left-back';
  /** Size of QR code as percentage of image width (default: 0.10 = 10%) */
  qrSizePercent?: number;
  /** Padding from edge as percentage of image width (default: 0.03 = 3%) */
  paddingPercent?: number;
  /** Layout: 'vertical' means front on top, back on bottom (Gemini default) */
  layout?: 'vertical' | 'horizontal';
}

export interface OverlayResult {
  success: boolean;
  imageBase64?: string;
  error?: string;
}

/**
 * Overlay a QR code onto a generated voucher image.
 * The image is expected to show front and back side by side,
 * so the QR code is placed on the right half (back side).
 */
export async function overlayQrCode(options: OverlayOptions): Promise<OverlayResult> {
  const {
    baseImageBase64,
    qrCodeBase64,
    position,
    qrSizePercent = 0.08,
    paddingPercent = 0.02,
  } = options;

  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({ success: false, error: 'Could not create canvas context' });
        return;
      }

      const baseImage = new Image();
      const qrImage = new Image();

      let baseLoaded = false;
      let qrLoaded = false;

      const tryComposite = () => {
        if (!baseLoaded || !qrLoaded) return;

        // Set canvas size to match base image
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;

        // Draw base image
        ctx.drawImage(baseImage, 0, 0);

        // Calculate QR code size and position
        // The image shows front (left half) and back (right half) side by side
        const imageWidth = baseImage.width;
        const imageHeight = baseImage.height;

        // QR code size based on total image width
        const qrSize = Math.round(imageWidth * qrSizePercent);
        const padding = Math.round(imageWidth * paddingPercent);

        let x: number;
        let y: number;

        if (position === 'bottom-right-back') {
          // Bottom right of the back side (right half of image)
          x = imageWidth - qrSize - padding;
          y = imageHeight - qrSize - padding;
        } else {
          // Bottom left of the back side (center of image)
          x = (imageWidth / 2) + padding;
          y = imageHeight - qrSize - padding;
        }

        // Draw white background for QR code (ensures scannability)
        const bgPadding = Math.round(qrSize * 0.1);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(
          x - bgPadding,
          y - bgPadding,
          qrSize + bgPadding * 2,
          qrSize + bgPadding * 2
        );

        // Draw QR code
        ctx.drawImage(qrImage, x, y, qrSize, qrSize);

        // Convert to base64
        const resultBase64 = canvas.toDataURL('image/png').split(',')[1];
        resolve({ success: true, imageBase64: resultBase64 });
      };

      baseImage.onload = () => {
        baseLoaded = true;
        tryComposite();
      };

      baseImage.onerror = () => {
        resolve({ success: false, error: 'Failed to load base image' });
      };

      qrImage.onload = () => {
        qrLoaded = true;
        tryComposite();
      };

      qrImage.onerror = () => {
        resolve({ success: false, error: 'Failed to load QR code image' });
      };

      // Start loading images
      baseImage.src = `data:image/png;base64,${baseImageBase64}`;
      qrImage.src = `data:image/png;base64,${qrCodeBase64}`;

    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during overlay',
      });
    }
  });
}
