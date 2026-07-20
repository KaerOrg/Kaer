import { memo, useCallback, type ReactNode } from 'react'
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@ui/Button'
import './EvolutionSection.css'

// ─── Section module repliable de la page Évolution clinique (#159) ───────────
//
// En-tête cliquable (contrôle de dévoilement, `aria-expanded`) : icône + titre +
// pastille « n saisies » + rappel de la métrique clé + chevron. Lien explicite
// « Voir les données → » séparé (jamais imbriqué dans le bouton de repli) qui
// ouvre l'onglet Données du module. Plusieurs sections peuvent être ouvertes en
// même temps (pas d'accordéon exclusif) ; l'état de repli est possédé par la page.
// Le corps (graphe/panneau) n'est monté que lorsque la section est dépliée.
// Présentationnel : aucune donnée métier, aucune interprétation (MDR).

export interface EvolutionSectionProps {
  /** Clé stable du module : identité de la section, remontée par les callbacks. */
  readonly sectionKey: string
  /** Ancre de scroll ciblée par le bandeau d'aperçu (id HTML). */
  readonly anchorId?: string
  /** Icône de tête optionnelle (identité du module). */
  readonly icon?: ReactNode
  readonly title: string
  /** Pastille « n saisies ». */
  readonly badge?: string
  /** Rappel court de la métrique clé (ex. dernière valeur). */
  readonly metricReminder?: string
  /** Libellé « archivé » si le module n'est plus affecté au patient. */
  readonly archivedLabel?: string
  readonly expanded: boolean
  readonly onToggle: (sectionKey: string) => void
  /** Libellé du lien « Voir les données → » (absent = pas de lien). */
  readonly viewDataLabel?: string
  /** Ouvre l'onglet Données du module (absent = pas de lien). */
  readonly onViewData?: (sectionKey: string) => void
  readonly children: ReactNode
}

export const EvolutionSection = memo(function EvolutionSection({
  sectionKey, anchorId, icon, title, badge, metricReminder, archivedLabel,
  expanded, onToggle, viewDataLabel, onViewData, children,
}: EvolutionSectionProps) {
  const handleToggle = useCallback(() => onToggle(sectionKey), [onToggle, sectionKey])
  const handleViewData = useCallback(() => onViewData?.(sectionKey), [onViewData, sectionKey])
  const showLink = onViewData != null && viewDataLabel != null

  return (
    <section className="evo-section" id={anchorId}>
      <div className="evo-section__header">
        <Button
          variant="ghost"
          size="sm"
          className="evo-section__toggle"
          aria-expanded={expanded}
          onClick={handleToggle}
          icon={icon}
          iconRight={expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        >
          <span className="evo-section__head">
            <span className="evo-section__title">{title}</span>
            {badge != null ? <span className="evo-section__badge">{badge}</span> : null}
            {metricReminder != null ? <span className="evo-section__metric">{metricReminder}</span> : null}
            {archivedLabel != null ? <span className="evolution__archived-badge">{archivedLabel}</span> : null}
          </span>
        </Button>
        {showLink ? (
          <Button
            variant="ghost"
            size="sm"
            className="evo-section__viewdata"
            onClick={handleViewData}
            iconRight={<ArrowRight size={14} />}
          >
            {viewDataLabel}
          </Button>
        ) : null}
      </div>
      {expanded ? <div className="evo-section__body">{children}</div> : null}
    </section>
  )
})
