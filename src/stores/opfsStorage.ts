/**
 * OPFS (Origin Private File System) Storage Helper
 *
 * Uses the modern File System Access API for storing large binary data.
 * OPFS provides significantly higher storage limits than IndexedDB
 * (up to 60% of available disk space vs ~50MB for IndexedDB).
 *
 * Architecture:
 * - Voucher images are stored as files in OPFS
 * - IndexedDB stores only metadata and file references
 * - Files are organized by voucher ID in a flat structure
 */

const OPFS_DIR_NAME = 'voucher-images';

let rootDirHandle: FileSystemDirectoryHandle | null = null;

/**
 * Check if the browser supports WebP encoding via canvas
 */
let webpSupported: boolean | null = null;
async function isWebPSupported(): Promise<boolean> {
  if (webpSupported !== null) return webpSupported;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/webp');
    webpSupported = dataUrl.startsWith('data:image/webp');
  } catch {
    webpSupported = false;
  }
  return webpSupported;
}

/**
 * Convert PNG base64 to WebP base64 (lossless)
 * Returns original if WebP is not supported
 */
async function pngToWebP(pngBase64: string): Promise<{ data: string; format: 'webp' | 'png' }> {
  if (!(await isWebPSupported())) {
    return { data: pngBase64, format: 'png' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ data: pngBase64, format: 'png' });
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Use lossless WebP (quality 1.0 = lossless)
      const webpDataUrl = canvas.toDataURL('image/webp', 1.0);
      const webpBase64 = webpDataUrl.split(',')[1];

      // Only use WebP if it's actually smaller
      if (webpBase64.length < pngBase64.length) {
        resolve({ data: webpBase64, format: 'webp' });
      } else {
        resolve({ data: pngBase64, format: 'png' });
      }
    };
    img.onerror = () => {
      resolve({ data: pngBase64, format: 'png' });
    };
    img.src = `data:image/png;base64,${pngBase64}`;
  });
}

/**
 * Convert WebP base64 to PNG base64
 * Used when downloading/exporting images that need to be in PNG format
 */
export async function webpToPng(webpBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const pngDataUrl = canvas.toDataURL('image/png');
      resolve(pngDataUrl.split(',')[1]);
    };
    img.onerror = () => reject(new Error('Failed to load WebP image'));
    img.src = `data:image/webp;base64,${webpBase64}`;
  });
}

/**
 * Check if OPFS is available in the current browser
 */
export function isOpfsAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
}

/**
 * Get the OPFS root directory handle for voucher images
 */
async function getOPFSRoot(): Promise<FileSystemDirectoryHandle> {
  if (rootDirHandle) return rootDirHandle;

  if (!isOpfsAvailable()) {
    throw new Error('OPFS is not available in this browser');
  }

  const root = await navigator.storage.getDirectory();
  rootDirHandle = await root.getDirectoryHandle(OPFS_DIR_NAME, { create: true });
  return rootDirHandle;
}

/**
 * Generate a file name for a voucher image
 * Format suffix indicates the stored format (.webp or .png)
 */
function getFileName(voucherId: string, imageType: 'original' | 'front' | 'back' | 'thumbnail', format: 'webp' | 'png' = 'webp'): string {
  return `${voucherId}-${imageType}.${format}`;
}

/**
 * Try to get file handle, checking both WebP and PNG formats
 * Returns the handle and detected format
 */
async function getFileHandleWithFormat(
  root: FileSystemDirectoryHandle,
  voucherId: string,
  imageType: 'original' | 'front' | 'back' | 'thumbnail'
): Promise<{ handle: FileSystemFileHandle; format: 'webp' | 'png' } | null> {
  // Try WebP first (new format)
  try {
    const webpFileName = getFileName(voucherId, imageType, 'webp');
    const handle = await root.getFileHandle(webpFileName);
    return { handle, format: 'webp' };
  } catch (e) {
    if ((e as DOMException).name !== 'NotFoundError') {
      throw e;
    }
  }

  // Try PNG (legacy format)
  try {
    const pngFileName = getFileName(voucherId, imageType, 'png');
    const handle = await root.getFileHandle(pngFileName);
    return { handle, format: 'png' };
  } catch (e) {
    if ((e as DOMException).name !== 'NotFoundError') {
      throw e;
    }
  }

  // Try old .bin format (for backwards compatibility during migration)
  try {
    const binFileName = `${voucherId}-${imageType}.bin`;
    const handle = await root.getFileHandle(binFileName);
    return { handle, format: 'png' }; // .bin files are PNG
  } catch (e) {
    if ((e as DOMException).name !== 'NotFoundError') {
      throw e;
    }
  }

  return null;
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Convert Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Store a base64 image in OPFS with WebP compression
 */
export async function storeImage(
  voucherId: string,
  imageType: 'original' | 'front' | 'back' | 'thumbnail',
  base64Data: string
): Promise<void> {
  try {
    const root = await getOPFSRoot();

    // Convert to WebP (lossless) if supported and smaller
    const { data, format } = await pngToWebP(base64Data);
    const fileName = getFileName(voucherId, imageType, format);
    const fileHandle = await root.getFileHandle(fileName, { create: true });

    const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
    const writable = await fileHandle.createWritable();
    const blob = base64ToBlob(data, mimeType);
    await writable.write(blob);
    await writable.close();

    // Log compression savings
    if (format === 'webp') {
      const savings = ((base64Data.length - data.length) / base64Data.length * 100).toFixed(1);
      console.log(`[OPFS] Stored ${imageType} as WebP (${savings}% smaller)`);
    }

    // Remove old format files if they exist
    const oldFormats = format === 'webp' ? ['png', 'bin'] : ['bin'];
    for (const oldFormat of oldFormats) {
      const oldFileName = oldFormat === 'bin'
        ? `${voucherId}-${imageType}.bin`
        : getFileName(voucherId, imageType, oldFormat as 'png');
      try {
        await root.removeEntry(oldFileName);
      } catch {
        // Ignore - file doesn't exist
      }
    }
  } catch (e) {
    console.error(`[OPFS] Failed to store image ${voucherId}/${imageType}:`, e);
    throw e;
  }
}

/**
 * Retrieve a base64 image from OPFS
 * Automatically handles both WebP and PNG formats
 * Returns PNG base64 (converts WebP to PNG if needed for compatibility)
 */
export async function retrieveImage(
  voucherId: string,
  imageType: 'original' | 'front' | 'back' | 'thumbnail'
): Promise<string | null> {
  try {
    const root = await getOPFSRoot();
    const result = await getFileHandleWithFormat(root, voucherId, imageType);

    if (!result) {
      return null;
    }

    const { handle, format } = result;
    const file = await handle.getFile();
    const base64 = await blobToBase64(file);

    // If stored as WebP, convert back to PNG for consistent output
    // (This ensures compatibility with download/export functions)
    if (format === 'webp') {
      try {
        return await webpToPng(base64);
      } catch {
        // If conversion fails, return as-is
        return base64;
      }
    }

    return base64;
  } catch (e) {
    console.error(`[OPFS] Failed to retrieve image ${voucherId}/${imageType}:`, e);
    return null;
  }
}

/**
 * Store all images for a voucher
 */
export async function storeVoucherImages(
  voucherId: string,
  images: {
    originalBase64: string;
    frontBase64: string;
    backBase64: string;
    thumbnailBase64: string;
  }
): Promise<void> {
  await Promise.all([
    storeImage(voucherId, 'original', images.originalBase64),
    storeImage(voucherId, 'front', images.frontBase64),
    storeImage(voucherId, 'back', images.backBase64),
    storeImage(voucherId, 'thumbnail', images.thumbnailBase64),
  ]);
}

/**
 * Retrieve all images for a voucher
 */
export async function retrieveVoucherImages(
  voucherId: string
): Promise<{
  originalBase64: string;
  frontBase64: string;
  backBase64: string;
  thumbnailBase64: string;
} | null> {
  const [originalBase64, frontBase64, backBase64, thumbnailBase64] = await Promise.all([
    retrieveImage(voucherId, 'original'),
    retrieveImage(voucherId, 'front'),
    retrieveImage(voucherId, 'back'),
    retrieveImage(voucherId, 'thumbnail'),
  ]);

  // If any image is missing, return null
  if (!originalBase64 || !frontBase64 || !backBase64 || !thumbnailBase64) {
    return null;
  }

  return { originalBase64, frontBase64, backBase64, thumbnailBase64 };
}

/**
 * Delete all images for a voucher (handles all formats: webp, png, bin)
 */
export async function deleteVoucherImages(voucherId: string): Promise<void> {
  try {
    const root = await getOPFSRoot();
    const imageTypes: ('original' | 'front' | 'back' | 'thumbnail')[] = ['original', 'front', 'back', 'thumbnail'];
    const formats = ['webp', 'png', 'bin'] as const;

    await Promise.all(
      imageTypes.flatMap((imageType) =>
        formats.map(async (format) => {
          const fileName = format === 'bin'
            ? `${voucherId}-${imageType}.bin`
            : getFileName(voucherId, imageType, format as 'webp' | 'png');
          try {
            await root.removeEntry(fileName);
          } catch (e) {
            // Ignore "not found" errors
            if ((e as DOMException).name !== 'NotFoundError') {
              console.error(`[OPFS] Failed to delete ${fileName}:`, e);
            }
          }
        })
      )
    );
  } catch (e) {
    console.error(`[OPFS] Failed to delete voucher images ${voucherId}:`, e);
  }
}

/**
 * Delete all voucher images from OPFS
 */
export async function clearAllVoucherImages(): Promise<void> {
  try {
    if (!isOpfsAvailable()) return;

    const root = await navigator.storage.getDirectory();

    // Delete ALL entries in OPFS root (not just voucher-images directory)
    // This ensures we clean up any orphaned files from old formats
    const entriesToDelete: string[] = [];
    // @ts-expect-error - entries() is available in modern browsers but not in TS types
    for await (const [name] of root.entries() as AsyncIterable<[string, FileSystemHandle]>) {
      entriesToDelete.push(name);
    }

    for (const name of entriesToDelete) {
      try {
        await root.removeEntry(name, { recursive: true });
        console.log(`[OPFS] Deleted: ${name}`);
      } catch (e) {
        if ((e as DOMException).name !== 'NotFoundError') {
          console.error(`[OPFS] Failed to delete ${name}:`, e);
        }
      }
    }

    // Reset cached handle
    rootDirHandle = null;

    // Recreate empty voucher-images directory
    rootDirHandle = await root.getDirectoryHandle(OPFS_DIR_NAME, { create: true });

    console.log(`[OPFS] Cleared ${entriesToDelete.length} entries from OPFS`);
  } catch (e) {
    console.error('[OPFS] Failed to clear all voucher images:', e);
  }
}

/**
 * Get estimated storage usage
 */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  } catch (e) {
    console.error('[OPFS] Failed to get storage estimate:', e);
    return null;
  }
}

/**
 * Store version images in OPFS
 */
export async function storeVersionImages(
  voucherId: string,
  versionTimestamp: number,
  images: {
    originalBase64: string;
    frontBase64: string;
    backBase64: string;
  }
): Promise<void> {
  const versionId = `${voucherId}-v${versionTimestamp}`;
  await Promise.all([
    storeImage(versionId, 'original', images.originalBase64),
    storeImage(versionId, 'front', images.frontBase64),
    storeImage(versionId, 'back', images.backBase64),
  ]);
}

/**
 * Retrieve version images from OPFS
 */
export async function retrieveVersionImages(
  voucherId: string,
  versionTimestamp: number
): Promise<{
  originalBase64: string;
  frontBase64: string;
  backBase64: string;
} | null> {
  const versionId = `${voucherId}-v${versionTimestamp}`;
  const [originalBase64, frontBase64, backBase64] = await Promise.all([
    retrieveImage(versionId, 'original'),
    retrieveImage(versionId, 'front'),
    retrieveImage(versionId, 'back'),
  ]);

  if (!originalBase64 || !frontBase64 || !backBase64) {
    return null;
  }

  return { originalBase64, frontBase64, backBase64 };
}

/**
 * Delete version images from OPFS (handles all formats)
 */
export async function deleteVersionImages(voucherId: string, versionTimestamp: number): Promise<void> {
  const versionId = `${voucherId}-v${versionTimestamp}`;
  const imageTypes: ('original' | 'front' | 'back')[] = ['original', 'front', 'back'];
  const formats = ['webp', 'png', 'bin'] as const;

  try {
    const root = await getOPFSRoot();
    await Promise.all(
      imageTypes.flatMap((imageType) =>
        formats.map(async (format) => {
          const fileName = format === 'bin'
            ? `${versionId}-${imageType}.bin`
            : getFileName(versionId, imageType, format as 'webp' | 'png');
          try {
            await root.removeEntry(fileName);
          } catch (e) {
            if ((e as DOMException).name !== 'NotFoundError') {
              console.error(`[OPFS] Failed to delete ${fileName}:`, e);
            }
          }
        })
      )
    );
  } catch (e) {
    console.error(`[OPFS] Failed to delete version images ${versionId}:`, e);
  }
}
