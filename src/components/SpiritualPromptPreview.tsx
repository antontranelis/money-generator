import { useState, useCallback, useMemo } from 'react';
import { usePrintGeneratorStore } from '../stores/printGeneratorStore';
import { useBillStore } from '../stores/billStore';
import { generatePrintPrompt, generatePrintNegativePrompt } from '../services/printPromptGenerator';
import { GeminiImageGenerator } from './GeminiImageGenerator';
import type { PrintGeneratorConfig } from '../types/printGenerator';

const labels = {
  de: {
    title: 'Generierter Prompt',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    negativePrompt: 'Negativer Prompt',
    showNegative: 'Negativen Prompt anzeigen',
    hideNegative: 'Negativen Prompt verbergen',
    portraitHint: 'Füge dem Prompt ein Foto der Person bei, damit das Portrait erstellt werden kann.',
    logoHint: 'Füge dem Prompt das Firmenlogo bei, damit es im Design integriert werden kann.',
  },
  en: {
    title: 'Generated Prompt',
    copy: 'Copy',
    copied: 'Copied!',
    negativePrompt: 'Negative Prompt',
    showNegative: 'Show negative prompt',
    hideNegative: 'Hide negative prompt',
    portraitHint: 'Attach a photo of the person to the prompt so the portrait can be created.',
    logoHint: 'Attach the company logo to the prompt so it can be integrated into the design.',
  },
};

// Check if prompt card should be shown (via URL parameter ?showPrompt=true)
function shouldShowPromptCard(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('showPrompt') === 'true';
}

export function SpiritualPromptPreview() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const t = labels[appLanguage];

  const [copied, setCopied] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [showNegative, setShowNegative] = useState(false);
  const showPromptCard = useMemo(() => shouldShowPromptCard(), []);

  // Get individual config values from printGeneratorStore
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

  // Memoize the config object
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

  const prompt = generatePrintPrompt(config);
  const negativePrompt = generatePrintNegativePrompt(config);

  // Determine which hint to show
  const showPortraitHint = centralMotif === 'portrait' && !portraitImage;
  const showLogoHint = styleContext === 'business' && centralMotif === 'logo-zentral' && !logoImage;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [prompt]);

  const handleCopyNegative = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(negativePrompt);
      setCopiedNegative(true);
      setTimeout(() => setCopiedNegative(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [negativePrompt]);

  return (
    <div className="space-y-4">
      {/* Main Prompt - only shown with ?showPrompt=true */}
      {showPromptCard && (
        <>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between mb-2">
                <h3 className="card-title text-sm">{t.title}</h3>
                <button
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {t.copied}
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {t.copy}
                    </>
                  )}
                </button>
              </div>

              {showPortraitHint && (
                <div className="alert alert-info mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{t.portraitHint}</span>
                </div>
              )}

              {showLogoHint && (
                <div className="alert alert-info mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{t.logoHint}</span>
                </div>
              )}

              <div className="bg-base-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{prompt}</pre>
              </div>
            </div>
          </div>

          {/* Toggle Negative Prompt */}
          <button
            className="btn btn-ghost btn-sm w-full"
            onClick={() => setShowNegative(!showNegative)}
          >
            {showNegative ? t.hideNegative : t.showNegative}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${showNegative ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Negative Prompt */}
          {showNegative && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="card-title text-sm">{t.negativePrompt}</h3>
                  <button
                    className={`btn btn-sm ${copiedNegative ? 'btn-success' : 'btn-secondary'}`}
                    onClick={handleCopyNegative}
                  >
                    {copiedNegative ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {t.copied}
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        {t.copy}
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-base-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{negativePrompt}</pre>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Gemini Image Generator */}
      <GeminiImageGenerator />
    </div>
  );
}
