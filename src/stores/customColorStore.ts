import { create } from 'zustand';
import type { CustomColorScheme, ColorScheme, ExtendedColorScheme } from '../types/printGenerator';

const DB_NAME = 'custom-colors-db';
const STORE_NAME = 'custom-colors';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;
let saveQueue: Promise<void> = Promise.resolve();

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[CustomColorStore] openDB error:', request.error);
      dbPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      // Handle database close events
      db.onclose = () => {
        console.log('[CustomColorStore] Database connection closed');
        dbPromise = null;
      };
      db.onerror = (event) => {
        console.error('[CustomColorStore] Database error:', event);
      };
      resolve(db);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
}

interface StoredData {
  key: string;
  customSchemes: CustomColorScheme[];
  builtInOverrides: Record<string, string[]>;
}

async function loadFromDB(): Promise<{ customSchemes: CustomColorScheme[]; builtInOverrides: Record<string, string[]> }> {
  try {
    console.log('[CustomColorStore] loadFromDB called');
    const db = await openDB();
    console.log('[CustomColorStore] DB opened for load, objectStoreNames:', [...db.objectStoreNames]);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get('data');

      request.onerror = () => {
        console.error('[CustomColorStore] Load error:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        const data = request.result as StoredData | undefined;
        console.log('[CustomColorStore] Loaded raw data:', data);
        resolve({
          customSchemes: data?.customSchemes ?? [],
          builtInOverrides: data?.builtInOverrides ?? {},
        });
      };
    });
  } catch (e) {
    console.error('[CustomColorStore] Failed to load from DB:', e);
    return { customSchemes: [], builtInOverrides: {} };
  }
}

async function saveToDBInternal(customSchemes: CustomColorScheme[], builtInOverrides: Record<string, string[]>): Promise<void> {
  console.log('[CustomColorStore] saveToDBInternal called with:', { customSchemes, builtInOverrides });
  const db = await openDB();
  console.log('[CustomColorStore] DB opened for save, objectStoreNames:', [...db.objectStoreNames]);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Create a plain object for storage (ensure no non-serializable data)
    const data: StoredData = {
      key: 'data',
      customSchemes: JSON.parse(JSON.stringify(customSchemes)),
      builtInOverrides: JSON.parse(JSON.stringify(builtInOverrides)),
    };
    console.log('[CustomColorStore] Putting data:', data);
    const request = store.put(data);

    tx.onerror = (event) => {
      console.error('[CustomColorStore] Transaction error:', tx.error, event);
      reject(tx.error);
    };

    tx.oncomplete = () => {
      console.log('[CustomColorStore] Transaction complete - data saved to disk');
      resolve();
    };

    tx.onabort = () => {
      console.error('[CustomColorStore] Transaction aborted, reason:', tx.error);
      reject(tx.error || new Error('Transaction aborted'));
    };

    request.onerror = () => {
      console.error('[CustomColorStore] Put error:', request.error);
    };
    request.onsuccess = () => {
      console.log('[CustomColorStore] Put request success, waiting for transaction to complete...');
    };
  });
}

// Queue saves to prevent concurrent transactions
function saveToDB(customSchemes: CustomColorScheme[], builtInOverrides: Record<string, string[]>): Promise<void> {
  saveQueue = saveQueue
    .then(() => saveToDBInternal(customSchemes, builtInOverrides))
    .catch((e) => {
      if (e?.name === 'QuotaExceededError') {
        console.error('[CustomColorStore] Storage quota exceeded. Please clear some saved vouchers to free up space.', e);
      } else {
        console.error('[CustomColorStore] Failed to save to DB:', e);
      }
    });
  return saveQueue;
}

interface CustomColorState {
  /** User-created custom color schemes */
  customSchemes: CustomColorScheme[];
  /** Overrides for built-in schemes (key -> colors) */
  builtInOverrides: Record<string, string[]>;
  /** Whether the store has been initialized from IndexedDB */
  isInitialized: boolean;

  // Actions
  /** Initialize the store by loading from IndexedDB */
  initialize: () => Promise<void>;
  /** Add a new custom color scheme */
  addCustomScheme: (scheme: Omit<CustomColorScheme, 'id' | 'isBuiltIn'>) => ExtendedColorScheme;
  /** Update an existing custom color scheme */
  updateCustomScheme: (id: string, updates: Partial<Omit<CustomColorScheme, 'id' | 'isBuiltIn'>>) => void;
  /** Delete a custom color scheme */
  deleteCustomScheme: (id: string) => void;
  /** Set an override for a built-in scheme */
  setBuiltInOverride: (key: ColorScheme, colors: string[]) => void;
  /** Reset a built-in scheme to its original colors */
  resetBuiltInOverride: (key: ColorScheme) => void;
  /** Get the effective swatches for a given key (considers overrides) */
  getEffectiveSwatches: (key: string, originalSwatches: Record<string, string[]>) => string[];
}

export const useCustomColorStore = create<CustomColorState>((set, get) => ({
  customSchemes: [],
  builtInOverrides: {},
  isInitialized: false,

  initialize: async () => {
    console.log('[CustomColorStore] initialize called, isInitialized:', get().isInitialized);
    if (get().isInitialized) return;

    const { customSchemes, builtInOverrides } = await loadFromDB();
    console.log('[CustomColorStore] Setting state after load:', { customSchemes, builtInOverrides });
    set({ customSchemes, builtInOverrides, isInitialized: true });
  },

  addCustomScheme: (schemeData) => {
    console.log('[CustomColorStore] addCustomScheme called with:', schemeData);
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as `custom-${string}`;
    const newScheme: CustomColorScheme = {
      ...schemeData,
      id,
      isBuiltIn: false,
    };
    console.log('[CustomColorStore] Created new scheme:', newScheme);

    const state = get();
    const newSchemes = [...state.customSchemes, newScheme];
    console.log('[CustomColorStore] New schemes array:', newSchemes);
    set({ customSchemes: newSchemes });
    saveToDB(newSchemes, state.builtInOverrides).then(() => {
      console.log('[CustomColorStore] saveToDB completed');
    }).catch((e) => {
      console.error('[CustomColorStore] saveToDB failed:', e);
    });

    return id;
  },

  updateCustomScheme: (id, updates) => {
    const state = get();
    const newSchemes = state.customSchemes.map((scheme) =>
      scheme.id === id ? { ...scheme, ...updates } : scheme
    );
    set({ customSchemes: newSchemes });
    saveToDB(newSchemes, state.builtInOverrides);
  },

  deleteCustomScheme: (id) => {
    const state = get();
    const newSchemes = state.customSchemes.filter((scheme) => scheme.id !== id);
    set({ customSchemes: newSchemes });
    saveToDB(newSchemes, state.builtInOverrides);
  },

  setBuiltInOverride: (key, colors) => {
    const state = get();
    const newOverrides = { ...state.builtInOverrides, [key]: colors };
    set({ builtInOverrides: newOverrides });
    saveToDB(state.customSchemes, newOverrides);
  },

  resetBuiltInOverride: (key) => {
    const state = get();
    const { [key]: _, ...newOverrides } = state.builtInOverrides;
    set({ builtInOverrides: newOverrides });
    saveToDB(state.customSchemes, newOverrides);
  },

  getEffectiveSwatches: (key, originalSwatches) => {
    const state = get();

    // 1. Check custom schemes
    if (key.startsWith('custom-')) {
      const custom = state.customSchemes.find((s) => s.id === key);
      return custom?.colors ?? [];
    }

    // 2. Check built-in overrides
    if (state.builtInOverrides[key]) {
      return state.builtInOverrides[key];
    }

    // 3. Return original built-in
    return originalSwatches[key] ?? [];
  },
}));
