import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card/90 shadow-[0_15px_60px_-35px_rgba(0,0,0,0.45)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

Card.displayName = "card";
