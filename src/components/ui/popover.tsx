import type { PropsWithChildren, ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PopoverProps extends PropsWithChildren {
  trigger: ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ trigger, children, align = "start", className, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setUncontrolledOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setUncontrolledOpen(next);
          onOpenChange?.(next);
        }}
        className="w-full"
      >
        {trigger}
      </button>
      {open ? (
        <div
          className={cn(
            "absolute z-40 mt-2 min-w-[200px] rounded-xl border border-border bg-card p-3 shadow-xl",
            align === "start" && "left-0",
            align === "end" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            className
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

Popover.displayName = "popover";
