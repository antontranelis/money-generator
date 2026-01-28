import type { PrintGeneratorConfig } from '../types/printGenerator';
import { generatePrintPrompt, generatePrintNegativePrompt } from './printPromptGenerator';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

// Available model options for user selection
export const GEMINI_MODEL_OPTIONS = [
  { id: 'gemini-3-pro-2k', label: 'Gemini 3 Pro (2K)', model: 'gemini-3-pro-image-preview', imageSize: '2K' },
  { id: 'gemini-3-pro-4k', label: 'Gemini 3 Pro (4K)', model: 'gemini-3-pro-image-preview', imageSize: '4K' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', model: 'gemini-2.5-flash-image', imageSize: undefined },
] as const;

export type GeminiModelOptionId = typeof GEMINI_MODEL_OPTIONS[number]['id'];

// Default model option
export const DEFAULT_MODEL_OPTION: GeminiModelOptionId = 'gemini-3-pro-2k';

// Get model config from option id
export function getModelConfig(optionId: GeminiModelOptionId) {
  const option = GEMINI_MODEL_OPTIONS.find(o => o.id === optionId) || GEMINI_MODEL_OPTIONS[0];
  return {
    modelId: option.model,
    imageConfig: option.imageSize ? { imageSize: option.imageSize } : {}
  };
}

export interface GeminiGenerationResult {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
  modelResponse?: string;
  usedModel?: string; // Which model was used
  durationMs?: number; // How long the generation took
}

export interface GeminiGenerationOptions {
  apiKey: string;
  config: PrintGeneratorConfig;
  referenceImage?: string; // Base64 encoded image for portrait mode
  logoImage?: string; // Base64 encoded logo for business mode
  motifImages?: string[]; // Additional reference/motif images for design inspiration
  customPrompt?: string; // Optional custom prompt (overrides generated prompt)
  modelOptionId?: GeminiModelOptionId; // Selected model option
}

/**
 * Generate an image using Google Gemini API
 */
export async function generateImageWithGemini(
  options: GeminiGenerationOptions
): Promise<GeminiGenerationResult> {
  const { apiKey, config, referenceImage, logoImage, motifImages, customPrompt, modelOptionId } = options;

  if (!apiKey) {
    return { success: false, error: 'API Key is required' };
  }

  // Get model configuration from selected option
  const { modelId, imageConfig } = getModelConfig(modelOptionId || DEFAULT_MODEL_OPTION);

  // Use custom prompt if provided, otherwise generate from config
  const prompt = customPrompt || generatePrintPrompt(config);
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
    // Include a text label so Gemini knows what the image represents
    if (referenceImage && config.centralMotif === 'portrait') {
      const portraitLabel = config.promptLanguage === 'de'
        ? '\n\n[PORTRAIT-REFERENZBILD] Das folgende Bild zeigt die Person, deren Portrait im Zentrum des Gutscheins erscheinen soll. Verwende dieses Gesicht/diese Person als Vorlage für das zentrale Portrait-Motiv:'
        : '\n\n[PORTRAIT REFERENCE IMAGE] The following image shows the person whose portrait should appear in the center of the voucher. Use this face/person as the template for the central portrait motif:';
      parts.push({ text: portraitLabel });
      parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: referenceImage
        }
      });
    }

    // Add logo image if provided (for business mode - always send if available)
    // Include a text label so Gemini knows what the image represents
    if (logoImage && config.styleContext === 'business') {
      const logoLabel = config.promptLanguage === 'de'
        ? '\n\n[FIRMENLOGO] Das folgende Bild ist das Firmenlogo, das im Gutschein-Design integriert werden soll:'
        : '\n\n[COMPANY LOGO] The following image is the company logo that should be integrated into the voucher design:';
      parts.push({ text: logoLabel });

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

    // Add motif images if provided (additional design inspiration)
    // Include text labels so Gemini knows these are reference/inspiration images
    if (motifImages && motifImages.length > 0) {
      const motifIntroLabel = config.promptLanguage === 'de'
        ? '\n\n[ZUSÄTZLICHE MOTIV-/INSPIRATIONSBILDER] Die folgenden Bilder sind zusätzliche Referenzen und Inspirationsquellen für das Design. Integriere Elemente, Farben oder Stile aus diesen Bildern in das Gutschein-Design:'
        : '\n\n[ADDITIONAL MOTIF/INSPIRATION IMAGES] The following images are additional references and inspiration sources for the design. Integrate elements, colors, or styles from these images into the voucher design:';
      parts.push({ text: motifIntroLabel });

      for (let i = 0; i < motifImages.length; i++) {
        const motifImage = motifImages[i];
        const motifLabel = config.promptLanguage === 'de'
          ? `\n[Motivbild ${i + 1}]:`
          : `\n[Motif image ${i + 1}]:`;
        parts.push({ text: motifLabel });

        // motifImage may be a data URL - extract pure base64
        const motifBase64 = motifImage.includes(',') ? motifImage.split(',')[1] : motifImage;
        // Detect mime type from data URL or default to png
        const motifMimeType = motifImage.startsWith('data:')
          ? motifImage.split(';')[0].split(':')[1]
          : 'image/png';
        parts.push({
          inline_data: {
            mime_type: motifMimeType,
            data: motifBase64
          }
        });
      }
    }

    // Note: QR code is no longer sent to Gemini as it cannot reproduce it accurately.
    // Instead, we overlay the QR code onto the generated image afterwards.
    // The prompt instructs Gemini to leave a white area for the QR code.

    const startTime = performance.now();
    console.log(`[Gemini] Using model: ${modelId} with config:`, imageConfig);

    const requestBody = {
      contents: [{
        parts
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          ...imageConfig
        }
      }
    };

    const response = await fetch(
      `${GEMINI_API_ENDPOINT}/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    const durationMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.log(`[Gemini] Model ${modelId} failed after ${durationMs}ms: ${errorMessage}`);
      return { success: false, error: errorMessage, usedModel: modelId, durationMs };
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
      console.log(`[Gemini] Model ${modelId} returned no image after ${durationMs}ms`);
      return {
        success: false,
        error: 'No image was generated. The model may have declined due to content policy.',
        modelResponse,
        usedModel: modelId,
        durationMs
      };
    }

    console.log(`[Gemini] Success with ${modelId} after ${durationMs}ms`);

    // Note: QR code overlay is now handled by voucherImageProcessor after splitting front/back

    return {
      success: true,
      imageBase64,
      mimeType,
      modelResponse,
      usedModel: modelId,
      durationMs
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

export interface GeminiRefinementOptions {
  apiKey: string;
  currentImage: string; // Base64 encoded current image
  refinementPrompt: string; // User's modification request
  promptLanguage: 'de' | 'en';
  modelOptionId?: GeminiModelOptionId; // Selected model option
}

/**
 * Refine an existing image using Google Gemini API with a modification prompt
 */
export async function refineImageWithGemini(
  options: GeminiRefinementOptions
): Promise<GeminiGenerationResult> {
  const { apiKey, currentImage, refinementPrompt, promptLanguage, modelOptionId } = options;

  if (!apiKey) {
    return { success: false, error: 'API Key is required' };
  }

  if (!currentImage) {
    return { success: false, error: 'Current image is required' };
  }

  if (!refinementPrompt.trim()) {
    return { success: false, error: 'Refinement prompt is required' };
  }

  // Get model configuration from selected option
  const { modelId, imageConfig } = getModelConfig(modelOptionId || DEFAULT_MODEL_OPTION);

  // Build the refinement prompt with context
  const contextPrefix = promptLanguage === 'de'
    ? `Hier ist ein generiertes Gutschein-Bild. Bitte ändere es wie folgt ab und behalte den Rest unverändert bei:\n\n`
    : `Here is a generated voucher image. Please modify it as follows while keeping the rest unchanged:\n\n`;

  const formatReminder = promptLanguage === 'de'
    ? `\n\nWICHTIG: Behalte das quadratische 1:1 Format bei. Das Bild zeigt einen Gutschein mit Vorder- und Rückseite nebeneinander auf schwarzem Hintergrund.`
    : `\n\nIMPORTANT: Keep the square 1:1 format. The image shows a voucher with front and back side arranged side by side on a black background.`;

  const fullPrompt = `${contextPrefix}${refinementPrompt}${formatReminder}`;

  try {
    // Extract pure base64 if it's a data URL
    const imageBase64 = currentImage.includes(',') ? currentImage.split(',')[1] : currentImage;

    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
      { text: fullPrompt },
      {
        inline_data: {
          mime_type: 'image/png',
          data: imageBase64
        }
      }
    ];

    const startTime = performance.now();
    console.log(`[Gemini Refine] Using model: ${modelId} with config:`, imageConfig);

    const requestBody = {
      contents: [{
        parts
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          ...imageConfig
        }
      }
    };

    const response = await fetch(
      `${GEMINI_API_ENDPOINT}/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    const durationMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.log(`[Gemini Refine] Model ${modelId} failed after ${durationMs}ms: ${errorMessage}`);
      return { success: false, error: errorMessage, usedModel: modelId, durationMs };
    }

    const data = await response.json();

    // Extract image and text from response
    let resultImageBase64: string | undefined;
    let mimeType: string | undefined;
    let modelResponse: string | undefined;

    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          resultImageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
        }
        if (part.text) {
          modelResponse = part.text;
        }
      }
    }

    if (!resultImageBase64) {
      console.log(`[Gemini Refine] Model ${modelId} returned no image after ${durationMs}ms`);
      return {
        success: false,
        error: 'No image was generated. The model may have declined due to content policy.',
        modelResponse,
        usedModel: modelId,
        durationMs
      };
    }

    console.log(`[Gemini Refine] Success with ${modelId} after ${durationMs}ms`);

    return {
      success: true,
      imageBase64: resultImageBase64,
      mimeType,
      modelResponse,
      usedModel: modelId,
      durationMs
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

  const { modelId } = getModelConfig(DEFAULT_MODEL_OPTION);

  try {
    const response = await fetch(
      `${GEMINI_API_ENDPOINT}/${modelId}?key=${apiKey}`,
      { method: 'GET' }
    );
    return response.ok;
  } catch {
    return false;
  }
}
