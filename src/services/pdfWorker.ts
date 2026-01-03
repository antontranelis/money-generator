// Web Worker for image processing (PDF generation happens in main thread)
// This runs in a separate thread to avoid blocking the UI
// Compatible with both Vite and Next.js when used as inline worker

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

// Apply hue shift to ImageData
function applyHueShiftToImageData(imageData: ImageData, targetHue: number): void {
  if (targetHue >= 155 && targetHue <= 165) return;

  const pixels = new Uint32Array(imageData.data.buffer);
  const targetH = (targetHue % 360) / 360;
  const coolHueMin = 60 / 360;
  const coolHueMax = 260 / 360;

  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    const r = pixel & 0xff;
    const g = (pixel >> 8) & 0xff;
    const b = (pixel >> 16) & 0xff;
    const a = (pixel >> 24) & 0xff;

    if (a === 0) continue;

    const [h, s, l] = rgbToHsl(r, g, b);
    if (s < 0.06) continue;
    if (h < coolHueMin || h > coolHueMax) continue;

    const [newR, newG, newB] = hslToRgb(targetH, s, l);
    pixels[i] = (a << 24) | (newB << 16) | (newG << 8) | newR;
  }
}

// Load image from blob URL in worker
async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const response = await fetch(url);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

// Draw oval portrait with clipping
function drawOvalPortrait(
  ctx: OffscreenCanvasRenderingContext2D,
  portrait: ImageBitmap,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  zoom: number,
  panX: number,
  panY: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const imgAspect = portrait.width / portrait.height;
  const ellipseAspect = radiusX / radiusY;
  const ellipseWidth = radiusX * 2;
  const ellipseHeight = radiusY * 2;

  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > ellipseAspect) {
    drawHeight = ellipseHeight;
    drawWidth = ellipseHeight * imgAspect;
  } else {
    drawWidth = ellipseWidth;
    drawHeight = ellipseWidth / imgAspect;
  }

  drawWidth *= zoom;
  drawHeight *= zoom;

  const maxPanX = Math.max(0, (drawWidth - ellipseWidth) / 2);
  const maxPanY = Math.max(0, (drawHeight - ellipseHeight) / 2);

  const drawX = centerX - drawWidth / 2 + panX * maxPanX;
  const drawY = centerY - drawHeight / 2 + panY * maxPanY;

  ctx.drawImage(portrait, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

// Draw text
function drawText(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  align: CanvasTextAlign = 'center',
  maxWidth?: number
): void {
  ctx.save();
  ctx.font = `${fontSize}px "Times New Roman", serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2a3a2a';

  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

// Draw multiline text
function drawMultilineText(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = 'center'
): void {
  ctx.save();
  ctx.font = `${fontSize}px "Times New Roman", serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#2a3a2a';

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
  if (currentLine) lines.push(currentLine);

  const totalHeight = lines.length * lineHeight;
  let startY = y - totalHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, x, startY);
    startY += lineHeight;
  }
  ctx.restore();
}

// Draw contact info
function drawContactInfo(
  ctx: OffscreenCanvasRenderingContext2D,
  name: string,
  email: string,
  phone: string,
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  align: CanvasTextAlign = 'center'
): void {
  ctx.save();
  ctx.font = `${fontSize}px "Times New Roman", serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2a3a2a';

  const lines = [name, email, phone].filter(Boolean);
  const totalHeight = (lines.length - 1) * lineHeight;
  let currentY = y - totalHeight / 2;

  for (const line of lines) {
    if (line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  }
  ctx.restore();
}

export interface WorkerMessage {
  type: 'generate';
  frontTemplateUrl: string;
  backTemplateUrl: string;
  portraitUrl: string | null;
  templateWidth: number;
  templateHeight: number;
  templateHue: number;
  portraitZoom: number;
  portraitPanX: number;
  portraitPanY: number;
  layout: {
    front: {
      portrait: { x: number; y: number; radiusX: number; radiusY: number };
      namePlate: { x: number; y: number; fontSize: number; maxWidth?: number; align?: string };
    };
    back: {
      namePlate: { x: number; y: number; fontSize: number; maxWidth?: number; align?: string };
      contactInfo?: { x: number; y: number; fontSize: number; lineHeight?: number; align?: string };
      description?: { x: number; y: number; fontSize: number; maxWidth?: number; lineHeight?: number; align?: string };
    };
  };
  name: string;
  email: string;
  phone: string;
  description: string;
}

export interface WorkerResponse {
  type: 'success' | 'error';
  frontImageData?: ArrayBuffer;
  backImageData?: ArrayBuffer;
  width?: number;
  height?: number;
  error?: string;
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const {
    frontTemplateUrl,
    backTemplateUrl,
    portraitUrl,
    templateWidth,
    templateHeight,
    templateHue,
    portraitZoom,
    portraitPanX,
    portraitPanY,
    layout,
    name,
    email,
    phone,
    description,
  } = e.data;

  try {
    // Load images
    const [frontTemplate, backTemplate] = await Promise.all([
      loadImageBitmap(frontTemplateUrl),
      loadImageBitmap(backTemplateUrl),
    ]);

    let portrait: ImageBitmap | null = null;
    if (portraitUrl) {
      portrait = await loadImageBitmap(portraitUrl);
    }

    // Create offscreen canvases
    const frontCanvas = new OffscreenCanvas(templateWidth, templateHeight);
    const backCanvas = new OffscreenCanvas(templateWidth, templateHeight);
    const frontCtx = frontCanvas.getContext('2d')!;
    const backCtx = backCanvas.getContext('2d')!;

    // Render front side
    frontCtx.drawImage(frontTemplate, 0, 0, templateWidth, templateHeight);

    // Apply hue shift to front
    if (templateHue < 155 || templateHue > 165) {
      const frontImageData = frontCtx.getImageData(0, 0, templateWidth, templateHeight);
      applyHueShiftToImageData(frontImageData, templateHue);
      frontCtx.putImageData(frontImageData, 0, 0);
    }

    // Draw portrait
    if (portrait) {
      drawOvalPortrait(
        frontCtx,
        portrait,
        layout.front.portrait.x,
        layout.front.portrait.y,
        layout.front.portrait.radiusX,
        layout.front.portrait.radiusY,
        portraitZoom,
        portraitPanX,
        portraitPanY
      );
    }

    // Draw name on front
    if (name) {
      drawText(
        frontCtx,
        name,
        layout.front.namePlate.x,
        layout.front.namePlate.y,
        layout.front.namePlate.fontSize,
        (layout.front.namePlate.align as CanvasTextAlign) || 'center',
        layout.front.namePlate.maxWidth
      );
    }

    // Render back side
    backCtx.drawImage(backTemplate, 0, 0, templateWidth, templateHeight);

    // Apply hue shift to back
    if (templateHue < 155 || templateHue > 165) {
      const backImageData = backCtx.getImageData(0, 0, templateWidth, templateHeight);
      applyHueShiftToImageData(backImageData, templateHue);
      backCtx.putImageData(backImageData, 0, 0);
    }

    // Draw contact info
    if (layout.back.contactInfo && (name || email || phone)) {
      drawContactInfo(
        backCtx,
        name,
        email,
        phone,
        layout.back.contactInfo.x,
        layout.back.contactInfo.y,
        layout.back.contactInfo.fontSize,
        layout.back.contactInfo.lineHeight || layout.back.contactInfo.fontSize * 1.8,
        (layout.back.contactInfo.align as CanvasTextAlign) || 'center'
      );
    }

    // Draw description
    if (layout.back.description && description) {
      drawMultilineText(
        backCtx,
        description,
        layout.back.description.x,
        layout.back.description.y,
        layout.back.description.fontSize,
        layout.back.description.maxWidth || 400,
        layout.back.description.lineHeight || layout.back.description.fontSize * 1.4,
        (layout.back.description.align as CanvasTextAlign) || 'center'
      );
    }

    // Draw name on back
    if (name) {
      drawText(
        backCtx,
        name,
        layout.back.namePlate.x,
        layout.back.namePlate.y,
        layout.back.namePlate.fontSize,
        (layout.back.namePlate.align as CanvasTextAlign) || 'center',
        layout.back.namePlate.maxWidth
      );
    }

    // Convert canvases to blobs and then to ArrayBuffer for transfer
    const [frontBlob, backBlob] = await Promise.all([
      frontCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 }),
      backCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 }),
    ]);

    const [frontBuffer, backBuffer] = await Promise.all([
      frontBlob.arrayBuffer(),
      backBlob.arrayBuffer(),
    ]);

    // Transfer buffers back to main thread (zero-copy)
    const response: WorkerResponse = {
      type: 'success',
      frontImageData: frontBuffer,
      backImageData: backBuffer,
      width: templateWidth,
      height: templateHeight,
    };

    (self as unknown as Worker).postMessage(response, [frontBuffer, backBuffer]);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      error: String(error),
    };
    self.postMessage(response);
  }
};
