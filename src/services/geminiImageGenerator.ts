import type { PrintGeneratorConfig } from '../types/printGenerator';
import { generatePrintPrompt, generatePrintNegativePrompt } from './printPromptGenerator';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

// Available models for image generation
// - gemini-2.5-flash-image: Fast, supports up to 1024px
// - gemini-3-pro-image-preview: Professional quality, supports up to 4K
const MODEL_ID = 'gemini-3-pro-image-preview';

export interface GeminiGenerationResult {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
  modelResponse?: string;
}

export interface GeminiGenerationOptions {
  apiKey: string;
  config: PrintGeneratorConfig;
  referenceImage?: string; // Base64 encoded image for portrait mode
  logoImage?: string; // Base64 encoded logo for business mode
}

/**
 * Generate an image using Google Gemini API
 */
export async function generateImageWithGemini(
  options: GeminiGenerationOptions
): Promise<GeminiGenerationResult> {
  const { apiKey, config, referenceImage, logoImage } = options;

  if (!apiKey) {
    return { success: false, error: 'API Key is required' };
  }

  const prompt = generatePrintPrompt(config);
  const negativePrompt = generatePrintNegativePrompt(config);

  // Add image format instructions at the beginning
  const formatInstructions = config.promptLanguage === 'de'
    ? `BILDFORMAT: Quadratisches Bild (1:1 Seitenverhältnis), höchste verfügbare Auflösung (4K wenn möglich).\n\n`
    : `IMAGE FORMAT: Square image (1:1 aspect ratio), highest available resolution (4K if possible).\n\n`;

  // Combine prompts for better results
  const fullPrompt = `${formatInstructions}${prompt}\n\n${negativePrompt}`;

  try {
    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
      { text: fullPrompt }
    ];

    // Add reference image if provided (for portrait mode)
    if (referenceImage && config.centralMotif === 'portrait') {
      // referenceImage should already be pure base64 (extracted in component)
      parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: referenceImage
        }
      });
    }

    // Add logo image if provided (for business mode - always send if available)
    if (logoImage && config.styleContext === 'business') {
      // logoImage may be a data URL (data:image/...;base64,...) - extract pure base64
      const logoBase64 = logoImage.includes(',') ? logoImage.split(',')[1] : logoImage;
      // Detect mime type from data URL or default to png
      const logoMimeType = logoImage.startsWith('data:')
        ? logoImage.split(';')[0].split(':')[1]
        : 'image/png';
      parts.push({
        inline_data: {
          mime_type: logoMimeType,
          data: logoBase64
        }
      });
    }

    // Note: QR code is no longer sent to Gemini as it cannot reproduce it accurately.
    // Instead, we overlay the QR code onto the generated image afterwards.
    // The prompt instructs Gemini to leave a white area for the QR code.

    const requestBody = {
      contents: [{
        parts
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '4K'
        }
      }
    };

    const response = await fetch(
      `${GEMINI_API_ENDPOINT}/${MODEL_ID}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMessage };
    }

    const data = await response.json();

    // Extract image and text from response
    let imageBase64: string | undefined;
    let mimeType: string | undefined;
    let modelResponse: string | undefined;

    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
        }
        if (part.text) {
          modelResponse = part.text;
        }
      }
    }

    if (!imageBase64) {
      return {
        success: false,
        error: 'No image was generated. The model may have declined due to content policy.',
        modelResponse
      };
    }

    // Note: QR code overlay is now handled by voucherImageProcessor after splitting front/back

    return {
      success: true,
      imageBase64,
      mimeType,
      modelResponse
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if an API key is valid by making a simple request
 */
export async function validateGeminiApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;

  try {
    const response = await fetch(
      `${GEMINI_API_ENDPOINT}/${MODEL_ID}?key=${apiKey}`,
      { method: 'GET' }
    );
    return response.ok;
  } catch {
    return false;
  }
}
