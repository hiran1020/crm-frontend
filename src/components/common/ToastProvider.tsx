import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ToastVariant = 'success' | 'error' | 'warning'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; text: string; icon: typeof CheckCircle }
> = {
  success: {
    bg: 'bg-emerald-600',
    text: 'text-white',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-600',
    text: 'text-white',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-500',
    text: 'text-white',
    icon: AlertTriangle,
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current, { id, message, variant }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const styles = VARIANT_STYLES[toast.variant]
          const Icon = styles.icon
          return (
            <div
              key={toast.id}
              role="status"
              aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
              className={[
                'flex items-center gap-3 rounded-md px-4 py-3 text-sm shadow-lg',
                styles.bg,
                styles.text,
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="ml-1 rounded p-0.5 opacity-75 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
