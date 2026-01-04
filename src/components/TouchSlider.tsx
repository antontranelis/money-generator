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
 * A touch-friendly slider that prevents accidental value changes.
 * - Taps on the track are ignored - only dragging changes the value
 * - Vertical scrolling is preserved when the gesture is predominantly vertical
 * - On desktop, normal mouse/keyboard interaction works as expected
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
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; value: number; decided: boolean } | null>(null);
  const isActiveRef = useRef(false);
  const [isActive, setIsActive] = useState(false);

  // Calculate percentage for visual display
  const percentage = ((value - min) / (max - min)) * 100;

  const calculateValue = useCallback((clientX: number) => {
    if (!containerRef.current) return value;

    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const range = max - min;
    const rawValue = min + pct * range;
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  }, [min, max, step, value]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      value: value,
      decided: false,
    };
    isActiveRef.current = false;
  }, [value, disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Haven't decided direction yet
    if (!touchStartRef.current.decided) {
      // Need at least some movement to decide
      if (deltaX < 8 && deltaY < 8) return;

      touchStartRef.current.decided = true;

      // If vertical movement is dominant, allow scrolling and abort
      if (deltaY > deltaX) {
        touchStartRef.current = null;
        return;
      }

      // Horizontal movement is dominant - activate slider
      isActiveRef.current = true;
      setIsActive(true);
    }

    // If slider is active, update value
    if (isActiveRef.current) {
      const newValue = calculateValue(touch.clientX);
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  }, [disabled, calculateValue, onChange, value]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    isActiveRef.current = false;
    setIsActive(false);
  }, []);

  // Prevent default touch behavior to stop native slider from jumping on tap
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventTouchDefault = (e: TouchEvent) => {
      // Always prevent default to stop the native range input from handling touches
      e.preventDefault();
    };

    container.addEventListener('touchstart', preventTouchDefault, { passive: false });
    container.addEventListener('touchmove', preventTouchDefault, { passive: false });

    return () => {
      container.removeEventListener('touchstart', preventTouchDefault);
      container.removeEventListener('touchmove', preventTouchDefault);
    };
  }, []);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    // For mouse, we allow direct clicking
    const newValue = calculateValue(e.clientX);
    onChange(newValue);
    setIsActive(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newVal = calculateValue(moveEvent.clientX);
      onChange(newVal);
    };

    const handleMouseUp = () => {
      setIsActive(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, calculateValue, onChange]);

  return (
    <div
      ref={containerRef}
      className={`relative h-6 flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Track background */}
      <div className="absolute inset-x-0 h-2 bg-base-300 rounded-full" />

      {/* Filled track */}
      <div
        className={`absolute left-0 h-2 rounded-full transition-colors ${
          className.includes('range-primary') ? 'bg-primary' :
          className.includes('range-secondary') ? 'bg-secondary' :
          'bg-primary'
        }`}
        style={{ width: `${percentage}%` }}
      />

      {/* Thumb */}
      <div
        className={`absolute w-5 h-5 rounded-full bg-base-100 border-2 shadow-md transform -translate-x-1/2 transition-transform ${
          isActive ? 'scale-125' : ''
        } ${
          className.includes('range-primary') ? 'border-primary' :
          className.includes('range-secondary') ? 'border-secondary' :
          'border-primary'
        }`}
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
}
