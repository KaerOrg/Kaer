import { vi, describe, it, expect } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => (opts?.count != null ? `${key}:${opts.count}` : key),
  }),
}))

// Stub du graphique (non rendu en jsdom). Expose le nombre de points et les clés
// de séries pour vérifier les 3 séries SUDS et le filtre par situation.
vi.mock('../../../components/ui/Chart', () => ({
  LineChart: ({ data, series }: { data: unknown[]; series: { key: string }[] }) => (
    <div
      data-testid="linechart"
      data-points={Array.isArray(data) ? data.length : 0}
      data-series={series.map(s => s.key).join(',')}
    />
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { ExposureDataPanel } from './ExposureDataPanel'
import type { FearPoint } from '@services/engagementService'

// Dates récentes (dans la fenêtre 1 an par défaut).
function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

const POINTS: FearPoint[] = [
  { date: iso(20), suds_before: 70, suds_peak: 80, suds_after: 40, situation: 'Métro' },
  { date: iso(10), suds_before: 60, suds_peak: 70, suds_after: 30, situation: 'Métro' },
  { date: iso(5), suds_before: 50, suds_peak: null, suds_after: 20, situation: 'Réunion' },
]

describe('ExposureDataPanel', () => {
  it('trace trois séries SUDS (anticipé / pic / final) et la mention passive', () => {
    render(<ExposureDataPanel points={POINTS} locale="fr" />)
    const chart = screen.getByTestId('linechart')
    expect(chart.getAttribute('data-series')).toBe('suds_before,suds_peak,suds_after')
    expect(chart.getAttribute('data-points')).toBe('3')
    expect(screen.getByText('patient.exposure_data_note')).toBeTruthy()
    expect(screen.getByText('patient.exposure_data_title')).toBeTruthy()
  })

  it('propose une puce par situation + « Toutes les situations »', () => {
    render(<ExposureDataPanel points={POINTS} locale="fr" />)
    expect(screen.getByText('patient.exposure_all_situations')).toBeTruthy()
    expect(screen.getByText('Métro')).toBeTruthy()
    expect(screen.getByText('Réunion')).toBeTruthy()
  })

  it('filtre les points quand une situation est sélectionnée', () => {
    render(<ExposureDataPanel points={POINTS} locale="fr" />)
    expect(screen.getByTestId('linechart').getAttribute('data-points')).toBe('3')
    fireEvent.click(screen.getByText('Réunion'))
    // Une seule saisie « Réunion » → sous le seuil de 2 points : message dédié.
    expect(screen.queryByTestId('linechart')).toBeNull()
    expect(screen.getByText('evolution.not_enough_data')).toBeTruthy()
    fireEvent.click(screen.getByText('Métro'))
    expect(screen.getByTestId('linechart').getAttribute('data-points')).toBe('2')
  })
})
