import { useRef, useCallback, useState, useEffect } from 'react';

interface TouchSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * A touch-friendly slider that prevents accidental value changes while scrolling.
 * Uses a threshold-based approach: only activates slider if horizontal movement
 * exceeds vertical movement significantly.
 */
export function TouchSlider({
  min,
  max,
  step,
  value,
  onChange,
  className = '',
  disabled = false,
}: TouchSliderProps) {
  const sliderRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; value: number } | null>(null);
  const isActiveRef = useRef(false);
  const [isActive, setIsActive] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      value: value,
    };
    isActiveRef.current = false;
  }, [value, disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchStartRef.current || !sliderRef.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // If vertical movement is dominant, allow scrolling
    if (!isActiveRef.current && deltaY > deltaX && deltaY > 10) {
      touchStartRef.current = null;
      return;
    }

    // If horizontal movement is dominant and exceeds threshold, activate slider
    if (!isActiveRef.current && deltaX > deltaY && deltaX > 15) {
      isActiveRef.current = true;
      setIsActive(true);
    }

    // If slider is active, update value and prevent scroll
    if (isActiveRef.current) {
      e.preventDefault();

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      const range = max - min;
      const rawValue = min + percentage * range;
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      onChange(clampedValue);
    }
  }, [disabled, min, max, step, onChange]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    isActiveRef.current = false;
    setIsActive(false);
  }, []);

  // Native change handler for non-touch interactions (mouse, keyboard)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  // Add non-passive touch listener to allow preventDefault
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const touchMoveHandler = (e: TouchEvent) => {
      if (isActiveRef.current) {
        e.preventDefault();
      }
    };

    slider.addEventListener('touchmove', touchMoveHandler, { passive: false });
    return () => {
      slider.removeEventListener('touchmove', touchMoveHandler);
    };
  }, []);

  return (
    <input
      ref={sliderRef}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`${className} ${isActive ? 'scale-y-125' : ''}`}
      disabled={disabled}
      style={{ touchAction: 'pan-y' }}
    />
  );
}
