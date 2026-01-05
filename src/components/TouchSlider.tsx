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
 * - Taps on the track work if the user doesn't move (no scroll intent)
 * - Vertical scrolling is preserved when the gesture is predominantly vertical
 * - Horizontal dragging activates the slider
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

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // If we never decided on a direction (minimal movement), treat as tap
    if (touchStartRef.current && !touchStartRef.current.decided) {
      // Use the last known touch position from changedTouches
      const touch = e.changedTouches[0];
      if (touch) {
        const newValue = calculateValue(touch.clientX);
        if (newValue !== value) {
          onChange(newValue);
        }
      }
    }
    touchStartRef.current = null;
    isActiveRef.current = false;
    setIsActive(false);
  }, [calculateValue, onChange, value]);

  // Prevent default touch behavior only when slider is active (horizontal movement)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventTouchMove = (e: TouchEvent) => {
      // Only prevent default when slider is actively being dragged horizontally
      if (isActiveRef.current) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchmove', preventTouchMove);
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

  // Track is full width, thumb slides along it
  // We use clamp to keep thumb fully visible at edges (not cut off)
  // At 0%: thumb left edge at 0, so center at 10px
  // At 100%: thumb right edge at 100%, so center at calc(100% - 10px)
  const thumbPosition = `calc(10px + (100% - 20px) * ${percentage / 100})`;

  return (
    <div
      ref={containerRef}
      className={`relative h-10 flex items-center cursor-pointer overflow-visible ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Track background - full width */}
      <div className="absolute h-2 bg-base-300 rounded-full inset-x-0" />

      {/* Filled track - starts at 0, width matches thumb center position */}
      <div
        className={`absolute h-2 rounded-full transition-colors ${
          className.includes('range-primary') ? 'bg-primary' :
          className.includes('range-secondary') ? 'bg-secondary' :
          'bg-primary'
        }`}
        style={{ left: 0, width: thumbPosition }}
      />

      {/* Thumb - centered at thumbPosition */}
      <div
        className={`absolute w-5 h-5 rounded-full bg-base-100 border-2 shadow-md transition-transform ${
          isActive ? 'scale-110' : ''
        } ${
          className.includes('range-primary') ? 'border-primary' :
          className.includes('range-secondary') ? 'border-secondary' :
          'border-primary'
        }`}
        style={{ left: thumbPosition, transform: 'translateX(-50%)' }}
      />
    </div>
  );
}
