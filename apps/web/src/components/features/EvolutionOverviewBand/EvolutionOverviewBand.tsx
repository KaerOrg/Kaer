import { useCallback, useMemo } from 'react'
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
    <div className="evo-overview" role="navigation" aria-label="modules">
      <div className="evo-overview__rail">
        {cards.map(card => (
          <EvolutionOverviewCard
            key={card.moduleType}
            card={card}
            active={active === card.moduleType}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </div>
  )
}
