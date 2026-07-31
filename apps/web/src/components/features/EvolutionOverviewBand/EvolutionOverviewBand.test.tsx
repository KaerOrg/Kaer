import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { EvolutionOverviewBand } from './EvolutionOverviewBand'
import type { OverviewCard } from '../../../pages/PatientPage/tabs/overviewMetrics'

const cards: OverviewCard[] = [
  { kind: 'metric', moduleType: 'sleep_diary', labelKey: 'evolution.sleep_section_title', color: '#0EA5E9', metricLabelKey: 'evolution.sleep_avg_efficiency', value: 85, unit: '%', sparkline: [80, 90], domain: [0, 100] },
  { kind: 'empty', moduleType: 'fear_thermometer', labelKey: 'evolution.fear_title', color: '#F59E0B' },
]

describe('EvolutionOverviewBand', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn()
  })

  it('ne rend rien sans carte', () => {
    const { container } = render(<EvolutionOverviewBand cards={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('rend une carte par module et scrolle vers la section au clic', () => {
    const section = document.createElement('div')
    section.id = 'evo-section-sleep_diary'
    document.body.appendChild(section)

    const { container } = render(<EvolutionOverviewBand cards={cards} />)
    // Une carte par module. Les deux flèches du rail sont des boutons elles aussi :
    // on compte donc les cartes, pas tous les boutons de la rangée.
    expect(container.querySelectorAll('.evo-ov-card')).toHaveLength(2)
    fireEvent.click(screen.getByLabelText('evolution.sleep_section_title'))
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))

    document.body.removeChild(section)
  })
})
