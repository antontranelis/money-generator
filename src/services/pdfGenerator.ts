import { jsPDF } from 'jspdf';
import type { TemplateLayout, HourValue } from '../types/bill';

interface PDFGeneratorOptions {
  frontTemplateSrc: string;
  backTemplateSrc: string;
  templateWidth: number;
  templateHeight: number;
  layout: { front: TemplateLayout; back: TemplateLayout };
  portrait: string | null;
  portraitZoom?: number;
  portraitPanX?: number;
  portraitPanY?: number;
  templateHue?: number;
  name: string;
  email: string;
  phone: string;
  description: string;
  filename: string;
  language?: 'de' | 'en';
  hours?: HourValue;
}

export interface WorkerResponse {
  type: 'success' | 'error';
  frontImageData?: ArrayBuffer;
  backImageData?: ArrayBuffer;
  width?: number;
  height?: number;
  error?: string;
}

// Inline worker code as string - bundler agnostic, works with Vite, Next.js, Webpack, etc.
const workerCode = `
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

// Banner arc text settings (at full 3633x1920 resolution)
const BANNER_CONFIG = {
  centerX: 1816,
  centerY: 3820,
  radius: 3610,
  fontSize: 103,
  color: '#2a3a2a',
};

// RGB to HSL conversion
function rgbToHsl(r, g, b) {
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
function hslToRgb(h, s, l) {
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  const hue2rgb = (p, q, t) => {
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
function applyHueShiftToImageData(imageData, targetHue) {
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
async function loadImageBitmap(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

// Draw oval portrait with clipping
function drawOvalPortrait(ctx, portrait, centerX, centerY, radiusX, radiusY, zoom, panX, panY) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const imgAspect = portrait.width / portrait.height;
  const ellipseAspect = radiusX / radiusY;
  const ellipseWidth = radiusX * 2;
  const ellipseHeight = radiusY * 2;

  let drawWidth, drawHeight;

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
function drawText(ctx, text, x, y, fontSize, align, maxWidth) {
  ctx.save();
  ctx.font = fontSize + 'px "Times New Roman", serif';
  ctx.textAlign = align || 'center';
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
function drawMultilineText(ctx, text, x, y, fontSize, maxWidth, lineHeight, align) {
  ctx.save();
  ctx.font = fontSize + 'px "Times New Roman", serif';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#2a3a2a';

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
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
function drawContactInfo(ctx, name, email, phone, x, y, fontSize, lineHeight, align) {
  ctx.save();
  ctx.font = fontSize + 'px "Times New Roman", serif';
  ctx.textAlign = align || 'center';
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

// Draw text along an arc (curved text for banner)
function drawTextOnArc(ctx, text, centerX, centerY, radius, fontSize, color) {
  ctx.save();
  ctx.font = '900 ' + fontSize + 'px "Times New Roman", Georgia, serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Measure total text width
  const textWidth = ctx.measureText(text).width;

  // Calculate the angle span based on text width and radius
  const angleSpan = textWidth / radius;

  // Center the text on the arc (at -90 degrees = top of circle)
  const startAngle = -Math.PI / 2 - angleSpan / 2;

  // Get individual character widths
  const chars = text.split('');
  const charWidths = [];
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

// Draw banner text on both sides
function drawBannerText(ctx, hours, language) {
  const bannerText = TRANSLATIONS[language].banner[hours];
  drawTextOnArc(
    ctx,
    bannerText,
    BANNER_CONFIG.centerX,
    BANNER_CONFIG.centerY,
    BANNER_CONFIG.radius,
    BANNER_CONFIG.fontSize,
    BANNER_CONFIG.color
  );
}

self.onmessage = async (e) => {
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
    language,
    hours,
  } = e.data;

  try {
    // Load images
    const [frontTemplate, backTemplate] = await Promise.all([
      loadImageBitmap(frontTemplateUrl),
      loadImageBitmap(backTemplateUrl),
    ]);

    let portrait = null;
    if (portraitUrl) {
      portrait = await loadImageBitmap(portraitUrl);
    }

    // Create offscreen canvases
    const frontCanvas = new OffscreenCanvas(templateWidth, templateHeight);
    const backCanvas = new OffscreenCanvas(templateWidth, templateHeight);
    const frontCtx = frontCanvas.getContext('2d');
    const backCtx = backCanvas.getContext('2d');

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
        layout.front.namePlate.align || 'center',
        layout.front.namePlate.maxWidth
      );
    }

    // Draw banner text on front
    drawBannerText(frontCtx, hours, language);

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
        layout.back.contactInfo.align || 'center'
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
        layout.back.description.align || 'center'
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
        layout.back.namePlate.align || 'center',
        layout.back.namePlate.maxWidth
      );
    }

    // Draw signature field on back
    if (layout.back.signature) {
      const sig = layout.back.signature;
      const signatureLabel = language === 'de' ? 'Unterschrift' : 'Signature';

      // Draw signature line at (x, y)
      backCtx.strokeStyle = '#2a3a2a';
      backCtx.lineWidth = Math.max(2, sig.labelFontSize / 16);
      backCtx.beginPath();
      backCtx.moveTo(sig.x - sig.width / 2, sig.y);
      backCtx.lineTo(sig.x + sig.width / 2, sig.y);
      backCtx.stroke();

      // Draw label below line
      backCtx.font = \`\${sig.labelFontSize}px "Times New Roman", serif\`;
      backCtx.textAlign = 'center';
      backCtx.textBaseline = 'top';
      backCtx.fillStyle = '#2a3a2a';
      backCtx.fillText(signatureLabel, sig.x, sig.y + sig.labelFontSize * 0.3);
    }

    // Draw banner text on back
    drawBannerText(backCtx, hours, language);

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
    self.postMessage({
      type: 'success',
      frontImageData: frontBuffer,
      backImageData: backBuffer,
      width: templateWidth,
      height: templateHeight,
    }, [frontBuffer, backBuffer]);
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: String(error),
    });
  }
};
`;

// Create worker lazily from inline code
let worker: Worker | null = null;
let workerBlobUrl: string | null = null;

function getWorker(): Worker {
  if (!worker) {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerBlobUrl = URL.createObjectURL(blob);
    worker = new Worker(workerBlobUrl, { type: 'module' });
  }
  return worker;
}

// Convert any URL (data URL, relative URL, absolute URL) to blob URL for worker
async function toBlobUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// Convert ArrayBuffer to base64 data URL
function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export async function generateBillPDF(options: PDFGeneratorOptions): Promise<Blob> {
  const {
    frontTemplateSrc,
    backTemplateSrc,
    templateWidth,
    templateHeight,
    layout,
    portrait,
    portraitZoom = 1,
    portraitPanX = 0,
    portraitPanY = 0,
    templateHue = 160,
    name,
    email,
    phone,
    description,
    language = 'de',
    hours = 1,
  } = options;

  // Convert all URLs to blob URLs for worker (worker can't resolve relative URLs)
  const [frontBlobUrl, backBlobUrl] = await Promise.all([
    toBlobUrl(frontTemplateSrc),
    toBlobUrl(backTemplateSrc),
  ]);

  let portraitBlobUrl: string | null = null;
  if (portrait) {
    portraitBlobUrl = await toBlobUrl(portrait);
  }

  return new Promise((resolve, reject) => {
    const w = getWorker();

    // Timeout for mobile devices (60 seconds - high-res rendering takes time)
    const timeoutId = setTimeout(() => {
      w.removeEventListener('message', handleMessage);
      w.removeEventListener('error', handleError);
      URL.revokeObjectURL(frontBlobUrl);
      URL.revokeObjectURL(backBlobUrl);
      if (portraitBlobUrl) URL.revokeObjectURL(portraitBlobUrl);
      reject(new Error('PDF generation timed out. Please try again.'));
    }, 60000);

    const handleMessage = (e: MessageEvent<WorkerResponse>) => {
      clearTimeout(timeoutId);
      w.removeEventListener('message', handleMessage);
      w.removeEventListener('error', handleError);

      // Clean up blob URLs
      URL.revokeObjectURL(frontBlobUrl);
      URL.revokeObjectURL(backBlobUrl);
      if (portraitBlobUrl) URL.revokeObjectURL(portraitBlobUrl);

      if (e.data.type === 'success') {
        try {
          // Create PDF in main thread from worker's image data
          const { frontImageData, backImageData, width, height } = e.data;

          if (!frontImageData || !backImageData || !width || !height) {
            reject(new Error('Invalid response from worker'));
            return;
          }

          // Convert ArrayBuffers to data URLs
          const frontDataUrl = arrayBufferToDataUrl(frontImageData, 'image/jpeg');
          const backDataUrl = arrayBufferToDataUrl(backImageData, 'image/jpeg');

          // Create PDF at 600 DPI (template is 3633x1920 at 600 DPI = ~154x81mm)
          const DPI = 600;
          const widthMM = (width / DPI) * 25.4;
          const heightMM = (height / DPI) * 25.4;

          const pdf = new jsPDF({
            orientation: widthMM > heightMM ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [widthMM, heightMM],
          });

          // Add front side
          pdf.addImage(frontDataUrl, 'JPEG', 0, 0, widthMM, heightMM);

          // Add back side on new page
          pdf.addPage([widthMM, heightMM]);
          pdf.addImage(backDataUrl, 'JPEG', 0, 0, widthMM, heightMM);

          // Return as blob
          const pdfBlob = pdf.output('blob');
          resolve(pdfBlob);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(e.data.error));
      }
    };

    const handleError = (e: ErrorEvent) => {
      w.removeEventListener('message', handleMessage);
      w.removeEventListener('error', handleError);

      URL.revokeObjectURL(frontBlobUrl);
      URL.revokeObjectURL(backBlobUrl);
      if (portraitBlobUrl) URL.revokeObjectURL(portraitBlobUrl);

      reject(new Error(e.message));
    };

    w.addEventListener('message', handleMessage);
    w.addEventListener('error', handleError);

    w.postMessage({
      type: 'generate',
      frontTemplateUrl: frontBlobUrl,
      backTemplateUrl: backBlobUrl,
      portraitUrl: portraitBlobUrl,
      templateWidth,
      templateHeight,
      templateHue,
      portraitZoom,
      portraitPanX,
      portraitPanY,
      layout: {
        front: {
          portrait: layout.front.portrait,
          namePlate: layout.front.namePlate,
        },
        back: {
          namePlate: layout.back.namePlate,
          contactInfo: layout.back.contactInfo,
          description: layout.back.description,
          signature: layout.back.signature,
        },
      },
      name,
      email,
      phone,
      description,
      language,
      hours,
    });
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportBillAsPDF(options: PDFGeneratorOptions): Promise<void> {
  const blob = await generateBillPDF(options);
  downloadBlob(blob, options.filename);
}

// Cleanup worker when no longer needed
export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  if (workerBlobUrl) {
    URL.revokeObjectURL(workerBlobUrl);
    workerBlobUrl = null;
  }
}
