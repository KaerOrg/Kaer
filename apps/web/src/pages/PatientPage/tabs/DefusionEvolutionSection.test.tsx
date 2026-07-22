import { vi, describe, it, expect } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => (opts?.count != null ? `${key}:${opts.count}` : key),
  }),
}))

vi.mock('../../../components/ui/Chart', () => ({
  LineChart: ({ data, series }: { data: unknown[]; series: { key: string }[] }) => (
    <div data-testid="linechart" data-points={Array.isArray(data) ? data.length : 0} data-series={series.map(s => s.key).join(',')} />
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { DefusionEvolutionSection } from './DefusionEvolutionSection'
import type { DefusionPoint } from '@services/engagementService'

function pt(over: Partial<DefusionPoint>): DefusionPoint {
  return {
    date: new Date().toISOString(), technique: 'word_repetition',
    discomfort_before: 8, discomfort_after: 5, belief_before: 7, belief_after: 6,
    duration_seconds: 30, word: 'x', ...over,
  }
}

const POINTS: DefusionPoint[] = [
  pt({ technique: 'word_repetition' }), pt({ technique: 'word_repetition' }),
  pt({ technique: 'linguistic_distancing' }), pt({ technique: 'linguistic_distancing' }),
]

const baseProps = {
  points: POINTS, days: 365, locale: 'fr',
  expanded: true, onToggle: () => {}, onViewData: () => {}, viewDataLabel: 'evolution.view_data',
}

describe('DefusionEvolutionSection', () => {
  it('rend deux sous-graphes séparés (inconfort + conviction), séries avant/après', () => {
    render(<DefusionEvolutionSection {...baseProps} />)
    const charts = screen.getAllByTestId('linechart')
    expect(charts).toHaveLength(2)
    expect(charts[0].getAttribute('data-series')).toBe('before,after')
    expect(charts[0].getAttribute('data-points')).toBe('4')
  })

  it('le filtre par technique restreint les deux graphes', () => {
    render(<DefusionEvolutionSection {...baseProps} />)
    fireEvent.click(screen.getByText('modules.cognitive_saturation.technique_linguistic_distancing_name'))
    const charts = screen.getAllByTestId('linechart')
    expect(charts[0].getAttribute('data-points')).toBe('2')
    expect(charts[1].getAttribute('data-points')).toBe('2')
  })

  it('ne rend pas le contenu quand la section est repliée', () => {
    render(<DefusionEvolutionSection {...baseProps} expanded={false} />)
    expect(screen.queryAllByTestId('linechart')).toHaveLength(0)
  })
})
