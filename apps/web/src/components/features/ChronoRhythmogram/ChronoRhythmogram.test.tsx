import { vi, describe, it, expect } from 'vitest'
import type { ReactNode } from 'react'

// ResponsiveContainer ne rend rien sans dimensions en jsdom : on le neutralise
// en passe-plat. La logique testée (filtre des repères tracés + légende) vit
// hors du conteneur recharts, donc reste assertable.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="chart-container">{children}</div>
    ),
  }
})

import { render } from '@testing-library/react'
import { ChronoRhythmogram } from './ChronoRhythmogram'
import type { RhythmogramAnchor } from '../../../lib/chronoAnchors'

const ANCHORS: RhythmogramAnchor[] = [
  { key: 'wake_time', color: '#F59E0B', label: 'Lever', sdMinutes: 18, count: 12 },
  { key: 'bedtime', color: '#8B5CF6', label: 'Coucher', sdMinutes: 35, count: 9 },
  // Repère jamais renseigné sur le mois → ne doit pas apparaître.
  { key: 'light', color: '#14B8A6', label: 'Lumière', sdMinutes: 0, count: 0 },
]

const DATA = [
  { day: 1, weekday: 0, wake_time: 420, bedtime: 1380 },
  { day: 2, weekday: 1, wake_time: 405, bedtime: 1410 },
]

function renderChart() {
  return render(
    <ChronoRhythmogram
      data={DATA}
      anchors={ANCHORS}
      yDomain={[360, 1440]}
      weekStarts={[]}
      year={2026}
      month={6}
      locale="fr"
    />,
  )
}

describe('ChronoRhythmogram', () => {
  it('légende : un item par repère renseigné, avec son écart-type brut', () => {
    const { getByText } = renderChart()
    expect(getByText('Lever')).toBeTruthy()
    expect(getByText('±18 min')).toBeTruthy()
    expect(getByText('Coucher')).toBeTruthy()
    expect(getByText('±35 min')).toBeTruthy()
  })

  it('exclut de la légende un repère sans saisie (count 0)', () => {
    const { queryByText } = renderChart()
    expect(queryByText('Lumière')).toBeNull()
  })

  it('rend le conteneur de graphe', () => {
    const { getByTestId } = renderChart()
    expect(getByTestId('chart-container')).toBeTruthy()
  })
})
