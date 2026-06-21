import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

// Stub des graphiques recharts (non rendus en jsdom).
vi.mock('./ModuleChart', () => ({
  ModuleChart: ({ count }: { count: number }) => <div data-testid="module-chart" data-count={count} />,
}))

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SleepDataPanel } from './SleepDataPanel'
import type { SleepPoint } from '../../../services/engagementService'

function makePoint(overrides: Partial<SleepPoint>): SleepPoint {
  return {
    date: '2026-02-01',
    efficiency: null,
    total_sleep_min: null,
    onset_min: 0,
    waso_min: 0,
    in_bed_time: null,
    bedtime: null,
    wake_time: null,
    out_of_bed_time: null,
    nightmares: false,
    ...overrides,
  }
}

const POINTS: SleepPoint[] = [
  makePoint({
    date: '2026-02-01', efficiency: 80, total_sleep_min: 480, onset_min: 10, waso_min: 20,
    in_bed_time: '22:30', bedtime: '23:00', wake_time: '07:00', out_of_bed_time: '07:30', nightmares: false,
  }),
  makePoint({
    date: '2026-02-02', efficiency: 90, total_sleep_min: 420, onset_min: 30, waso_min: 30,
    in_bed_time: '23:00', bedtime: '23:30', wake_time: '06:30', out_of_bed_time: '07:00', nightmares: true,
  }),
]

describe('SleepDataPanel', () => {
  it('affiche les moyennes calculées et le nombre de nuits', () => {
    render(<SleepDataPanel points={POINTS} locale="fr" />)
    expect(screen.getByText('85 %')).toBeTruthy() // efficacité moyenne (80+90)/2
    expect(screen.getByText('7h30')).toBeTruthy() // sommeil moyen (480+420)/2 = 450
    expect(screen.getByText('0h20')).toBeTruthy() // latence moyenne
    expect(screen.getByText('0h25')).toBeTruthy() // WASO moyen
  })

  it('rend une ligne de grille par nuit et marque les cauchemars', () => {
    const { container } = render(<SleepDataPanel points={POINTS} locale="fr" />)
    expect(container.querySelectorAll('.sleep-grid__row')).toHaveLength(2)
    expect(container.querySelectorAll('.sleep-grid__nightmare')).toHaveLength(1)
  })

  it('rend les deux courbes de tendance', () => {
    render(<SleepDataPanel points={POINTS} locale="fr" />)
    expect(screen.getAllByTestId('module-chart')).toHaveLength(2)
  })

  it('affiche le placeholder « - » quand aucune métrique exploitable', () => {
    render(<SleepDataPanel points={[]} locale="fr" />)
    // 4 moyennes (efficacité, sommeil, latence, WASO) sans donnée → trait d'union
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(4)
  })
})
