import { X } from 'lucide-react'
import './Chip.css'
import type { ChipProps } from './Chip.types'

/**
 * Puce / token du design system : étiquette compacte en forme de pilule.
 * Usages couverts par une seule primitive :
 *  - affichage simple (icône + label, coloré par `tone`) ;
 *  - icône seule (`iconOnly` → label en aria-label + tooltip) ;
 *  - supprimable (`onRemove` → bouton ×), pour les tags éditables ;
 *  - sélectionnable (`selectable` → bouton-bascule), pour les filtres ;
 *  - action (`onClick` seul → bouton, ex. « +N »).
 *
 * Pour un indicateur d'état sémantique (label + valeur), préférer `StatusBadge`.
 */
export function Chip({
  label,
  tone = 'neutral',
  size = 'md',
  icon,
  iconOnly = false,
  selectable = false,
  selected = false,
  onClick,
  onRemove,
  removeLabel,
  title,
  accentColor,
  className = '',
}: ChipProps) {
  const iconNode = icon ? <span className="chip__icon">{icon}</span> : null
  const sizeClass = size === 'sm' ? 'chip--sm' : ''

  if (selectable) {
    // Accent piloté par la donnée (ex. couleur de famille d'émotion) pour l'état
    // sélectionné : bordure + texte à l'accent, fond translucide si c'est un hex.
    const accentStyle = selected && accentColor
      ? { borderColor: accentColor, color: accentColor, ...(accentColor.startsWith('#') ? { background: `${accentColor}1A` } : null) }
      : undefined
    return (
      <button
        type="button"
        className={`chip chip--selectable ${sizeClass} ${selected ? 'chip--selected' : ''} ${className}`}
        aria-pressed={selected}
        onClick={onClick}
        title={title}
        style={accentStyle}
      >
        {iconNode}
        {label}
      </button>
    )
  }

  // Puce d'action : conserve l'habillage du `tone` mais déclenche une action au clic
  // (ex. « +N » qui ouvre un panneau). Pas de `aria-pressed` : ce n'est pas une bascule.
  if (onClick && !onRemove) {
    return (
      <button
        type="button"
        className={`chip chip--${tone} ${sizeClass} chip--action ${className}`}
        onClick={onClick}
        title={title}
      >
        {iconNode}
        {label}
      </button>
    )
  }

  // Puce icône seule : le `label` n'est pas rendu visiblement, il sert de nom
  // accessible (`aria-label`) et de tooltip (`title`) — l'icône est obligatoire.
  if (iconOnly) {
    return (
      <span
        className={`chip chip--${tone} ${sizeClass} chip--icon-only ${className}`}
        title={title ?? label}
        aria-label={label}
      >
        {iconNode}
      </span>
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
