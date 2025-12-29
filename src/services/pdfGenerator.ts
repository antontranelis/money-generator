import jsPDF from 'jspdf';
import { renderFrontSide, renderBackSide } from './canvasRenderer';
import type { TemplateLayout } from '../types/bill';

interface PDFGeneratorOptions {
  frontTemplateSrc: string;
  backTemplateSrc: string;
  templateWidth: number;
  templateHeight: number;
  layout: { front: TemplateLayout; back: TemplateLayout };
  portrait: string | null;
  portraitZoom?: number;
  name: string;
  email: string;
  phone: string;
  description: string;
  filename: string;
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
    name,
    email,
    phone,
    description,
  } = options;

  // Create offscreen canvases for rendering
  const frontCanvas = document.createElement('canvas');
  const backCanvas = document.createElement('canvas');

  // Render both sides
  await Promise.all([
    renderFrontSide(frontCanvas, frontTemplateSrc, portrait, name, layout.front, templateWidth, templateHeight, portraitZoom),
    renderBackSide(backCanvas, backTemplateSrc, name, email, phone, description, layout.back, templateWidth, templateHeight),
  ]);

  // Create PDF in landscape A4
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297; // A4 landscape width in mm
  const pageHeight = 210; // A4 landscape height in mm
  const margin = 10;

  // Calculate bill dimensions to fit on page
  const billAspect = templateWidth / templateHeight;
  let billWidth = pageWidth - margin * 2;
  let billHeight = billWidth / billAspect;

  if (billHeight > pageHeight - margin * 2) {
    billHeight = pageHeight - margin * 2;
    billWidth = billHeight * billAspect;
  }

  const offsetX = (pageWidth - billWidth) / 2;
  const offsetY = (pageHeight - billHeight) / 2;

  // Add front side
  const frontDataUrl = frontCanvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(frontDataUrl, 'JPEG', offsetX, offsetY, billWidth, billHeight);

  // Add back side on new page
  pdf.addPage();
  const backDataUrl = backCanvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(backDataUrl, 'JPEG', offsetX, offsetY, billWidth, billHeight);

  // Return as blob
  return pdf.output('blob');
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
