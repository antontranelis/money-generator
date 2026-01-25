import { useState, useCallback, useMemo } from 'react';
import { usePrintGeneratorStore } from '../stores/printGeneratorStore';
import { useGeminiStore } from '../stores/geminiStore';
import { useBillStore } from '../stores/billStore';
import { generateImageWithGemini } from '../services/geminiImageGenerator';
import {
  processVoucherImage,
  generateVoucherPdf,
  downloadBlob,
  downloadBase64Image,
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

  // Local UI state (doesn't need persistence)
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

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
  const businessValues = usePrintGeneratorStore((state) => state.businessValues);
  const logoImage = usePrintGeneratorStore((state) => state.logoImage);
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
    businessValues,
    logoImage,
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
    industry, tone, ctaStyle, businessValues, logoImage, portraitImage,
    valueDisplay, valuePosition, customValueText, voucherValue, backSideStyle, backSideText,
    personName, contactEmail, contactPhone, contactWebsite,
    qrCodeEnabled, qrCodeUrl
  ]);

  // Check if portrait mode is selected (any style with portrait motif)
  const isPortraitMode = centralMotif === 'portrait';
  // Check if logo-zentral mode is selected (business style with logo as central element)
  const isLogoCentralMode = styleContext === 'business' && centralMotif === 'logo-zentral';

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setResult({ success: false, error: t.noApiKey });
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setProcessedImages(null);

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

    setResult(generationResult);
    setIsGenerating(false);

    // Process the image to split front/back and add QR code
    if (generationResult.success && generationResult.imageBase64) {
      setIsProcessing(true);
      try {
        const processed = await processVoucherImage({
          imageBase64: generationResult.imageBase64,
          qrCodeUrl: qrCodeEnabled ? qrCodeUrl : undefined,
        });
        setProcessedImages(processed);
      } catch (error) {
        console.error('Failed to process voucher image:', error);
      }
      setIsProcessing(false);
    }
  }, [apiKey, config, portraitImage, t.noApiKey, qrCodeEnabled, qrCodeUrl, logoImage]);

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

        {/* Logo-zentral mode hint - logo is required when logo is central motif */}
        {isLogoCentralMode && !logoImage && (
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">{appLanguage === 'de' ? 'Bitte lade ein Firmenlogo hoch – es wird als zentrales Element verwendet.' : 'Please upload a company logo – it will be used as the central element.'}</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          className="btn btn-primary w-full"
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey || (isPortraitMode && !portraitImage) || (isLogoCentralMode && !logoImage)}
        >
          {isGenerating ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              {t.generating}
            </>
          ) : result?.success ? (
            t.regenerate
          ) : (
            t.generate
          )}
        </button>

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
          </div>
        )}
      </div>
    </div>
  );
}
