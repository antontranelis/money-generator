/**
 * PDF Generator V2
 *
 * Vereinfachter PDF-Generator für das V2 Template-System.
 * Nimmt bereits gerenderte Bilder (Data URLs) und erzeugt ein druckfertiges PDF mit Bleed.
 */

import { jsPDF } from 'jspdf';

// Bleed configuration (3mm at 600 DPI = 71 pixels per side)
const BLEED_MM = 3;
const DPI = 600;
const BLEED_PX = Math.round((BLEED_MM / 25.4) * DPI); // ~71 pixels

interface PdfV2Options {
  /** Data URL des gerenderten Front-Bildes (volle Auflösung) */
  frontImageDataUrl: string;
  /** Data URL des gerenderten Back-Bildes (volle Auflösung) */
  backImageDataUrl: string;
  /** Template-Breite in Pixeln */
  templateWidth: number;
  /** Template-Höhe in Pixeln */
  templateHeight: number;
  /** Dateiname für den Download */
  filename: string;
}

/**
 * Lade ein Bild aus einer Data URL
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Füge Bleed (Beschnitt) zu einem Bild hinzu
 * Erweitert die Ränder durch Wiederholung der Randpixel
 */
function addBleedToImage(
  img: HTMLImageElement,
  bleedPx: number
): HTMLCanvasElement {
  const width = img.width;
  const height = img.height;
  const bleedWidth = width + bleedPx * 2;
  const bleedHeight = height + bleedPx * 2;

  const canvas = document.createElement('canvas');
  canvas.width = bleedWidth;
  canvas.height = bleedHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw the original image in the center
  ctx.drawImage(img, bleedPx, bleedPx);

  // Extend edges by stretching edge pixels
  // Top edge - stretch top row
  ctx.drawImage(img, 0, 0, width, 1, bleedPx, 0, width, bleedPx);
  // Bottom edge - stretch bottom row
  ctx.drawImage(img, 0, height - 1, width, 1, bleedPx, height + bleedPx, width, bleedPx);
  // Left edge - stretch left column
  ctx.drawImage(img, 0, 0, 1, height, 0, bleedPx, bleedPx, height);
  // Right edge - stretch right column
  ctx.drawImage(img, width - 1, 0, 1, height, width + bleedPx, bleedPx, bleedPx, height);

  // Corners - fill with corner pixel colors
  // Top-left corner
  ctx.drawImage(img, 0, 0, 1, 1, 0, 0, bleedPx, bleedPx);
  // Top-right corner
  ctx.drawImage(img, width - 1, 0, 1, 1, width + bleedPx, 0, bleedPx, bleedPx);
  // Bottom-left corner
  ctx.drawImage(img, 0, height - 1, 1, 1, 0, height + bleedPx, bleedPx, bleedPx);
  // Bottom-right corner
  ctx.drawImage(img, width - 1, height - 1, 1, 1, width + bleedPx, height + bleedPx, bleedPx, bleedPx);

  return canvas;
}

/**
 * Generiere ein PDF aus bereits gerenderten Template-Bildern
 */
export async function generateBillPdfV2(options: PdfV2Options): Promise<Blob> {
  const {
    frontImageDataUrl,
    backImageDataUrl,
    templateWidth,
    templateHeight,
  } = options;

  // Load images
  const [frontImg, backImg] = await Promise.all([
    loadImage(frontImageDataUrl),
    loadImage(backImageDataUrl),
  ]);

  // Add bleed to both images
  const frontWithBleed = addBleedToImage(frontImg, BLEED_PX);
  const backWithBleed = addBleedToImage(backImg, BLEED_PX);

  // Convert to data URLs (JPEG for smaller file size)
  const frontBleedDataUrl = frontWithBleed.toDataURL('image/jpeg', 0.95);
  const backBleedDataUrl = backWithBleed.toDataURL('image/jpeg', 0.95);

  // Calculate PDF dimensions in mm
  // Template is designed for 600 DPI, so we convert pixels to mm
  const pxToMm = (px: number) => (px / DPI) * 25.4;

  const contentWidthMm = pxToMm(templateWidth);
  const contentHeightMm = pxToMm(templateHeight);
  const pageWidthMm = contentWidthMm + BLEED_MM * 2;
  const pageHeightMm = contentHeightMm + BLEED_MM * 2;

  // Create PDF
  const pdf = new jsPDF({
    orientation: pageWidthMm > pageHeightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidthMm, pageHeightMm],
  });

  // Add front side
  pdf.addImage(frontBleedDataUrl, 'JPEG', 0, 0, pageWidthMm, pageHeightMm);

  // Add back side on new page
  pdf.addPage([pageWidthMm, pageHeightMm]);
  pdf.addImage(backBleedDataUrl, 'JPEG', 0, 0, pageWidthMm, pageHeightMm);

  return pdf.output('blob');
}

/**
 * Download einen Blob als Datei
 */
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

/**
 * Exportiere als PDF und starte den Download
 */
export async function exportBillAsPdfV2(options: PdfV2Options): Promise<void> {
  const blob = await generateBillPdfV2(options);
  downloadBlob(blob, options.filename);
}
