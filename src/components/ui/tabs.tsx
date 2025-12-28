import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabOption {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: TabOption[];
}

export function Tabs({ value, onValueChange, tabs }: TabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1 text-sm shadow-inner">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-3 py-2 transition",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon ? <span className="text-lg">{tab.icon}</span> : null}
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className="rounded-full bg-primary/10 px-2 text-[11px] font-medium text-primary">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

Tabs.displayName = "tabs";
