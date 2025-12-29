import { useState, useCallback } from 'react';
import {
  enhancePortrait,
  enhancePortraitFallback,
  hasApiKey,
  setApiKey as saveApiKey,
  type EnhanceStyle,
} from '../services/stabilityAI';

interface UseStabilityAIReturn {
  enhance: (imageDataUrl: string, style?: EnhanceStyle) => Promise<string>;
  isEnhancing: boolean;
  error: string | null;
  hasKey: boolean;
  setApiKey: (key: string) => void;
  clearError: () => void;
}

export function useStabilityAI(): UseStabilityAIReturn {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(hasApiKey());

  const clearError = useCallback(() => setError(null), []);

  const setApiKey = useCallback((key: string) => {
    saveApiKey(key);
    setHasKey(true);
    setError(null);
  }, []);

  const enhance = useCallback(
    async (imageDataUrl: string, style: EnhanceStyle = 'vintage'): Promise<string> => {
      setIsEnhancing(true);
      setError(null);

      try {
        if (hasApiKey()) {
          // Use Stability AI
          const result = await enhancePortrait({
            imageDataUrl,
            style,
            strength: 0.35,
          });
          return result;
        } else {
          // Use fallback canvas filter
          const result = await enhancePortraitFallback(imageDataUrl);
          return result;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Enhancement failed';
        setError(message);

        // On API error, try fallback
        if (message.includes('API') || message.includes('key')) {
          try {
            const fallbackResult = await enhancePortraitFallback(imageDataUrl);
            return fallbackResult;
          } catch {
            throw err;
          }
        }

        throw err;
      } finally {
        setIsEnhancing(false);
      }
    },
    []
  );

  return {
    enhance,
    isEnhancing,
    error,
    hasKey,
    setApiKey,
    clearError,
  };
}
