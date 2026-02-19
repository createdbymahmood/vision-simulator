import {createContext, useContext, useEffect, useMemo, useState} from 'react'

import {cn} from '@/lib/utils'

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastContextValue {
  push: (toast: Omit<ToastData, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((toast) => toast.id !== id))

  const push = (toast: Omit<ToastData, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, {id, duration: 3200, ...toast}])
  }

  useEffect(() => {
    const timers = toasts.map((toast) => {
      const duration = toast.duration ?? 3200
      return setTimeout(() => dismiss(toast.id), duration)
    })
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [toasts])

  const value = useMemo(() => ({push, dismiss}), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className='vs:fixed vs:right-6 vs:top-6 vs:z-50 vs:flex vs:w-80 vs:flex-col vs:gap-3'>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'vs:rounded-xl vs:border vs:border-border vs:bg-card/90 vs:p-3 vs:shadow-2xl vs:backdrop-blur',
              toast.variant === 'destructive' &&
                'vs:border-destructive/70 vs:bg-destructive/10 vs:text-destructive',
              toast.variant === 'success' &&
                'vs:border-primary/50 vs:bg-primary/10',
            )}
          >
            {toast.title ? (
              <p className='vs:text-sm vs:font-semibold'>{toast.title}</p>
            ) : null}
            {toast.description ? (
              <p className='vs:text-sm vs:text-muted-foreground'>
                {toast.description}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
