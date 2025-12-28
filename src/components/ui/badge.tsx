import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "secondary" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-primary/20 text-primary border border-primary/30",
    secondary: "bg-muted text-muted-foreground border border-border",
    outline: "border border-border text-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

Badge.displayName = "badge";
