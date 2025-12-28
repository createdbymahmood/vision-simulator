import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

interface ToastContextValue {
  push: (toast: Omit<ToastData, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id));

  const push = (toast: Omit<ToastData, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, duration: 3200, ...toast }]);
  };

  useEffect(() => {
    const timers = toasts.map((toast) => {
      const duration = toast.duration ?? 3200;
      return setTimeout(() => dismiss(toast.id), duration);
    });
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts]);

  const value = useMemo(() => ({ push, dismiss }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-6 top-6 z-50 flex w-80 flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-xl border border-border bg-card/90 p-3 shadow-2xl backdrop-blur",
              toast.variant === "destructive" && "border-destructive/70 bg-destructive/10 text-destructive",
              toast.variant === "success" && "border-primary/50 bg-primary/10"
            )}
          >
            {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
            {toast.description ? <p className="text-sm text-muted-foreground">{toast.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
