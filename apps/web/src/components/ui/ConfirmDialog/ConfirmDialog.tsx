import { useCallback } from 'react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import './ConfirmDialog.css'
import type { ConfirmDialogProps } from './ConfirmDialog.types'

/**
 * Boîte de confirmation modale — pendant web du `ConfirmDialog` mobile. Compose
 * `ui/Modal` (overlay, Échap, focus) + deux `ui/Button` (annuler / confirmer).
 * Remplace `window.confirm` : cohérent avec le design system, stylé, testable.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleConfirm = useCallback(() => { void Promise.resolve(onConfirm()) }, [onConfirm])

  if (!open) return null

  return (
    <Modal
      title={title}
      onClose={onCancel}
      maxWidth={420}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={handleConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      {message ? <p className="confirm-dialog__message">{message}</p> : null}
    </Modal>
  )
}
