import { useCallback, useMemo } from 'react'
import { ScrollRail } from '@ui/ScrollRail'
import type { OverviewCard } from '../../../pages/PatientPage/tabs/overviewMetrics'
import { EvolutionOverviewCard } from './EvolutionOverviewCard'
import { useActiveSection } from './useActiveSection'
import './EvolutionOverviewBand.css'

// ─── Bandeau d'aperçu multi-modules, sticky (page Évolution, #159) ───────────
//
// Rangée de mini-cartes (une par module actif ayant des données), barre de
// navigation permanente : au clic, scroll doux (`scrollTo`, jamais `scrollIntoView`)
// vers la section détaillée `#evo-section-<module>`. La carte du module en cours de
// lecture est surlignée (scroll-spy). Débordement = rail à défilement horizontal
// CONTENU (le composant scrolle, jamais la page — règle projet).

const SECTION_PREFIX = 'evo-section-'
const STICKY_OFFSET = 72

export interface EvolutionOverviewBandProps {
  readonly cards: readonly OverviewCard[]
}

export function EvolutionOverviewBand({ cards }: EvolutionOverviewBandProps) {
  const keys = useMemo(() => cards.map(c => c.moduleType), [cards])
  const active = useActiveSection(keys, SECTION_PREFIX)

  const handleNavigate = useCallback((moduleType: string) => {
    const el = document.getElementById(`${SECTION_PREFIX}${moduleType}`)
    if (el == null) return
    const top = el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  if (cards.length === 0) return null

  return (
    <div className="evo-overview">
      {/* Même règle que les vues patient : on avance à la flèche, module par module,
          et aucune carte n'est montrée à moitié. Un dégradé de bord signalait qu'il y
          avait une suite sans donner le moyen d'y aller. */}
      <ScrollRail
        className="evo-overview__scope"
        itemCount={cards.length}
      >
        {cards.map(card => (
          <EvolutionOverviewCard
            key={card.moduleType}
            card={card}
            active={active === card.moduleType}
            onNavigate={handleNavigate}
          />
        ))}
      </ScrollRail>
    </div>
  )
}
