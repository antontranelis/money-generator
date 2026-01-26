import { create } from 'zustand';
import type { SavedVoucher, VoucherVersion } from '../types/voucherGallery';

const DB_NAME = 'voucher-gallery-db';
const STORE_NAME = 'vouchers';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });

  return dbPromise;
}

async function getAllVouchers(): Promise<SavedVoucher[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev'); // Newest first
      const results: SavedVoucher[] = [];

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  } catch (e) {
    console.error('[VoucherGallery] Failed to get vouchers:', e);
    return [];
  }
}

async function saveVoucher(voucher: SavedVoucher): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(voucher);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('[VoucherGallery] Failed to save voucher:', e);
  }
}

async function deleteVoucher(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('[VoucherGallery] Failed to delete voucher:', e);
  }
}

async function clearAllVouchers(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('[VoucherGallery] Failed to clear vouchers:', e);
  }
}

interface VoucherGalleryState {
  vouchers: SavedVoucher[];
  isLoading: boolean;
  isInitialized: boolean;
  /** Currently active voucher ID (for refinements) */
  activeVoucherId: string | null;

  // Actions
  loadVouchers: () => Promise<void>;
  addVoucher: (voucher: Omit<SavedVoucher, 'id' | 'createdAt' | 'thumbnailBase64'>) => Promise<string>;
  /** Add a new version to an existing voucher */
  addVersionToVoucher: (id: string, version: Omit<VoucherVersion, 'timestamp'>) => Promise<void>;
  removeVoucher: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  setActiveVoucherId: (id: string | null) => void;
}

/**
 * Generate a thumbnail from a base64 image
 */
async function generateThumbnail(base64: string, maxSize: number = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Use JPEG for smaller thumbnails
        resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
    img.src = `data:image/png;base64,${base64}`;
  });
}

export const useVoucherGalleryStore = create<VoucherGalleryState>((set, get) => ({
  vouchers: [],
  isLoading: false,
  isInitialized: false,
  activeVoucherId: null,

  loadVouchers: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    const vouchers = await getAllVouchers();
    set({ vouchers, isLoading: false, isInitialized: true });
  },

  addVoucher: async (voucherData) => {
    const id = `voucher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const thumbnailBase64 = await generateThumbnail(voucherData.frontBase64);

    // Create initial version from the voucher data
    const initialVersion: VoucherVersion = {
      timestamp: Date.now(),
      prompt: '', // Empty prompt for initial generation
      originalBase64: voucherData.originalBase64,
      frontBase64: voucherData.frontBase64,
      backBase64: voucherData.backBase64,
    };

    const voucher: SavedVoucher = {
      ...voucherData,
      id,
      createdAt: Date.now(),
      thumbnailBase64,
      versions: [initialVersion],
    };

    await saveVoucher(voucher);
    set((state) => ({
      vouchers: [voucher, ...state.vouchers],
      activeVoucherId: id, // Set as active for potential refinements
    }));

    return id;
  },

  addVersionToVoucher: async (id, versionData) => {
    const vouchers = get().vouchers;
    const voucherIndex = vouchers.findIndex((v) => v.id === id);

    if (voucherIndex === -1) {
      console.error('[VoucherGalleryStore] Voucher not found:', id);
      return;
    }

    const voucher = vouchers[voucherIndex];
    const newVersion: VoucherVersion = {
      ...versionData,
      timestamp: Date.now(),
    };

    // Update voucher with new version and update current images
    const updatedVoucher: SavedVoucher = {
      ...voucher,
      originalBase64: versionData.originalBase64,
      frontBase64: versionData.frontBase64,
      backBase64: versionData.backBase64,
      thumbnailBase64: await generateThumbnail(versionData.frontBase64),
      versions: [...(voucher.versions || []), newVersion],
    };

    await saveVoucher(updatedVoucher);

    set((state) => ({
      vouchers: state.vouchers.map((v) =>
        v.id === id ? updatedVoucher : v
      ),
    }));
  },

  removeVoucher: async (id) => {
    await deleteVoucher(id);
    set((state) => ({
      vouchers: state.vouchers.filter((v) => v.id !== id),
      activeVoucherId: state.activeVoucherId === id ? null : state.activeVoucherId,
    }));
  },

  clearAll: async () => {
    await clearAllVouchers();
    set({ vouchers: [], activeVoucherId: null });
  },

  setActiveVoucherId: (id) => {
    set({ activeVoucherId: id });
  },
}));
