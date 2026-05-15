import { createContext, useContext } from 'react'
import type { ToastContextValue } from '../components/ui/Toast/Toast.types'

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider')
  return ctx
}
