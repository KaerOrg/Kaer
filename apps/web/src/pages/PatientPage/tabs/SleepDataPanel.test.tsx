import { vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

// Recharts ne se rend pas en jsdom : on stube la lib tierce (le TrendChart réel monte).
vi.mock('recharts', () => {
  const Stub = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Mark = (testid: string) => () => <div data-testid={testid} />
  return {
    ResponsiveContainer: Stub, LineChart: Stub, Line: Mark('line'),
    XAxis: Mark('xaxis'), YAxis: Mark('yaxis'), CartesianGrid: Mark('grid'),
    Tooltip: Mark('tooltip'), ReferenceLine: Mark('refline'), ReferenceDot: Mark('refdot'),
  }
})

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SleepDataPanel } from './SleepDataPanel'
import type { SleepPoint } from '@services/engagementService'

function makePoint(overrides: Partial<SleepPoint>): SleepPoint {
  return {
    date: '2026-02-01', efficiency: null, total_sleep_min: null, onset_min: 0, waso_min: 0,
    nap_min: 0, quality: null, in_bed_time: null, bedtime: null, wake_time: null,
    out_of_bed_time: null, nightmares: false, ...overrides,
  }
}

const POINTS: SleepPoint[] = [
  makePoint({
    date: '2026-02-01', efficiency: 80, total_sleep_min: 480, onset_min: 10, waso_min: 20,
    nap_min: 15, quality: 4, in_bed_time: '22:30', bedtime: '23:00', wake_time: '07:00', out_of_bed_time: '07:30',
  }),
  makePoint({
    date: '2026-02-02', efficiency: 90, total_sleep_min: 420, onset_min: 30, waso_min: 30,
    nap_min: 0, quality: 3, in_bed_time: '23:00', bedtime: '23:30', wake_time: '06:30', out_of_bed_time: '07:00', nightmares: true,
  }),
]

describe('SleepDataPanel', () => {
  it('bandeau à la une : anneau d’efficacité + durée + endormissement moyens', () => {
    render(<SleepDataPanel points={POINTS} locale="fr" />)
    expect(screen.getByText('85 %')).toBeTruthy() // efficacité moyenne (80+90)/2
    expect(screen.getByText('7h30')).toBeTruthy() // sommeil moyen (480+420)/2 = 450
    expect(screen.getByText('0h20')).toBeTruthy() // latence moyenne
    // WASO moyen relégué en puce compacte
    expect(screen.getByText(/0h25/)).toBeTruthy()
  })

  it('rend une ligne de grille par nuit et marque les cauchemars', () => {
    const { container } = render(<SleepDataPanel points={POINTS} locale="fr" />)
    expect(container.querySelectorAll('.sleep-grid__row')).toHaveLength(2)
    expect(container.querySelectorAll('.sleep-grid__nightmare')).toHaveLength(1)
  })

  it('affiche le sélecteur des 6 métriques et un graphe de tendance', () => {
    render(<SleepDataPanel points={POINTS} locale="fr" />)
    for (const key of [
      'evolution.sleep_metric_efficiency', 'evolution.sleep_metric_duration', 'evolution.sleep_metric_onset',
      'evolution.sleep_metric_waso', 'evolution.sleep_metric_naps', 'evolution.sleep_metric_quality',
    ]) {
      expect(screen.getByRole('button', { name: key })).toBeTruthy()
    }
    expect(screen.getAllByTestId('line')).toHaveLength(1)
  })

  it('sélectionne une autre métrique au clic', () => {
    render(<SleepDataPanel points={POINTS} locale="fr" />)
    // Efficacité active par défaut
    expect(screen.getByRole('button', { name: 'evolution.sleep_metric_efficiency', pressed: true })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'evolution.sleep_metric_onset' }))
    expect(screen.getByRole('button', { name: 'evolution.sleep_metric_onset', pressed: true })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'evolution.sleep_metric_efficiency', pressed: false })).toBeTruthy()
  })

  it('placeholder « - » sur le bandeau quand aucune donnée', () => {
    render(<SleepDataPanel points={[]} locale="fr" />)
    // Anneau (label) + sommeil moyen + endormissement moyen = 3 tirets autonomes
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(3)
  })

  it('superpose la courbe de référence et affiche le delta quand une comparaison est fournie', () => {
    const ref = [makePoint({ date: '2026-01-15', efficiency: 70 })]
    render(<SleepDataPanel points={POINTS} locale="fr" comparison={{ points: ref, label: 'Réf.' }} />)
    // 2 courbes : principale + référence
    expect(screen.getAllByTestId('line')).toHaveLength(2)
    // Delta efficacité moyenne 85 − 70 = +15
    expect(screen.getByText(/Δ \+15 %/)).toBeInTheDocument()
  })
})
