import React, { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';

interface RangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onChange: (values: [number, number]) => void;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onChange,
  step = 1,
  disabled = false,
  className = "",
}: RangeSliderProps) {
  const handleValueChange = useCallback((values: number[]) => {
    onChange([values[0], values[1]]);
  }, [onChange]);

  return (
    <div className={`w-full ${className}`}>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[minValue, maxValue]}
        onValueChange={handleValueChange}
        disabled={disabled}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-muted-foreground mt-2">
        <span>{minValue}</span>
        <span>{maxValue}</span>
      </div>
    </div>
  );
}