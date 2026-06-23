import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import Toast, { type ToastVariant } from '@ui/Toast'

interface ToastState {
  message: string
  variant: ToastVariant
  visible: boolean
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DURATION_MS = 3000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: '', variant: 'success', visible: false })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, variant, visible: true })
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, DURATION_MS)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={toast.message} variant={toast.variant} visible={toast.visible} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
