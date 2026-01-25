import { useState, useCallback, useMemo } from 'react';
import { useSpiritualPromptStore } from '../stores/spiritualPromptStore';
import { useBillStore } from '../stores/billStore';
import { generateSpiritualPrompt, generateNegativePrompt } from '../services/spiritualPromptGenerator';
import { GeminiImageGenerator } from './GeminiImageGenerator';
import type { SpiritualPromptConfig } from '../types/spiritualPrompt';

const labels = {
  de: {
    title: 'Generierter Prompt',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    negativePrompt: 'Negativer Prompt',
    showNegative: 'Negativen Prompt anzeigen',
    hideNegative: 'Negativen Prompt verbergen',
    portraitHint: 'Füge dem Prompt ein Foto der Person bei, damit das Portrait erstellt werden kann.',
  },
  en: {
    title: 'Generated Prompt',
    copy: 'Copy',
    copied: 'Copied!',
    negativePrompt: 'Negative Prompt',
    showNegative: 'Show negative prompt',
    hideNegative: 'Hide negative prompt',
    portraitHint: 'Attach a photo of the person to the prompt so the portrait can be created.',
  },
};

export function SpiritualPromptPreview() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const t = labels[appLanguage];

  const [copied, setCopied] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [showNegative, setShowNegative] = useState(false);

  // Get individual config values from store to avoid object reference issues
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

  // Memoize the config object
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

  const prompt = generateSpiritualPrompt(config);
  const negativePrompt = generateNegativePrompt(config);

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
      {/* Main Prompt */}
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

          {centralMotif === 'portrait' && (
            <div className="alert alert-info mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{t.portraitHint}</span>
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

      {/* Gemini Image Generator */}
      <GeminiImageGenerator />
    </div>
  );
}
