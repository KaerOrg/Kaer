import { vi, describe, it, expect } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number; month?: string }) =>
      opts?.count != null ? `${key}:${opts.count}` : key,
  }),
}))

// Stub des graphiques (non rendus en jsdom) : expose le nombre de points et les séries.
vi.mock('../../../components/ui/Chart', () => ({
  LineChart: ({ data, series }: { data: unknown[]; series: { key: string }[] }) => (
    <div data-testid="linechart" data-points={Array.isArray(data) ? data.length : 0} data-series={series.map(s => s.key).join(',')} />
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { DefusionDataPanel } from './DefusionDataPanel'
import type { DefusionPoint } from '@services/engagementService'

function pt(over: Partial<DefusionPoint>): DefusionPoint {
  return {
    date: '2026-07-10T10:00:00Z', technique: 'word_repetition',
    discomfort_before: 8, discomfort_after: 5, belief_before: 7, belief_after: 6,
    duration_seconds: 30, word: 'echec', ...over,
  }
}

const POINTS: DefusionPoint[] = [
  pt({ date: '2026-07-10T10:00:00Z', technique: 'word_repetition', word: 'echec' }),
  pt({ date: '2026-07-05T10:00:00Z', technique: 'linguistic_distancing', word: 'nul', duration_seconds: 0 }),
  pt({ date: '2026-06-20T10:00:00Z', technique: 'word_repetition', word: 'seul' }),
  pt({ date: '2026-05-01T10:00:00Z', technique: 'word_repetition', word: 'perdu' }),
]

describe('DefusionDataPanel', () => {
  it('trace deux graphes (inconfort + conviction), séries avant/après', () => {
    render(<DefusionDataPanel points={POINTS} locale="fr" />)
    const charts = screen.getAllByTestId('linechart')
    expect(charts).toHaveLength(2)
    expect(charts[0].getAttribute('data-series')).toBe('before,after')
    expect(charts[0].getAttribute('data-points')).toBe('4')
  })

  it('masque le mot par défaut et le révèle ligne par ligne', () => {
    render(<DefusionDataPanel points={POINTS} locale="fr" />)
    expect(screen.queryByText('echec')).toBeNull()
    const reveals = screen.getAllByText('patient.defusion_reveal_word')
    expect(reveals.length).toBeGreaterThan(0)
    fireEvent.click(reveals[0]) // première ligne = 2026-07-10 (echec)
    expect(screen.getByText('echec')).toBeTruthy()
    // Les autres restent masqués.
    expect(screen.queryByText('seul')).toBeNull()
  })

  it('filtre par technique (répétition de mot) : charts et tableau restreints', () => {
    render(<DefusionDataPanel points={POINTS} locale="fr" />)
    // La 1re occurrence est la chip de filtre (rendue avant le tableau).
    fireEvent.click(screen.getAllByText('modules.cognitive_saturation.technique_word_repetition_name')[0])
    const charts = screen.getAllByTestId('linechart')
    expect(charts[0].getAttribute('data-points')).toBe('3') // exclut la distanciation
  })

  it('pagine par ancienneté : le mois le plus ancien est révélé au clic', () => {
    render(<DefusionDataPanel points={POINTS} locale="fr" />)
    // 3 mois, 2 visibles au départ → mois de mai masqué.
    expect(screen.queryByText('perdu')).toBeNull()
    fireEvent.click(screen.getByText(/patient\.defusion_load_older/))
    // Après révélation, on peut afficher le mot de mai.
    const reveals = screen.getAllByText('patient.defusion_reveal_word')
    fireEvent.click(reveals[reveals.length - 1])
    expect(screen.getByText('perdu')).toBeTruthy()
  })
})
