import { useCallback, useEffect, type MouseEvent } from 'react'
import './ActionSheet.css'
import type { ActionSheetProps } from './ActionSheet.types'

/**
 * Feuille d'actions (bottom sheet) — pendant web du `ActionSheet` mobile. Liste de
 * choix présentée en bas de l'écran sur un fond assombri, plus un bouton d'annulation.
 * Sélectionner une option ferme la feuille puis exécute son action.
 *
 * Sur desktop, l'équivalent usuel est un menu / popover ; cette feuille existe pour
 * la parité 1-1 avec le mobile et les contextes responsive étroits.
 */
export function ActionSheet({ open, title, options, cancelLabel, onClose }: ActionSheetProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Handler stable : l'index de l'option est lu dans data-index (zéro arrow inline par option).
  const handleOptionClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const idx = Number(e.currentTarget.dataset.index)
      onClose()
      options[idx]?.onClick()
    },
    [onClose, options],
  )

  const stopPropagation = useCallback((e: MouseEvent<HTMLDivElement>) => e.stopPropagation(), [])

  if (!open) return null

  return (
    <div className="action-sheet__overlay" onClick={onClose} role="presentation">
      <div className="action-sheet" role="dialog" aria-modal="true" onClick={stopPropagation}>
        <div className="action-sheet__group">
          {title ? <span className="action-sheet__title">{title}</span> : null}
          {options.map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              className={`action-sheet__option${opt.destructive ? ' action-sheet__option--destructive' : ''}`}
              onClick={handleOptionClick}
              data-index={i}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button type="button" className="action-sheet__cancel" onClick={onClose}>{cancelLabel}</button>
      </div>
    </div>
  )
}
