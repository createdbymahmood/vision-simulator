import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  className?: string;
}

export function Slider({ value, min = 0, max = 100, step = 1, onValueChange, className }: SliderProps) {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(parseFloat(event.target.value));
  };

  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted outline-none [accent-color:var(--primary)]",
        className
      )}
    />
  );
}

Slider.displayName = "slider";
