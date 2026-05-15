import { createPortal } from 'react-dom'
import { useToast } from '../../../contexts/ToastContext'
import { Toast } from './Toast'

export function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return createPortal(
    <div className="toast-container" aria-label="Notifications">
      {toasts.map(item => (
        <Toast key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  )
}
