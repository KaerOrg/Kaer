import { X } from 'lucide-react'
import './Chip.css'
import type { ChipProps } from './Chip.types'

/**
 * Puce / token du design system : étiquette compacte en forme de pilule.
 * Trois usages couverts par une seule primitive :
 *  - affichage simple (icône + label, coloré par `tone`) ;
 *  - supprimable (`onRemove` → bouton ×), pour les tags éditables ;
 *  - sélectionnable (`selectable` → bouton-bascule), pour les filtres.
 *
 * Pour un indicateur d'état sémantique (label + valeur), préférer `StatusBadge`.
 */
export function Chip({
  label,
  tone = 'neutral',
  size = 'md',
  icon,
  selectable = false,
  selected = false,
  onClick,
  onRemove,
  removeLabel,
  title,
  className = '',
}: ChipProps) {
  const iconNode = icon ? <span className="chip__icon">{icon}</span> : null
  const sizeClass = size === 'sm' ? 'chip--sm' : ''

  if (selectable) {
    return (
      <button
        type="button"
        className={`chip chip--selectable ${sizeClass} ${selected ? 'chip--selected' : ''} ${className}`}
        aria-pressed={selected}
        onClick={onClick}
        title={title}
      >
        {iconNode}
        {label}
      </button>
    )
  }

  return (
    <span
      className={`chip chip--${tone} ${sizeClass} ${onRemove ? 'chip--removable' : ''} ${className}`}
      title={title}
    >
      {iconNode}
      {label}
      {onRemove ? (
        <button type="button" className="chip__remove" onClick={onRemove} aria-label={removeLabel}>
          <X size={12} />
        </button>
      ) : null}
    </span>
  )
}
