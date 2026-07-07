import type { ReactNode } from 'react'
import { Card } from '@ui/Card'
import './ModuleCard.css'

interface ModuleCardProps {
  /** Icône du module, rendue à gauche du titre. */
  icon?: ReactNode
  /** Libellé du module. */
  title: string
  /** Contrôle rendu à droite du header (toggle d'activation, bouton de vue…). */
  headerRight?: ReactNode
  /** Description courte du module, rendue en tête du body. */
  description?: ReactNode
  /** Rangée de tags (chips indication / public), rendue en footer. */
  tags?: ReactNode
  /** Rangée d'actions collée en bas de carte (aperçu, données, configuration…). */
  actions?: ReactNode
  /** Classes additionnelles (états : désactivé, bientôt, déverrouillé…). */
  className?: string
  /** Contenu additionnel du body sous la description (date, badges, panneaux). */
  children?: ReactNode
}

/**
 * Carte de module — shell présentationnel partagé par le catalogue praticien
 * (écran Modules) et l'armoire thérapeutique (onglet Modules d'un patient). Seule
 * la **source** et les **contrôles** diffèrent (enable/disable vs unlock/revoke) ;
 * la **forme** est identique : icône + titre + contrôle à droite, description en
 * tête de body, chips de tags en footer, rangée d'actions en bas. Assemble le
 * primitive `ui/Card` — ne jamais réécrire ce shell à la main dans une page.
 */
export function ModuleCard({
  icon,
  title,
  headerRight,
  description,
  tags,
  actions,
  className = '',
  children,
}: ModuleCardProps) {
  return (
    <Card
      className={`module-card-item ${className}`.trim()}
      header={{ icon, title, right: headerRight }}
      footer={tags}
      actions={actions}
    >
      {description !== undefined ? <p className="module-card__description">{description}</p> : null}
      {children}
    </Card>
  )
}
