const STABILITY_API_URL = 'https://api.stability.ai/v1/generation';
const STABILITY_REMOVE_BG_URL = 'https://api.stability.ai/v2beta/stable-image/edit/remove-background';

const STORAGE_KEY_STABILITY = 'stability_api_key';

export type EnhanceStyle = 'vintage' | 'engraved' | 'currency';

interface EnhanceOptions {
  imageDataUrl: string;
  style: EnhanceStyle;
  strength?: number;
}

interface StabilityResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

const STYLE_PROMPTS: Record<EnhanceStyle, string> = {
  vintage:
    'portrait in the style of vintage currency engraving, fine line work, crosshatching, sepia tones, detailed stippling, classic bank note portrait style',
  engraved:
    'portrait as detailed intaglio engraving, currency bill style, fine parallel lines, high contrast, official government portrait',
  currency:
    'portrait rendered as US dollar bill engraving, official currency portrait style, green tint, fine line engraving technique',
};

// SDXL allowed dimensions
const SDXL_DIMENSIONS = [
  { width: 1024, height: 1024 },
  { width: 1152, height: 896 },
  { width: 1216, height: 832 },
  { width: 1344, height: 768 },
  { width: 1536, height: 640 },
  { width: 640, height: 1536 },
  { width: 768, height: 1344 },
  { width: 832, height: 1216 },
  { width: 896, height: 1152 },
];

function findBestDimensions(width: number, height: number): { width: number; height: number } {
  const aspectRatio = width / height;

  // Find closest matching aspect ratio
  let best = SDXL_DIMENSIONS[0];
  let bestDiff = Infinity;

  for (const dim of SDXL_DIMENSIONS) {
    const dimRatio = dim.width / dim.height;
    const diff = Math.abs(aspectRatio - dimRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = dim;
    }
  }

  return best;
}

function resizeImageToSDXL(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetDim = findBestDimensions(img.width, img.height);

      const canvas = document.createElement('canvas');
      canvas.width = targetDim.width;
      canvas.height = targetDim.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate crop to maintain aspect ratio and center
      const sourceAspect = img.width / img.height;
      const targetAspect = targetDim.width / targetDim.height;

      let sourceX = 0, sourceY = 0, sourceW = img.width, sourceH = img.height;

      if (sourceAspect > targetAspect) {
        // Source is wider - crop sides
        sourceW = img.height * targetAspect;
        sourceX = (img.width - sourceW) / 2;
      } else {
        // Source is taller - crop top/bottom
        sourceH = img.width / targetAspect;
        sourceY = (img.height - sourceH) / 2;
      }

      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, targetDim.width, targetDim.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

export function getApiKey(): string | null {
  // First check environment variable (Vite or Next.js)
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STABILITY_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_STABILITY_API_KEY);
  if (envKey && envKey !== 'your-api-key-here') {
    return envKey;
  }

  // Then check localStorage
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_STABILITY);
  }
  return null;
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY_STABILITY, key);
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

export async function enhancePortrait(options: EnhanceOptions): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No Stability AI API key configured');
  }

  const { imageDataUrl, style, strength = 0.35 } = options;

  // Resize image to SDXL-compatible dimensions
  const resizedDataUrl = await resizeImageToSDXL(imageDataUrl);

  // Convert data URL to blob
  const imageBlob = dataUrlToBlob(resizedDataUrl);

  // Prepare form data
  const formData = new FormData();
  formData.append('init_image', imageBlob, 'portrait.png');
  formData.append('init_image_mode', 'IMAGE_STRENGTH');
  formData.append('image_strength', String(1 - strength));
  formData.append('text_prompts[0][text]', STYLE_PROMPTS[style]);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('cfg_scale', '7');
  formData.append('samples', '1');
  formData.append('steps', '30');

  const engineId = 'stable-diffusion-xl-1024-v1-0';

  const response = await fetch(`${STABILITY_API_URL}/${engineId}/image-to-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Stability AI error:', errorText);

    if (response.status === 401) {
      throw new Error('Invalid API key');
    }
    if (response.status === 402) {
      throw new Error('Insufficient credits');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    throw new Error(`API error: ${response.status}`);
  }

  const data: StabilityResponse = await response.json();

  if (!data.artifacts || data.artifacts.length === 0) {
    throw new Error('No image generated');
  }

  // Return as data URL
  return `data:image/png;base64,${data.artifacts[0].base64}`;
}

// Remove background using Stability AI API
export async function removeBackground(imageDataUrl: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No Stability AI API key configured');
  }

  const imageBlob = dataUrlToBlob(imageDataUrl);

  const formData = new FormData();
  formData.append('image', imageBlob, 'image.png');
  formData.append('output_format', 'png');

  const response = await fetch(STABILITY_REMOVE_BG_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'image/*',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Stability AI remove background error:', errorText);

    if (response.status === 401) {
      throw new Error('Invalid API key');
    }
    if (response.status === 402) {
      throw new Error('Insufficient credits');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    throw new Error(`API error: ${response.status}`);
  }

  // Response is the image blob directly
  const resultBlob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read result'));
    reader.readAsDataURL(resultBlob);
  });
}
