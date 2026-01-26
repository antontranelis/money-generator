/**
 * Service for processing generated voucher images
 * - Crops vouchers from background
 * - Splits vertical layout (front top, back bottom) into separate images
 * - Overlays QR code onto back side
 * - Generates PDF for printing
 */

import { generateQrCodeBase64, isValidUrl } from './qrCodeGenerator';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Find the voucher edge by detecting where black background ends.
 *
 * Simple strategy:
 * 1. Scan from outside in along multiple lines
 * 2. Find the first pixel that is NOT black (brightness > threshold)
 * 3. Use median of all sample lines to be robust against outliers (like labels)
 */
function findOuterEdges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): BoundingBox {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Get brightness of a pixel (0-255)
  const getBrightness = (x: number, y: number): number => {
    const idx = (y * width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  };

  // Threshold: anything brighter than this is considered "not black/gray background"
  // Black background is ~0, gray artifacts can be up to ~140
  // Voucher content is typically much brighter (180+)
  // Using 150 to very aggressively cut off any gray edges/artifacts
  const brightnessThreshold = 150;

  // Number of sample lines to scan for each edge
  const sampleLines = 20;

  // Find TOP edge: scan from top down
  let top = 0;
  {
    const results: number[] = [];
    for (let i = 0; i < sampleLines; i++) {
      // Sample across middle 60% of width to avoid corners
      const x = Math.floor(width * 0.2 + (width * 0.6 * i) / sampleLines);
      for (let y = 0; y < height; y++) {
        if (getBrightness(x, y) > brightnessThreshold) {
          results.push(y);
          break;
        }
      }
    }
    if (results.length > 0) {
      results.sort((a, b) => a - b);
      // Use median to ignore outliers (like labels)
      top = results[Math.floor(results.length / 2)];
    }
  }

  // Find BOTTOM edge: scan from bottom up
  let bottom = height - 1;
  {
    const results: number[] = [];
    for (let i = 0; i < sampleLines; i++) {
      const x = Math.floor(width * 0.2 + (width * 0.6 * i) / sampleLines);
      for (let y = height - 1; y >= 0; y--) {
        if (getBrightness(x, y) > brightnessThreshold) {
          results.push(y);
          break;
        }
      }
    }
    if (results.length > 0) {
      results.sort((a, b) => a - b);
      bottom = results[Math.floor(results.length / 2)];
    }
  }

  // Find LEFT edge: scan from left to right
  let left = 0;
  {
    const results: number[] = [];
    for (let i = 0; i < sampleLines; i++) {
      // Sample across middle 60% of height
      const y = Math.floor(height * 0.2 + (height * 0.6 * i) / sampleLines);
      for (let x = 0; x < width; x++) {
        if (getBrightness(x, y) > brightnessThreshold) {
          results.push(x);
          break;
        }
      }
    }
    if (results.length > 0) {
      results.sort((a, b) => a - b);
      left = results[Math.floor(results.length / 2)];
    }
  }

  // Find RIGHT edge: scan from right to left
  let right = width - 1;
  {
    const results: number[] = [];
    for (let i = 0; i < sampleLines; i++) {
      const y = Math.floor(height * 0.2 + (height * 0.6 * i) / sampleLines);
      for (let x = width - 1; x >= 0; x--) {
        if (getBrightness(x, y) > brightnessThreshold) {
          results.push(x);
          break;
        }
      }
    }
    if (results.length > 0) {
      results.sort((a, b) => a - b);
      right = results[Math.floor(results.length / 2)];
    }
  }

  // Add extra padding to aggressively cut off any gray artifacts at edges
  // This ensures we cut a few pixels beyond the detected edge
  const extraPadding = 3;
  left = Math.min(left + extraPadding, width - 1);
  right = Math.max(right - extraPadding, 0);
  top = Math.min(top + extraPadding, height - 1);
  bottom = Math.max(bottom - extraPadding, 0);

  // Validate bounds
  if (left >= right || top >= bottom) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}


/**
 * Crop a canvas to the given bounding box
 */
function cropCanvas(
  sourceCanvas: HTMLCanvasElement,
  bounds: BoundingBox
): HTMLCanvasElement {
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = bounds.width;
  croppedCanvas.height = bounds.height;

  const ctx = croppedCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(
      sourceCanvas,
      bounds.x, bounds.y, bounds.width, bounds.height,
      0, 0, bounds.width, bounds.height
    );
  }

  return croppedCanvas;
}

/**
 * Find only vertical edges (top and bottom) - used to trim black gap between vouchers
 * Returns the top and bottom Y coordinates where content starts/ends
 */
function findVerticalEdges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { top: number; bottom: number } {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const getBrightness = (x: number, y: number): number => {
    const idx = (y * width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  };

  // Very aggressive threshold to cut off gray edges/artifacts (matches findOuterEdges)
  const brightnessThreshold = 150;
  const sampleLines = 20;

  // Find TOP edge
  let top = 0;
  {
    const results: number[] = [];
    for (let i = 0; i < sampleLines; i++) {
      const x = Math.floor(width * 0.2 + (width * 0.6 * i) / sampleLines);
      for (let y = 0; y < height; y++) {
        if (getBrightness(x, y) > brightnessThreshold) {
          results.push(y);
          break;
        }
      }
    }
    if (results.length > 0) {
      results.sort((a, b) => a - b);
      top = results[Math.floor(results.length / 2)];
    }
  }

  // Find BOTTOM edge
  let bottom = height - 1;
  {
    const results: number[] = [];
    for (let i = 0; i < sampleLines; i++) {
      const x = Math.floor(width * 0.2 + (width * 0.6 * i) / sampleLines);
      for (let y = height - 1; y >= 0; y--) {
        if (getBrightness(x, y) > brightnessThreshold) {
          results.push(y);
          break;
        }
      }
    }
    if (results.length > 0) {
      results.sort((a, b) => a - b);
      bottom = results[Math.floor(results.length / 2)];
    }
  }

  // Add extra padding to aggressively cut off any gray artifacts
  const extraPadding = 3;
  top = Math.min(top + extraPadding, height - 1);
  bottom = Math.max(bottom - extraPadding, 0);

  // Ensure valid bounds
  if (top >= bottom) {
    return { top: 0, bottom: height - 1 };
  }

  return { top, bottom };
}

/**
 * Trim black from top and bottom of a canvas
 */
function trimVerticalBlack(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const { top, bottom } = findVerticalEdges(ctx, canvas.width, canvas.height);

  // If no trimming needed, return original
  if (top === 0 && bottom === canvas.height - 1) {
    return canvas;
  }

  const trimmedHeight = bottom - top + 1;
  return cropCanvas(canvas, {
    x: 0,
    y: top,
    width: canvas.width,
    height: trimmedHeight,
  });
}

export interface ProcessedVoucherImages {
  /** Front side image as base64 */
  frontBase64: string;
  /** Back side image as base64 (with QR code if enabled) */
  backBase64: string;
  /** Original combined image */
  originalBase64: string;
  /** Dimensions of each side */
  dimensions: {
    width: number;
    height: number;
  };
}

export interface VoucherValidationResult {
  /** Whether the image passed validation */
  isValid: boolean;
  /** Whether the background appears to be black */
  hasBlackBackground: boolean;
  /** Whether both sides have equal dimensions */
  sidesAreEqualSize: boolean;
  /** Whether vouchers have no black borders (content fills the voucher area) */
  hasNoBlackBorders: boolean;
  /** Dimensions of front side */
  frontDimensions: { width: number; height: number };
  /** Dimensions of back side */
  backDimensions: { width: number; height: number };
  /** Human-readable validation message */
  message: string;
}

/**
 * Check if a voucher half has significant black borders by examining the edges.
 * Returns true if the voucher content extends to edges (no significant black borders).
 *
 * This function is designed to detect meaningful black borders (5+ pixels wide)
 * while ignoring thin cut lines or compression artifacts (1-4 pixels).
 */
function checkVoucherHasNoBlackBorders(
  ctx: CanvasRenderingContext2D,
  startY: number,
  height: number,
  fullWidth: number
): { hasNoBlackBorders: boolean; blackBorderPercent: number } {
  const imageData = ctx.getImageData(0, startY, fullWidth, height);
  const data = imageData.data;

  const getBrightness = (x: number, y: number): number => {
    const idx = (y * fullWidth + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  };

  // Higher threshold to ignore dark grays (only true black/near-black)
  const blackThreshold = 25;
  const sampleLines = 10;

  // Skip first 5 pixels to ignore thin cut lines/compression artifacts
  const skipPixels = 5;
  // Minimum border width to be considered a "real" black border (in pixels)
  const minBorderWidth = Math.max(10, Math.floor(fullWidth * 0.01)); // At least 1% or 10px

  // Check left edge - start after skipPixels, check for minBorderWidth of black
  let leftBlackCount = 0;
  for (let i = 0; i < sampleLines; i++) {
    const y = Math.floor((height * 0.1) + (height * 0.8 * i) / sampleLines);
    let blackPixelCount = 0;
    for (let x = skipPixels; x < skipPixels + minBorderWidth && x < fullWidth; x++) {
      if (getBrightness(x, y) <= blackThreshold) {
        blackPixelCount++;
      }
    }
    // Consider it a black border if most pixels in the check zone are black
    if (blackPixelCount >= minBorderWidth * 0.7) leftBlackCount++;
  }

  // Check right edge
  let rightBlackCount = 0;
  for (let i = 0; i < sampleLines; i++) {
    const y = Math.floor((height * 0.1) + (height * 0.8 * i) / sampleLines);
    let blackPixelCount = 0;
    for (let x = fullWidth - skipPixels - minBorderWidth; x < fullWidth - skipPixels && x >= 0; x++) {
      if (getBrightness(x, y) <= blackThreshold) {
        blackPixelCount++;
      }
    }
    if (blackPixelCount >= minBorderWidth * 0.7) rightBlackCount++;
  }

  // Check top edge
  let topBlackCount = 0;
  const minBorderHeight = Math.max(10, Math.floor(height * 0.01));
  for (let i = 0; i < sampleLines; i++) {
    const x = Math.floor((fullWidth * 0.1) + (fullWidth * 0.8 * i) / sampleLines);
    let blackPixelCount = 0;
    for (let y = skipPixels; y < skipPixels + minBorderHeight && y < height; y++) {
      if (getBrightness(x, y) <= blackThreshold) {
        blackPixelCount++;
      }
    }
    if (blackPixelCount >= minBorderHeight * 0.7) topBlackCount++;
  }

  // Check bottom edge
  let bottomBlackCount = 0;
  for (let i = 0; i < sampleLines; i++) {
    const x = Math.floor((fullWidth * 0.1) + (fullWidth * 0.8 * i) / sampleLines);
    let blackPixelCount = 0;
    for (let y = height - skipPixels - minBorderHeight; y < height - skipPixels && y >= 0; y++) {
      if (getBrightness(x, y) <= blackThreshold) {
        blackPixelCount++;
      }
    }
    if (blackPixelCount >= minBorderHeight * 0.7) bottomBlackCount++;
  }

  // Calculate percentage of edges that have black borders
  const totalChecks = sampleLines * 4;
  const blackBorderCount = leftBlackCount + rightBlackCount + topBlackCount + bottomBlackCount;
  const blackBorderPercent = (blackBorderCount / totalChecks) * 100;

  // If more than 30% of edge samples are black, there are significant black borders
  const hasNoBlackBorders = blackBorderPercent < 30;

  return { hasNoBlackBorders, blackBorderPercent };
}

/**
 * Validate that a generated voucher image meets quality criteria:
 * 1. Background is black (corners/edges are dark)
 * 2. Both voucher sides are EXACTLY equal size (within 1% tolerance)
 * 3. Vouchers have no black borders (content fills the voucher area)
 */
export async function validateVoucherImage(
  imageBase64: string
): Promise<VoucherValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({
          isValid: false,
          hasBlackBackground: false,
          sidesAreEqualSize: false,
          hasNoBlackBorders: false,
          frontDimensions: { width: 0, height: 0 },
          backDimensions: { width: 0, height: 0 },
          message: 'Could not create canvas context',
        });
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Check if background is black by sampling corners
      const getBrightness = (x: number, y: number): number => {
        const idx = (y * img.width + x) * 4;
        return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      };

      // Sample multiple points in each corner (5x5 grid in each corner)
      const cornerSize = Math.min(50, Math.floor(img.width * 0.05), Math.floor(img.height * 0.05));
      const samplePoints: { x: number; y: number }[] = [];

      // Top-left corner
      for (let x = 0; x < cornerSize; x += 10) {
        for (let y = 0; y < cornerSize; y += 10) {
          samplePoints.push({ x, y });
        }
      }
      // Top-right corner
      for (let x = img.width - cornerSize; x < img.width; x += 10) {
        for (let y = 0; y < cornerSize; y += 10) {
          samplePoints.push({ x, y });
        }
      }
      // Bottom-left corner
      for (let x = 0; x < cornerSize; x += 10) {
        for (let y = img.height - cornerSize; y < img.height; y += 10) {
          samplePoints.push({ x, y });
        }
      }
      // Bottom-right corner
      for (let x = img.width - cornerSize; x < img.width; x += 10) {
        for (let y = img.height - cornerSize; y < img.height; y += 10) {
          samplePoints.push({ x, y });
        }
      }

      // Calculate average brightness of corner samples
      let totalBrightness = 0;
      for (const point of samplePoints) {
        totalBrightness += getBrightness(point.x, point.y);
      }
      const avgBrightness = totalBrightness / samplePoints.length;

      // Background is "black" if average brightness is below threshold (pure black = 0)
      const blackThreshold = 30; // Allow some tolerance for compression artifacts
      const hasBlackBackground = avgBrightness < blackThreshold;

      // Find the voucher bounds
      const fullBounds = findOuterEdges(ctx, img.width, img.height);

      // Split into two halves - each voucher takes half the cropped height
      const croppedHeight = fullBounds.height;
      const sideHeight = Math.floor(croppedHeight / 2);

      // Create temporary canvases for each half to measure actual content
      const frontCanvas = document.createElement('canvas');
      frontCanvas.width = fullBounds.width;
      frontCanvas.height = sideHeight;
      const frontCtx = frontCanvas.getContext('2d');

      const backCanvas = document.createElement('canvas');
      backCanvas.width = fullBounds.width;
      backCanvas.height = croppedHeight - sideHeight; // Use remaining height for back
      const backCtx = backCanvas.getContext('2d');

      if (!frontCtx || !backCtx) {
        resolve({
          isValid: false,
          hasBlackBackground: false,
          sidesAreEqualSize: false,
          hasNoBlackBorders: false,
          frontDimensions: { width: 0, height: 0 },
          backDimensions: { width: 0, height: 0 },
          message: 'Could not create canvas contexts for halves',
        });
        return;
      }

      // Draw front half
      frontCtx.drawImage(
        canvas,
        fullBounds.x, fullBounds.y, fullBounds.width, sideHeight,
        0, 0, fullBounds.width, sideHeight
      );

      // Draw back half
      backCtx.drawImage(
        canvas,
        fullBounds.x, fullBounds.y + sideHeight, fullBounds.width, croppedHeight - sideHeight,
        0, 0, fullBounds.width, croppedHeight - sideHeight
      );

      // Find actual content bounds within each half (trimming any black borders)
      const frontContentBounds = findVerticalEdges(frontCtx, frontCanvas.width, frontCanvas.height);
      const backContentBounds = findVerticalEdges(backCtx, backCanvas.width, backCanvas.height);

      const frontContentHeight = frontContentBounds.bottom - frontContentBounds.top + 1;
      const backContentHeight = backContentBounds.bottom - backContentBounds.top + 1;

      // Check for exact size match (within 1% tolerance - stricter than before)
      const sizeTolerance = 0.01; // 1% tolerance for exact match
      const sizeDifference = Math.abs(frontContentHeight - backContentHeight) / Math.max(frontContentHeight, backContentHeight);
      const sidesAreEqualSize = sizeDifference <= sizeTolerance;

      // Check for black borders on each voucher half
      const frontBorderCheck = checkVoucherHasNoBlackBorders(frontCtx, 0, frontCanvas.height, frontCanvas.width);
      const backBorderCheck = checkVoucherHasNoBlackBorders(backCtx, 0, backCanvas.height, backCanvas.width);

      const hasNoBlackBorders = frontBorderCheck.hasNoBlackBorders && backBorderCheck.hasNoBlackBorders;

      const frontDimensions = { width: fullBounds.width, height: frontContentHeight };
      const backDimensions = { width: fullBounds.width, height: backContentHeight };

      const isValid = hasBlackBackground && sidesAreEqualSize && hasNoBlackBorders;

      // Build validation message
      let message = '';
      if (!hasBlackBackground) {
        message = `Hintergrund ist nicht schwarz (Helligkeit: ${avgBrightness.toFixed(0)})`;
      } else if (!sidesAreEqualSize) {
        message = `Seiten sind nicht exakt gleich groß (Differenz: ${(sizeDifference * 100).toFixed(1)}%, max 1% erlaubt)`;
      } else if (!hasNoBlackBorders) {
        const worstBorderPercent = Math.max(frontBorderCheck.blackBorderPercent, backBorderCheck.blackBorderPercent);
        message = `Schwarze Ränder auf Gutschein erkannt (${worstBorderPercent.toFixed(0)}% der Kanten)`;
      } else {
        message = 'Validierung erfolgreich';
      }

      resolve({
        isValid,
        hasBlackBackground,
        sidesAreEqualSize,
        hasNoBlackBorders,
        frontDimensions,
        backDimensions,
        message,
      });
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        hasBlackBackground: false,
        sidesAreEqualSize: false,
        hasNoBlackBorders: false,
        frontDimensions: { width: 0, height: 0 },
        backDimensions: { width: 0, height: 0 },
        message: 'Bild konnte nicht geladen werden',
      });
    };

    img.src = `data:image/png;base64,${imageBase64}`;
  });
}

export interface ProcessVoucherOptions {
  /** Base64 encoded image from Gemini (vertical layout: front top, back bottom) */
  imageBase64: string;
  /** QR code URL (optional) */
  qrCodeUrl?: string;
  /** QR code size as percentage of image width (default: 0.10 = 10%) */
  qrSizePercent?: number;
  /** Padding from edge as percentage of image width (default: 0.025 = 2.5%) */
  qrPaddingPercent?: number;
}

/**
 * Split a vertically-arranged voucher image into front and back sides,
 * crop out the background, and optionally overlay a QR code on the back side.
 */
export async function processVoucherImage(
  options: ProcessVoucherOptions
): Promise<ProcessedVoucherImages> {
  const {
    imageBase64,
    qrCodeUrl,
    qrSizePercent = 0.10,
    qrPaddingPercent = 0.02,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      try {
        const fullWidth = img.width;
        const fullHeight = img.height;

        // === STEP 1: Draw entire image to canvas for edge detection ===
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = fullWidth;
        fullCanvas.height = fullHeight;
        const fullCtx = fullCanvas.getContext('2d');

        if (!fullCtx) {
          reject(new Error('Could not create full canvas context'));
          return;
        }

        fullCtx.drawImage(img, 0, 0);

        // === STEP 2: Find outer edges on the FULL image ===
        // This detects black background on all sides (top, bottom, left, right)
        const fullBounds = findOuterEdges(fullCtx, fullWidth, fullHeight);

        // === STEP 3: Crop the full image to remove black background ===
        const croppedFullCanvas = cropCanvas(fullCanvas, fullBounds);
        const croppedWidth = croppedFullCanvas.width;
        const croppedHeight = croppedFullCanvas.height;

        // === STEP 4: Split the cropped image into two halves ===
        // Each voucher side is half the cropped height
        const sideHeight = Math.floor(croppedHeight / 2);

        // Create canvas for front side (top half of cropped image)
        let frontCanvasRaw = document.createElement('canvas');
        frontCanvasRaw.width = croppedWidth;
        frontCanvasRaw.height = sideHeight;
        const frontCtxRaw = frontCanvasRaw.getContext('2d');

        if (!frontCtxRaw) {
          reject(new Error('Could not create front canvas context'));
          return;
        }

        frontCtxRaw.drawImage(
          croppedFullCanvas,
          0, 0, croppedWidth, sideHeight,  // source: top half
          0, 0, croppedWidth, sideHeight   // destination: full canvas
        );

        // Create canvas for back side (bottom half of cropped image)
        let backCanvasRaw = document.createElement('canvas');
        backCanvasRaw.width = croppedWidth;
        backCanvasRaw.height = sideHeight;
        const backCtxRaw = backCanvasRaw.getContext('2d');

        if (!backCtxRaw) {
          reject(new Error('Could not create back canvas context'));
          return;
        }

        backCtxRaw.drawImage(
          croppedFullCanvas,
          0, sideHeight, croppedWidth, sideHeight,  // source: bottom half
          0, 0, croppedWidth, sideHeight            // destination: full canvas
        );

        // === STEP 5: Trim black from top/bottom of each half ===
        // This removes the black gap that was between the two vouchers
        const frontTrimmed = trimVerticalBlack(frontCanvasRaw);
        const backTrimmed = trimVerticalBlack(backCanvasRaw);

        // === STEP 6: Unify heights so both sides have the same dimensions ===
        // If sizes differ, fill gaps with white background
        const maxHeight = Math.max(frontTrimmed.height, backTrimmed.height);

        // Create final canvases with unified height
        const frontCanvas = document.createElement('canvas');
        frontCanvas.width = croppedWidth;
        frontCanvas.height = maxHeight;
        const frontCtx = frontCanvas.getContext('2d');
        if (frontCtx) {
          // Fill with white background first (for any gaps)
          frontCtx.fillStyle = '#FFFFFF';
          frontCtx.fillRect(0, 0, croppedWidth, maxHeight);
          // Center vertically if smaller
          const yOffset = Math.floor((maxHeight - frontTrimmed.height) / 2);
          frontCtx.drawImage(frontTrimmed, 0, yOffset);
        }

        let backCanvas = document.createElement('canvas');
        backCanvas.width = croppedWidth;
        backCanvas.height = maxHeight;
        let backCtx = backCanvas.getContext('2d');
        if (backCtx) {
          // Fill with white background first (for any gaps)
          backCtx.fillStyle = '#FFFFFF';
          backCtx.fillRect(0, 0, croppedWidth, maxHeight);
          // Center vertically if smaller
          const yOffset = Math.floor((maxHeight - backTrimmed.height) / 2);
          backCtx.drawImage(backTrimmed, 0, yOffset);
        }

        // Overlay QR code on back side if URL provided
        if (qrCodeUrl && isValidUrl(qrCodeUrl) && backCtx) {
          try {
            const qrBase64 = await generateQrCodeBase64(qrCodeUrl);
            const qrImg = new Image();

            await new Promise<void>((resolveQr) => {
              qrImg.onload = () => {
                // Calculate QR code size and position based on cropped dimensions
                const croppedWidth = backCanvas.width;
                const croppedHeight = backCanvas.height;
                const qrSize = Math.round(croppedWidth * qrSizePercent);
                const padding = Math.round(croppedWidth * qrPaddingPercent);

                // Position: bottom right of back side
                const x = croppedWidth - qrSize - padding;
                const y = croppedHeight - qrSize - padding;

                // Draw white background with rounded corners and very soft transparent fade at edges
                const bgPadding = Math.round(qrSize * 0.08);
                const fadeSize = Math.round(qrSize * 0.25); // Larger fade zone for softer transition
                const cornerRadius = Math.round(qrSize * 0.1); // Rounded corner radius

                const bgX = x - bgPadding;
                const bgY = y - bgPadding;
                const bgWidth = qrSize + bgPadding * 2;
                const bgHeight = qrSize + bgPadding * 2;

                // Draw many layers with very gradual opacity decrease for ultra-soft edge
                const layers = 20;
                for (let i = layers; i >= 0; i--) {
                  const t = i / layers; // 0 = inner, 1 = outer
                  const expansion = fadeSize * t;
                  // Use smooth cubic easing for very gradual fade
                  // Inner layers (small t) have high opacity, outer layers fade to 0
                  // Max opacity 0.7 for more transparency
                  const opacity = i === 0 ? 0.5 : Math.pow(1 - t, 3) * 0.25;

                  const layerX = bgX - expansion;
                  const layerY = bgY - expansion;
                  const layerWidth = bgWidth + expansion * 2;
                  const layerHeight = bgHeight + expansion * 2;
                  const layerRadius = cornerRadius + expansion * 0.6;

                  backCtx!.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                  backCtx!.beginPath();
                  backCtx!.roundRect(layerX, layerY, layerWidth, layerHeight, layerRadius);
                  backCtx!.fill();
                }

                // Draw QR code
                backCtx!.drawImage(qrImg, x, y, qrSize, qrSize);
                resolveQr();
              };

              qrImg.onerror = () => {
                console.warn('Failed to load QR code image, continuing without it');
                resolveQr(); // Continue without QR code
              };

              qrImg.src = `data:image/png;base64,${qrBase64}`;
            });
          } catch (error) {
            console.warn('Failed to generate QR code:', error);
            // Continue without QR code
          }
        }

        // Convert to base64
        const frontBase64 = frontCanvas.toDataURL('image/png').split(',')[1];
        const backBase64 = backCanvas.toDataURL('image/png').split(',')[1];

        resolve({
          frontBase64,
          backBase64,
          originalBase64: imageBase64,
          dimensions: {
            width: frontCanvas.width,
            height: frontCanvas.height,
          },
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = `data:image/png;base64,${imageBase64}`;
  });
}

/**
 * Resize a base64 image to target dimensions and convert to JPEG
 */
async function resizeAndCompressImage(
  base64: string,
  targetWidth: number,
  targetHeight: number,
  quality: number = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw scaled image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Convert to JPEG with compression
      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
      const jpegBase64 = jpegDataUrl.split(',')[1];
      resolve(jpegBase64);
    };

    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = `data:image/png;base64,${base64}`;
  });
}

/**
 * Generate a PDF with front and back sides for printing.
 * Uses jspdf library.
 *
 * Output: 139mm width at 600 DPI, no margins or background.
 * Page size is exactly the image size.
 * Images are compressed as JPEG and scaled to target DPI for smaller file size.
 */
export async function generateVoucherPdf(
  images: ProcessedVoucherImages
): Promise<Blob> {
  // Dynamically import jspdf to reduce initial bundle size
  const { jsPDF } = await import('jspdf');

  const { frontBase64, backBase64, dimensions } = images;

  // Fixed width of 139mm at 600 DPI
  const imgWidthMm = 139;
  const dpi = 600;

  // Calculate height based on aspect ratio
  const aspectRatio = dimensions.width / dimensions.height;
  const imgHeightMm = imgWidthMm / aspectRatio;

  // Calculate target pixel dimensions for 600 DPI
  // 1 inch = 25.4mm, so pixels = mm * dpi / 25.4
  const targetWidthPx = Math.round(imgWidthMm * dpi / 25.4);
  const targetHeightPx = Math.round(imgHeightMm * dpi / 25.4);

  // Resize and compress images to JPEG
  const [frontJpeg, backJpeg] = await Promise.all([
    resizeAndCompressImage(frontBase64, targetWidthPx, targetHeightPx, 0.92),
    resizeAndCompressImage(backBase64, targetWidthPx, targetHeightPx, 0.92),
  ]);

  // Create PDF with custom page size matching the image exactly (no margins/background)
  const pdf = new jsPDF({
    orientation: imgWidthMm > imgHeightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [imgWidthMm, imgHeightMm],
  });

  // Add front side on first page (positioned at 0,0, full page)
  pdf.addImage(
    `data:image/jpeg;base64,${frontJpeg}`,
    'JPEG',
    0, 0,
    imgWidthMm, imgHeightMm
  );

  // Add back side on second page
  pdf.addPage([imgWidthMm, imgHeightMm]);
  pdf.addImage(
    `data:image/jpeg;base64,${backJpeg}`,
    'JPEG',
    0, 0,
    imgWidthMm, imgHeightMm
  );

  return pdf.output('blob');
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download a base64 image
 */
export function downloadBase64Image(base64: string, filename: string, mimeType: string = 'image/png'): void {
  const link = document.createElement('a');
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = filename;
  link.click();
}
