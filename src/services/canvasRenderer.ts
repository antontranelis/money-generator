import type { TemplateLayout, TextConfig } from '../types/bill';

// Image cache to avoid reloading
const imageCache = new Map<string, HTMLImageElement>();

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

export function drawOvalPortrait(
  ctx: CanvasRenderingContext2D,
  portrait: HTMLImageElement,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  zoom: number = 1
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

  // Center the image within the ellipse
  const drawX = centerX - drawWidth / 2;
  const drawY = centerY - drawHeight / 2;

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

export async function renderFrontSide(
  canvas: HTMLCanvasElement,
  templateSrc: string,
  portraitSrc: string | null,
  name: string,
  layout: TemplateLayout,
  width: number,
  height: number,
  portraitZoom: number = 1
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = width;
  canvas.height = height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw template
  const template = await loadImage(templateSrc);
  drawTemplate(ctx, template, width, height);

  // Draw portrait if available
  if (portraitSrc) {
    try {
      const portrait = await loadImage(portraitSrc);
      drawOvalPortrait(
        ctx,
        portrait,
        layout.portrait.x,
        layout.portrait.y,
        layout.portrait.radiusX,
        layout.portrait.radiusY,
        portraitZoom
      );
    } catch (e) {
      console.error('Failed to load portrait:', e);
    }
  }

  // Draw name
  if (name) {
    drawText(ctx, name, layout.namePlate);
  }
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
  height: number
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = width;
  canvas.height = height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw template
  const template = await loadImage(templateSrc);
  drawTemplate(ctx, template, width, height);

  // Draw contact info
  if (layout.contactInfo && (name || email || phone)) {
    drawContactInfo(ctx, name, email, phone, layout.contactInfo);
  }

  // Draw description
  if (layout.description && description) {
    drawMultilineText(ctx, description, layout.description);
  }

  // Draw name at bottom
  if (name) {
    drawText(ctx, name, layout.namePlate);
  }
}
