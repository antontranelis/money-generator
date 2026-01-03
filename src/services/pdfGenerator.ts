import { jsPDF } from 'jspdf';
import type { TemplateLayout } from '../types/bill';
import type { WorkerResponse } from './pdfWorker';

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
}

// Create worker lazily
let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./pdfWorker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

// Convert data URL to blob URL for worker
async function dataUrlToBlobUrl(dataUrl: string): Promise<string> {
  const response = await fetch(dataUrl);
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
  } = options;

  // Convert portrait data URL to blob URL if needed
  let portraitUrl: string | null = null;
  if (portrait) {
    portraitUrl = await dataUrlToBlobUrl(portrait);
  }

  return new Promise((resolve, reject) => {
    const w = getWorker();

    const handleMessage = (e: MessageEvent<WorkerResponse>) => {
      w.removeEventListener('message', handleMessage);
      w.removeEventListener('error', handleError);

      // Clean up blob URLs
      if (portraitUrl) URL.revokeObjectURL(portraitUrl);

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

          // Create PDF
          const widthMM = (width / 96) * 25.4;
          const heightMM = (height / 96) * 25.4;

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

      if (portraitUrl) URL.revokeObjectURL(portraitUrl);

      reject(new Error(e.message));
    };

    w.addEventListener('message', handleMessage);
    w.addEventListener('error', handleError);

    w.postMessage({
      type: 'generate',
      frontTemplateUrl: frontTemplateSrc,
      backTemplateUrl: backTemplateSrc,
      portraitUrl,
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
        },
      },
      name,
      email,
      phone,
      description,
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
}
