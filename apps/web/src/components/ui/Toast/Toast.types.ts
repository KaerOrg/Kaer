export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  variant: ToastVariant
  message: string
  /** ms avant fermeture automatique ; null = persistant (dismiss manuel) */
  duration: number | null
}

export interface ToastContextValue {
  toasts: readonly ToastItem[]
  success: (message: string, duration?: number) => void
  error: (message: string) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  dismiss: (id: string) => void
}
