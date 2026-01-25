import { useState, useCallback, useMemo } from 'react';
import { useSpiritualPromptStore } from '../stores/spiritualPromptStore';
import { useGeminiStore } from '../stores/geminiStore';
import { useBillStore } from '../stores/billStore';
import { generateImageWithGemini, type GeminiGenerationResult } from '../services/geminiImageGenerator';
import type { SpiritualPromptConfig } from '../types/spiritualPrompt';

const labels = {
  de: {
    title: 'Bild generieren',
    apiKeyLabel: 'Google Gemini API Key',
    apiKeyPlaceholder: 'AIza...',
    apiKeyHint: 'Dein API Key wird nur in dieser Browser-Session gespeichert.',
    getApiKey: 'API Key erhalten',
    generate: 'Bild generieren',
    generating: 'Generiere...',
    download: 'Herunterladen',
    regenerate: 'Neu generieren',
    error: 'Fehler',
    success: 'Bild erfolgreich generiert!',
    noApiKey: 'Bitte gib einen API Key ein.',
    modelResponse: 'Antwort vom Modell',
    referenceImage: 'Referenzbild hochladen',
    referenceImageHint: 'Für Portrait-Modus: Lade ein Foto der Person hoch.',
    removeImage: 'Entfernen',
  },
  en: {
    title: 'Generate Image',
    apiKeyLabel: 'Google Gemini API Key',
    apiKeyPlaceholder: 'AIza...',
    apiKeyHint: 'Your API key is only stored in this browser session.',
    getApiKey: 'Get API Key',
    generate: 'Generate Image',
    generating: 'Generating...',
    download: 'Download',
    regenerate: 'Regenerate',
    error: 'Error',
    success: 'Image generated successfully!',
    noApiKey: 'Please enter an API key.',
    modelResponse: 'Model Response',
    referenceImage: 'Upload Reference Image',
    referenceImageHint: 'For portrait mode: Upload a photo of the person.',
    removeImage: 'Remove',
  },
};

export function GeminiImageGenerator() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const t = labels[appLanguage];

  const apiKey = useGeminiStore((state) => state.apiKey);
  const setApiKey = useGeminiStore((state) => state.setApiKey);

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeminiGenerationResult | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Get config from store
  const mood = useSpiritualPromptStore((state) => state.mood);
  const energy = useSpiritualPromptStore((state) => state.energy);
  const style = useSpiritualPromptStore((state) => state.style);
  const sources = useSpiritualPromptStore((state) => state.sources);
  const valueDisplay = useSpiritualPromptStore((state) => state.valueDisplay);
  const valuePosition = useSpiritualPromptStore((state) => state.valuePosition);
  const customValueText = useSpiritualPromptStore((state) => state.customValueText);
  const centralMotif = useSpiritualPromptStore((state) => state.centralMotif);
  const textStyle = useSpiritualPromptStore((state) => state.textStyle);
  const textClarity = useSpiritualPromptStore((state) => state.textClarity);
  const backSideStyle = useSpiritualPromptStore((state) => state.backSideStyle);
  const feelings = useSpiritualPromptStore((state) => state.feelings);
  const personName = useSpiritualPromptStore((state) => state.personName);
  const voucherValue = useSpiritualPromptStore((state) => state.voucherValue);
  const promptLanguage = useSpiritualPromptStore((state) => state.promptLanguage);
  const photoAttachment = useSpiritualPromptStore((state) => state.photoAttachment);
  const colorScheme = useSpiritualPromptStore((state) => state.colorScheme);
  const contactEmail = useSpiritualPromptStore((state) => state.contactEmail);
  const contactPhone = useSpiritualPromptStore((state) => state.contactPhone);
  const contactWebsite = useSpiritualPromptStore((state) => state.contactWebsite);
  const contactSocial = useSpiritualPromptStore((state) => state.contactSocial);

  const config: SpiritualPromptConfig = useMemo(() => ({
    mood,
    energy,
    style,
    sources,
    valueDisplay,
    valuePosition,
    customValueText,
    centralMotif,
    textStyle,
    textClarity,
    backSideStyle,
    feelings,
    personName,
    voucherValue,
    promptLanguage,
    photoAttachment,
    colorScheme,
    contactEmail,
    contactPhone,
    contactWebsite,
    contactSocial,
  }), [mood, energy, style, sources, valueDisplay, valuePosition, customValueText, centralMotif, textStyle, textClarity, backSideStyle, feelings, personName, voucherValue, promptLanguage, photoAttachment, colorScheme, contactEmail, contactPhone, contactWebsite, contactSocial]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setReferenceImage(base64);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setResult({ success: false, error: t.noApiKey });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    const generationResult = await generateImageWithGemini({
      apiKey,
      config,
      referenceImage: referenceImage || undefined,
    });

    setResult(generationResult);
    setIsGenerating(false);
  }, [apiKey, config, referenceImage, t.noApiKey]);

  const handleDownload = useCallback(() => {
    if (result?.imageBase64 && result?.mimeType) {
      const link = document.createElement('a');
      link.href = `data:${result.mimeType};base64,${result.imageBase64}`;
      link.download = `spiritual-voucher-${Date.now()}.png`;
      link.click();
    }
  }, [result]);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-sm">{t.title}</h3>

        {/* API Key Input */}
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

        {/* Reference Image Upload (for portrait mode) */}
        {centralMotif === 'portrait' && (
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">{t.referenceImage}</span>
            </label>
            {referenceImage ? (
              <div className="flex items-center gap-4">
                <img
                  src={`data:image/png;base64,${referenceImage}`}
                  alt="Reference"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  className="btn btn-sm btn-ghost text-error"
                  onClick={() => setReferenceImage(null)}
                >
                  {t.removeImage}
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
                onChange={handleFileUpload}
              />
            )}
            <label className="label">
              <span className="label-text-alt text-base-content/60">{t.referenceImageHint}</span>
            </label>
          </div>
        )}

        {/* Generate Button */}
        <button
          className="btn btn-primary w-full"
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey || (centralMotif === 'portrait' && !referenceImage)}
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

        {/* Generated Image */}
        {result?.success && result.imageBase64 && (
          <div className="space-y-3">
            <div className="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t.success}</span>
            </div>

            <div className="rounded-lg overflow-hidden border border-base-300">
              <img
                src={`data:${result.mimeType};base64,${result.imageBase64}`}
                alt="Generated spiritual voucher"
                className="w-full h-auto"
              />
            </div>

            <button
              className="btn btn-secondary w-full"
              onClick={handleDownload}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t.download}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
