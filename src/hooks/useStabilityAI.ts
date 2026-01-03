import { useState, useCallback, useEffect } from 'react';
import { applyEngravingEffect } from '../services/imageEffects';
import {
  removeBackground,
  hasApiKey,
  setApiKey as saveApiKey,
} from '../services/stabilityAI';

interface UseStabilityAIReturn {
  enhance: (imageDataUrl: string, intensity?: number) => Promise<string>;
  removeBg: (imageDataUrl: string) => Promise<string>;
  isEnhancing: boolean;
  isRemovingBg: boolean;
  error: string | null;
  hasKey: boolean;
  setApiKey: (key: string) => void;
  clearError: () => void;
}

export function useStabilityAI(): UseStabilityAIReturn {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(() => hasApiKey());

  // Re-check API key availability on mount (handles async env loading)
  useEffect(() => {
    setHasKey(hasApiKey());
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const setApiKey = useCallback((key: string) => {
    saveApiKey(key);
    setHasKey(true);
    setError(null);
  }, []);

  const enhance = useCallback(
    async (imageDataUrl: string, intensity: number = 0.5): Promise<string> => {
      setIsEnhancing(true);
      setError(null);

      try {
        // Always use local engraving effect (preserves transparency, no API cost)
        const result = await applyEngravingEffect(imageDataUrl, intensity);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Enhancement failed';
        setError(message);
        throw err;
      } finally {
        setIsEnhancing(false);
      }
    },
    []
  );

  const removeBg = useCallback(
    async (imageDataUrl: string): Promise<string> => {
      setIsRemovingBg(true);
      setError(null);

      try {
        const result = await removeBackground(imageDataUrl);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Background removal failed';
        setError(message);
        throw err;
      } finally {
        setIsRemovingBg(false);
      }
    },
    []
  );

  return {
    enhance,
    removeBg,
    isEnhancing,
    isRemovingBg,
    error,
    hasKey,
    setApiKey,
    clearError,
  };
}
