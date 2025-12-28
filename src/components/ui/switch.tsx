import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export function Switch({ className, label, checked, onChange, ...props }: SwitchProps) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border border-border bg-muted/70 transition",
          checked ? "bg-primary/20" : "bg-muted"
        )}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={onChange}
          {...props}
        />
        <span
          className={cn(
            "absolute left-1 h-4 w-4 rounded-full bg-card shadow-sm transition peer-checked:translate-x-5 peer-checked:bg-primary"
          )}
        />
      </span>
    </label>
  );
}

Switch.displayName = "switch";
