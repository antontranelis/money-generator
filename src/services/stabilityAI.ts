const STABILITY_API_URL = 'https://api.stability.ai/v1/generation';

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
    return localStorage.getItem('stability_api_key');
  }
  return null;
}

export function setApiKey(key: string): void {
  localStorage.setItem('stability_api_key', key);
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

  // Convert data URL to blob
  const imageBlob = dataUrlToBlob(imageDataUrl);

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

// Simple fallback enhancement using canvas filters
export async function enhancePortraitFallback(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Apply vintage/sepia filter effect
      ctx.filter = 'sepia(0.3) contrast(1.1) saturate(0.9)';
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}
