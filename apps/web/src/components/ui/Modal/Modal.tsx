import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import './Modal.css'

interface ModalProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  noPadding?: boolean
  maxWidth?: number
}

export function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  noPadding,
  maxWidth,
}: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal"
        style={maxWidth !== undefined ? { maxWidth } : undefined}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__header-left">
            {icon && <span className="modal__icon">{icon}</span>}
            <div className="modal__title-block">
              <h2 id="modal-title" className="modal__title">{title}</h2>
              {subtitle && <p className="modal__subtitle">{subtitle}</p>}
            </div>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className={`modal__body${noPadding ? ' modal__body--no-padding' : ''}`}>
          {children}
        </div>

        {footer && (
          <div className="modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
