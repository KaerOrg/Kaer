import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'
import type { ToastItem, ToastVariant } from './Toast.types'
import './Toast.css'

const ICON: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={16} aria-hidden="true" />,
  error:   <XCircle     size={16} aria-hidden="true" />,
  warning: <AlertTriangle size={16} aria-hidden="true" />,
  info:    <Info        size={16} aria-hidden="true" />,
}

interface ToastProps {
  item: ToastItem
}

export function Toast({ item }: ToastProps) {
  const { dismiss } = useToast()

  return (
    <div
      className={`toast toast--${item.variant}`}
      role={item.variant === 'error' || item.variant === 'warning' ? 'alert' : 'status'}
      aria-live={item.variant === 'error' || item.variant === 'warning' ? 'assertive' : 'polite'}
    >
      <span className="toast__icon">{ICON[item.variant]}</span>
      <span className="toast__message">{item.message}</span>
      <button
        className="toast__close"
        onClick={() => dismiss(item.id)}
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  )
}
