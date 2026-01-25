import QRCode from 'qrcode';

/**
 * Generate a QR code as base64 PNG image
 */
export async function generateQrCodeBase64(url: string): Promise<string> {
  if (!url.trim()) {
    throw new Error('URL is required');
  }

  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Remove data URL prefix to get just base64
  return dataUrl.split(',')[1];
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
