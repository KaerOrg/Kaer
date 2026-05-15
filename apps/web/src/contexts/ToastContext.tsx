import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import type { ToastContextValue, ToastItem, ToastVariant } from '../components/ui/Toast/Toast.types'

const ToastContext = createContext<ToastContextValue | null>(null)

const SUCCESS_DURATION = 4000
const MAX_TOASTS = 5

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((variant: ToastVariant, message: string, duration: number | null) => {
    const id = `toast-${(++idRef.current).toString()}`
    setToasts(prev => [...prev.slice(-(MAX_TOASTS - 1)), { id, variant, message, duration }])
    if (duration !== null) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const success = useCallback((message: string, duration = SUCCESS_DURATION) => {
    push('success', message, duration)
  }, [push])

  const error = useCallback((message: string) => {
    push('error', message, null)
  }, [push])

  const warning = useCallback((message: string, duration = SUCCESS_DURATION) => {
    push('warning', message, duration)
  }, [push])

  const info = useCallback((message: string, duration = SUCCESS_DURATION) => {
    push('info', message, duration)
  }, [push])

  return (
    <ToastContext.Provider value={{ toasts, success, error, warning, info, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider')
  return ctx
}
