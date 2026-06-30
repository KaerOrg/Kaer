import { ArrowLeft } from 'lucide-react'
import { Button } from '@ui/Button'

interface TreeSelectorHeaderProps {
  showProgress: boolean
  accentColor: string
  breadcrumb: string
  /** Progression 0→1 (largeur de la barre). */
  progress: number
  /** Libellé d'accessibilité du bouton retour (déjà traduit). */
  backLabel: string
  onBack: () => void
}

/** En-tête des modes de saisie : bouton retour + barre de progression teintée. */
export function TreeSelectorHeader({ showProgress, accentColor, breadcrumb, progress, backLabel, onBack }: TreeSelectorHeaderProps) {
  return (
    <div className="ts-head">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="ts-back"
        icon={<ArrowLeft size={20} />}
        aria-label={backLabel}
        onClick={onBack}
      />
      {showProgress && (
        <div className="ts-progress">
          <div className="ts-progress__track">
            <div className="ts-progress__fill" style={{ width: `${progress * 100}%`, background: accentColor }} />
          </div>
          {breadcrumb && <span className="ts-progress__label">{breadcrumb}</span>}
        </div>
      )}
    </div>
  )
}
