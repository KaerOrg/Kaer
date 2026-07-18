import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MoodFriseLine } from './MoodFriseLine'
import { MOOD_WEB_DIMENSIONS } from './moodDimensions'
import type { TrendPoint } from '@ui/Chart'
import type { DimensionStats } from './moodTrend'

const dim = MOOD_WEB_DIMENSIONS[0] // humeur
const trend: TrendPoint[] = [{ date: '2026-07-01', value: 5 }, { date: '2026-07-03', value: 8 }]
const stats: DimensionStats = { min: 5, max: 8, mean: 6.5, n: 2 }

function renderLine(over: Partial<React.ComponentProps<typeof MoodFriseLine>> = {}) {
  render(
    <MoodFriseLine
      dim={dim}
      trend={trend}
      gaps={undefined}
      lastValue={8}
      stats={stats}
      expanded={false}
      onToggle={vi.fn()}
      markers={[]}
      comparison={undefined}
      compareMode="none"
      onCompareChange={vi.fn()}
      locale="fr"
      {...over}
    />,
  )
}

describe('MoodFriseLine', () => {
  it('replié : libellé + stats (dernière valeur, min/max/moy/N), pas de comparateur', () => {
    const { container } = render(
      <MoodFriseLine
        dim={dim} trend={trend} gaps={undefined} lastValue={8} stats={stats} expanded={false} onToggle={vi.fn()}
        markers={[]} comparison={undefined} compareMode="none" onCompareChange={vi.fn()} locale="fr"
      />,
    )
    expect(screen.getByText('evolution.mood_humeur')).toBeTruthy()
    expect(screen.getByText(/evolution\.mood_stat_min/)).toBeTruthy()
    // Dernière valeur (8) rendue dans la cellule dédiée.
    expect(container.querySelector('.mood-frise__last')?.textContent).toContain('8')
    // Le comparateur n'apparaît qu'en déplié.
    expect(screen.queryByText('evolution.mood_compare_prev')).toBeNull()
  })

  it('clic sur le chevron déclenche onToggle avec la clé de dimension', () => {
    const onToggle = vi.fn()
    renderLine({ onToggle })
    fireEvent.click(screen.getByLabelText('evolution.mood_humeur'))
    expect(onToggle).toHaveBeenCalledWith('humeur')
  })

  it('déplié : affiche le comparateur (Aucune / Mois -1 / Année A-A)', () => {
    renderLine({ expanded: true })
    expect(screen.getByText('evolution.mood_compare_none')).toBeTruthy()
    expect(screen.getByText('evolution.mood_compare_prev')).toBeTruthy()
    expect(screen.getByText('evolution.mood_compare_year')).toBeTruthy()
  })
})
