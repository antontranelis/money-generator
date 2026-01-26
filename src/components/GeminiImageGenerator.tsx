import { useState, useCallback, useMemo } from 'react';
import { usePrintGeneratorStore } from '../stores/printGeneratorStore';
import { useGeminiStore } from '../stores/geminiStore';
import { useBillStore } from '../stores/billStore';
import { useVoucherGalleryStore } from '../stores/voucherGalleryStore';
import { generateImageWithGemini, refineImageWithGemini } from '../services/geminiImageGenerator';
import { generatePrintPrompt } from '../services/printPromptGenerator';
import {
  processVoucherImage,
  generateVoucherPdf,
  downloadBlob,
  downloadBase64Image,
  validateVoucherImage,
  type VoucherValidationResult,
} from '../services/voucherImageProcessor';
import type { PrintGeneratorConfig } from '../types/printGenerator';

const labels = {
  de: {
    title: 'Bild generieren',
    apiKeyLabel: 'Google Gemini API Key',
    apiKeyPlaceholder: 'AIza...',
    apiKeyHint: 'Dein API Key wird nur in dieser Browser-Session gespeichert.',
    getApiKey: 'API Key erhalten',
    generate: 'Bild generieren',
    generating: 'Generiere...',
    processing: 'Verarbeite...',
    validating: 'Validiere...',
    download: 'Herunterladen',
    downloadFront: 'Vorderseite',
    downloadBack: 'Rückseite',
    downloadOriginal: 'Original (Trainingsdaten)',
    downloadPdf: 'PDF zum Drucken',
    regenerate: 'Neu generieren',
    reprocess: 'Neu verarbeiten (ohne API)',
    error: 'Fehler',
    success: 'Bild erfolgreich generiert!',
    noApiKey: 'Bitte gib einen API Key ein.',
    modelResponse: 'Antwort vom Modell',
    referenceImage: 'Referenzbild hochladen',
    referenceImageHint: 'Für Portrait-Modus: Lade ein Foto der Person hoch.',
    removeImage: 'Entfernen',
    frontSide: 'Vorderseite',
    backSide: 'Rückseite',
    validationTitle: 'Validierungsergebnis',
    validationPassed: 'Alle Prüfungen bestanden',
    validationFailed: 'Einige Prüfungen fehlgeschlagen',
    checkBlackBackground: 'Schwarzer Hintergrund',
    checkEqualSize: 'Gleiche Größe (Vorder-/Rückseite)',
    checkNoBlackBorders: 'Keine schwarzen Ränder',
    sizeDifference: 'Größendifferenz',
    frontHeight: 'Vorderseite Höhe',
    backHeight: 'Rückseite Höhe',
    refinementTitle: 'Bild anpassen',
    refinementPlaceholder: 'Beschreibe die gewünschte Änderung...',
    refinementSend: 'Änderung anwenden',
    refinementRefining: 'Ändere Bild...',
    refinementHint: 'z.B. "Mache den Hintergrund blauer" oder "Ändere die Schriftfarbe zu Gold"',
  },
  en: {
    title: 'Generate Image',
    apiKeyLabel: 'Google Gemini API Key',
    apiKeyPlaceholder: 'AIza...',
    apiKeyHint: 'Your API key is only stored in this browser session.',
    getApiKey: 'Get API Key',
    generate: 'Generate Image',
    generating: 'Generating...',
    processing: 'Processing...',
    validating: 'Validating...',
    download: 'Download',
    downloadFront: 'Front Side',
    downloadBack: 'Back Side',
    downloadOriginal: 'Original (Training Data)',
    downloadPdf: 'PDF for Printing',
    regenerate: 'Regenerate',
    reprocess: 'Reprocess (no API)',
    error: 'Error',
    success: 'Image generated successfully!',
    noApiKey: 'Please enter an API key.',
    modelResponse: 'Model Response',
    referenceImage: 'Upload Reference Image',
    referenceImageHint: 'For portrait mode: Upload a photo of the person.',
    removeImage: 'Remove',
    frontSide: 'Front Side',
    backSide: 'Back Side',
    validationTitle: 'Validation Result',
    validationPassed: 'All checks passed',
    validationFailed: 'Some checks failed',
    checkBlackBackground: 'Black background',
    checkEqualSize: 'Equal size (front/back)',
    checkNoBlackBorders: 'No black borders',
    sizeDifference: 'Size difference',
    frontHeight: 'Front height',
    backHeight: 'Back height',
    refinementTitle: 'Refine Image',
    refinementPlaceholder: 'Describe the desired change...',
    refinementSend: 'Apply Change',
    refinementRefining: 'Refining image...',
    refinementHint: 'e.g. "Make the background more blue" or "Change the text color to gold"',
  },
};

export function GeminiImageGenerator() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const t = labels[appLanguage];

  // Get persisted state from store (survives view switches)
  const apiKey = useGeminiStore((state) => state.apiKey);
  const setApiKey = useGeminiStore((state) => state.setApiKey);
  const result = useGeminiStore((state) => state.generationResult);
  const setResult = useGeminiStore((state) => state.setGenerationResult);
  const processedImages = useGeminiStore((state) => state.processedImages);
  const setProcessedImages = useGeminiStore((state) => state.setProcessedImages);

  // Gallery store for auto-save
  const addVoucher = useVoucherGalleryStore((state) => state.addVoucher);
  const addVersionToVoucher = useVoucherGalleryStore((state) => state.addVersionToVoucher);
  const activeVoucherId = useVoucherGalleryStore((state) => state.activeVoucherId);

  // Local UI state (doesn't need persistence)
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationResult, setValidationResult] = useState<VoucherValidationResult | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Get config from printGeneratorStore
  const styleContext = usePrintGeneratorStore((state) => state.styleContext);
  const promptLanguage = usePrintGeneratorStore((state) => state.promptLanguage);
  const colorScheme = usePrintGeneratorStore((state) => state.colorScheme);
  const centralMotif = usePrintGeneratorStore((state) => state.centralMotif);
  const mood = usePrintGeneratorStore((state) => state.mood);
  const energy = usePrintGeneratorStore((state) => state.energy);
  const visualStyle = usePrintGeneratorStore((state) => state.visualStyle);
  const sources = usePrintGeneratorStore((state) => state.sources);
  const textStyle = usePrintGeneratorStore((state) => state.textStyle);
  const textClarity = usePrintGeneratorStore((state) => state.textClarity);
  const feelings = usePrintGeneratorStore((state) => state.feelings);
  const industry = usePrintGeneratorStore((state) => state.industry);
  const tone = usePrintGeneratorStore((state) => state.tone);
  const ctaStyle = usePrintGeneratorStore((state) => state.ctaStyle);
  const businessDesignStyle = usePrintGeneratorStore((state) => state.businessDesignStyle);
  const businessValues = usePrintGeneratorStore((state) => state.businessValues);
  const logoImage = usePrintGeneratorStore((state) => state.logoImage);
  const logoColors = usePrintGeneratorStore((state) => state.logoColors);
  const portraitImage = usePrintGeneratorStore((state) => state.portraitImage);
  const valueDisplay = usePrintGeneratorStore((state) => state.valueDisplay);
  const valuePosition = usePrintGeneratorStore((state) => state.valuePosition);
  const customValueText = usePrintGeneratorStore((state) => state.customValueText);
  const voucherValue = usePrintGeneratorStore((state) => state.voucherValue);
  const backSideStyle = usePrintGeneratorStore((state) => state.backSideStyle);
  const backSideText = usePrintGeneratorStore((state) => state.backSideText);
  const personName = usePrintGeneratorStore((state) => state.personName);
  const contactEmail = usePrintGeneratorStore((state) => state.contactEmail);
  const contactPhone = usePrintGeneratorStore((state) => state.contactPhone);
  const contactWebsite = usePrintGeneratorStore((state) => state.contactWebsite);
  const qrCodeEnabled = usePrintGeneratorStore((state) => state.qrCodeEnabled);
  const qrCodeUrl = usePrintGeneratorStore((state) => state.qrCodeUrl);

  const config: PrintGeneratorConfig = useMemo(() => ({
    styleContext,
    promptLanguage,
    colorScheme,
    centralMotif,
    mood,
    energy,
    visualStyle,
    sources,
    textStyle,
    textClarity,
    feelings,
    industry,
    tone,
    ctaStyle,
    businessDesignStyle,
    businessValues,
    logoImage,
    logoColors,
    portraitImage,
    valueDisplay,
    valuePosition,
    customValueText,
    voucherValue,
    backSideStyle,
    backSideText,
    personName,
    contactEmail,
    contactPhone,
    contactWebsite,
    qrCodeEnabled,
    qrCodeUrl,
  }), [
    styleContext, promptLanguage, colorScheme, centralMotif,
    mood, energy, visualStyle, sources, textStyle, textClarity, feelings,
    industry, tone, ctaStyle, businessDesignStyle, businessValues, logoImage, logoColors, portraitImage,
    valueDisplay, valuePosition, customValueText, voucherValue, backSideStyle, backSideText,
    personName, contactEmail, contactPhone, contactWebsite,
    qrCodeEnabled, qrCodeUrl
  ]);

  // Check if portrait mode is selected (any style with portrait motif)
  const isPortraitMode = centralMotif === 'portrait';
  // Check if logo-zentral mode is selected (business style with logo as central element)
  const isLogoCentralMode = styleContext === 'business' && centralMotif === 'logo-zentral';
  // Check if from-logo color scheme is selected (requires logo for color extraction)
  const isFromLogoColorMode = styleContext === 'business' && config.colorScheme === 'from-logo';
  // Logo is required if either logo-zentral motif OR from-logo color scheme
  const isLogoRequired = isLogoCentralMode || isFromLogoColorMode;

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setResult({ success: false, error: t.noApiKey });
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setProcessedImages(null);
    setValidationResult(null);

    // Generate the prompt text for saving
    const generatedPrompt = generatePrintPrompt(config);

    // Use portraitImage from printGeneratorStore for portrait mode
    const portraitImageBase64 = portraitImage
      ? (portraitImage.includes(',') ? portraitImage.split(',')[1] : portraitImage)
      : undefined;

    const generationResult = await generateImageWithGemini({
      apiKey,
      config,
      referenceImage: portraitImageBase64,
      logoImage: logoImage || undefined,
    });

    if (!generationResult.success || !generationResult.imageBase64) {
      // Generation failed, show error and stop
      setResult(generationResult);
      setIsGenerating(false);
      return;
    }

    setResult(generationResult);

    // Validate the generated image
    setIsValidating(true);
    const validation = await validateVoucherImage(generationResult.imageBase64);
    setIsValidating(false);
    setValidationResult(validation);

    setIsGenerating(false);

    // Process the image regardless of validation result
    setIsProcessing(true);
    try {
      const processed = await processVoucherImage({
        imageBase64: generationResult.imageBase64,
        qrCodeUrl: qrCodeEnabled ? qrCodeUrl : undefined,
      });
      setProcessedImages(processed);

      // Auto-save to gallery with complete configuration (excluding binary data)
      const { logoImage: _logo, portraitImage: _portrait, ...configWithoutImages } = config;
      const voucherToSave = {
        originalBase64: generationResult.imageBase64,
        frontBase64: processed.frontBase64,
        backBase64: processed.backBase64,
        styleContext,
        voucherValue: voucherValue || undefined,
        personName: personName || undefined,
        colorScheme: colorScheme || undefined,
        originalPrompt: generatedPrompt,
        refinementHistory: [],
        generationConfig: configWithoutImages,
      };
      console.log('[GeminiImageGenerator] Saving voucher with originalPrompt:', !!voucherToSave.originalPrompt, 'length:', voucherToSave.originalPrompt?.length);
      await addVoucher(voucherToSave);
    } catch (error) {
      console.error('Failed to process voucher image:', error);
    }
    setIsProcessing(false);
  }, [apiKey, config, portraitImage, t.noApiKey, qrCodeEnabled, qrCodeUrl, logoImage, addVoucher, styleContext, voucherValue, personName, colorScheme]);

  const handleDownloadFront = useCallback(() => {
    if (processedImages?.frontBase64) {
      downloadBase64Image(processedImages.frontBase64, `voucher-front-${Date.now()}.png`);
    }
  }, [processedImages]);

  const handleDownloadBack = useCallback(() => {
    if (processedImages?.backBase64) {
      downloadBase64Image(processedImages.backBase64, `voucher-back-${Date.now()}.png`);
    }
  }, [processedImages]);

  const handleDownloadPdf = useCallback(async () => {
    if (processedImages) {
      try {
        const pdfBlob = await generateVoucherPdf(processedImages);
        downloadBlob(pdfBlob, `voucher-${Date.now()}.pdf`);
      } catch (error) {
        console.error('Failed to generate PDF:', error);
      }
    }
  }, [processedImages]);

  const handleDownloadOriginal = useCallback(() => {
    if (result?.imageBase64) {
      downloadBase64Image(result.imageBase64, `voucher-original-${Date.now()}.png`);
    }
  }, [result]);

  // Refine the current image with a modification prompt
  const handleRefine = useCallback(async () => {
    if (!apiKey || !result?.imageBase64 || !refinementPrompt.trim() || !activeVoucherId) return;

    const trimmedPrompt = refinementPrompt.trim();
    setIsRefining(true);
    setValidationResult(null);

    const refinementResult = await refineImageWithGemini({
      apiKey,
      currentImage: result.imageBase64,
      refinementPrompt: trimmedPrompt,
      promptLanguage,
    });

    if (!refinementResult.success || !refinementResult.imageBase64) {
      setResult({ ...result, error: refinementResult.error, modelResponse: refinementResult.modelResponse });
      setIsRefining(false);
      return;
    }

    // Update the result with the new image
    setResult({
      success: true,
      imageBase64: refinementResult.imageBase64,
      mimeType: refinementResult.mimeType,
      modelResponse: refinementResult.modelResponse,
    });

    // Validate the refined image
    setIsValidating(true);
    const validation = await validateVoucherImage(refinementResult.imageBase64);
    setIsValidating(false);
    setValidationResult(validation);

    setIsRefining(false);
    setRefinementPrompt(''); // Clear input after successful refinement

    // Process the refined image
    setIsProcessing(true);
    try {
      const processed = await processVoucherImage({
        imageBase64: refinementResult.imageBase64,
        qrCodeUrl: qrCodeEnabled ? qrCodeUrl : undefined,
      });
      setProcessedImages(processed);

      // Add as new version to existing voucher (instead of creating new gallery entry)
      await addVersionToVoucher(activeVoucherId, {
        prompt: trimmedPrompt,
        originalBase64: refinementResult.imageBase64,
        frontBase64: processed.frontBase64,
        backBase64: processed.backBase64,
      });
    } catch (error) {
      console.error('Failed to process refined voucher image:', error);
    }
    setIsProcessing(false);
  }, [apiKey, result, refinementPrompt, promptLanguage, qrCodeEnabled, qrCodeUrl, addVersionToVoucher, activeVoucherId]);

  // Reprocess the original image without calling Gemini API again
  const handleReprocess = useCallback(async () => {
    if (!result?.imageBase64) return;

    setIsProcessing(true);
    try {
      const processed = await processVoucherImage({
        imageBase64: result.imageBase64,
        qrCodeUrl: qrCodeEnabled ? qrCodeUrl : undefined,
      });
      setProcessedImages(processed);
    } catch (error) {
      console.error('Failed to reprocess voucher image:', error);
    }
    setIsProcessing(false);
  }, [result, qrCodeEnabled, qrCodeUrl]);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-sm">{t.title}</h3>

        {/* API Key Input - shown when no key OR when there's an error (might be invalid key) */}
        {(!apiKey || (result && !result.success)) && (
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">{t.apiKeyLabel}</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="label-text-alt link link-primary"
              >
                {t.getApiKey}
              </a>
            </label>
            <div className="join w-full">
              <input
                type={showApiKey ? 'text' : 'password'}
                className="input input-bordered join-item flex-1"
                placeholder={t.apiKeyPlaceholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                className="btn join-item"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/60">{t.apiKeyHint}</span>
            </label>
          </div>
        )}

        {/* Portrait mode hint - portrait is now uploaded via PrintGenerator */}
        {isPortraitMode && !portraitImage && (
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">{t.referenceImageHint}</span>
          </div>
        )}

        {/* Logo required hint - shown when logo-zentral motif OR from-logo color scheme */}
        {isLogoRequired && !logoImage && (
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">
              {appLanguage === 'de'
                ? (isFromLogoColorMode
                  ? 'Bitte lade ein Firmenlogo hoch – die Farben werden daraus extrahiert.'
                  : 'Bitte lade ein Firmenlogo hoch – es wird als zentrales Element verwendet.')
                : (isFromLogoColorMode
                  ? 'Please upload a company logo – colors will be extracted from it.'
                  : 'Please upload a company logo – it will be used as the central element.')}
            </span>
          </div>
        )}

        {/* Generate Button */}
        <button
          className="btn btn-primary w-full"
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey || (isPortraitMode && !portraitImage) || (isLogoRequired && !logoImage)}
        >
          {isGenerating ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              {isValidating ? t.validating : t.generating}
            </>
          ) : result?.success ? (
            t.regenerate
          ) : (
            t.generate
          )}
        </button>

        {/* Validation Result Display */}
        {validationResult && (
          <div className={`alert ${validationResult.isValid ? 'alert-success' : 'alert-warning'}`}>
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
                {validationResult.isValid ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                <span className="font-semibold">
                  {t.validationTitle}: {validationResult.isValid ? t.validationPassed : t.validationFailed}
                </span>
              </div>
              <div className="text-sm space-y-1 ml-8">
                {/* Black Background Check */}
                <div className="flex items-center gap-2">
                  {validationResult.hasBlackBackground ? (
                    <span className="text-success">✓</span>
                  ) : (
                    <span className="text-error">✗</span>
                  )}
                  <span>{t.checkBlackBackground}</span>
                </div>
                {/* Equal Size Check */}
                <div className="flex items-center gap-2">
                  {validationResult.sidesAreEqualSize ? (
                    <span className="text-success">✓</span>
                  ) : (
                    <span className="text-error">✗</span>
                  )}
                  <span>{t.checkEqualSize}</span>
                  {!validationResult.sidesAreEqualSize && (
                    <span className="opacity-70">
                      ({t.frontHeight}: {validationResult.frontDimensions.height}px, {t.backHeight}: {validationResult.backDimensions.height}px)
                    </span>
                  )}
                </div>
                {/* No Black Borders Check */}
                <div className="flex items-center gap-2">
                  {validationResult.hasNoBlackBorders ? (
                    <span className="text-success">✓</span>
                  ) : (
                    <span className="text-error">✗</span>
                  )}
                  <span>{t.checkNoBlackBorders}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {result && !result.success && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">{t.error}</h3>
              <div className="text-sm">{result.error}</div>
            </div>
          </div>
        )}

        {/* Model Response */}
        {result?.modelResponse && (
          <div className="bg-base-200 rounded-lg p-3">
            <p className="text-xs font-semibold mb-1">{t.modelResponse}:</p>
            <p className="text-sm">{result.modelResponse}</p>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="loading loading-spinner loading-sm"></span>
            <span>{t.processing}</span>
          </div>
        )}

        {/* Generated Images - Split View */}
        {result?.success && processedImages && (
          <div className="space-y-4">
            {/* Front Side */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t.frontSide}</h4>
              <div className="rounded-lg overflow-hidden border border-base-300">
                <img
                  src={`data:image/png;base64,${processedImages.frontBase64}`}
                  alt="Voucher front side"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Back Side */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t.backSide}</h4>
              <div className="rounded-lg overflow-hidden border border-base-300">
                <img
                  src={`data:image/png;base64,${processedImages.backBase64}`}
                  alt="Voucher back side"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={handleDownloadFront}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.downloadFront}
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleDownloadBack}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.downloadBack}
              </button>
            </div>

            <button
              className="btn btn-secondary w-full"
              onClick={handleDownloadPdf}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {t.downloadPdf}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn btn-ghost btn-sm opacity-60"
                onClick={handleDownloadOriginal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.downloadOriginal}
              </button>
              <button
                className="btn btn-ghost btn-sm opacity-60"
                onClick={handleReprocess}
                disabled={isProcessing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t.reprocess}
              </button>
            </div>

            {/* Refinement Chat Section */}
            <div className="divider"></div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {t.refinementTitle}
              </h4>
              <p className="text-xs text-base-content/60">{t.refinementHint}</p>
              <div className="join w-full">
                <textarea
                  className="textarea textarea-bordered join-item flex-1 min-h-[60px]"
                  placeholder={t.refinementPlaceholder}
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  disabled={isRefining}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (refinementPrompt.trim()) {
                        handleRefine();
                      }
                    }
                  }}
                />
              </div>
              <button
                className="btn btn-accent w-full"
                onClick={handleRefine}
                disabled={isRefining || !refinementPrompt.trim()}
              >
                {isRefining ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t.refinementRefining}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t.refinementSend}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
