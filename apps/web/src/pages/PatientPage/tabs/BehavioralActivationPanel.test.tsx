import { vi, describe, it, expect } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: { count?: number }) => (opts?.count != null ? `${key}:${opts.count}` : key) }),
}))

// Stub du graphique recharts (non rendu en jsdom) : on expose séries et données.
vi.mock('../../../components/ui/Chart', () => ({
  LineChart: ({ series }: { series: { key: string }[] }) => (
    <div data-testid="linechart" data-series={series.length} />
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { BehavioralActivationPanel } from './BehavioralActivationPanel'
import type { ActivityEntryPoint } from '@services/engagementService'

function makeEntry(over: Partial<ActivityEntryPoint>): ActivityEntryPoint {
  return {
    id: 'a1',
    date: '2026-07-01',
    label: 'Marche',
    done: false,
    expected_pleasure: null,
    expected_mastery: null,
    pleasure: null,
    mastery: null,
    planned_time: null,
    domain_id: null,
    notes: null,
    ...over,
  }
}

describe('BehavioralActivationPanel', () => {
  it('affiche la semaine de la saisie la plus récente avec les activités du bon jour', () => {
    const entries = [
      makeEntry({ id: 'a1', date: '2026-07-01', label: 'Marche en forêt', done: true, pleasure: 7, mastery: 5 }),
      makeEntry({ id: 'a2', date: '2026-06-10', label: 'Vieille activité' }),
    ]
    render(<BehavioralActivationPanel entries={entries} locale="fr" />)

    // Semaine du 29 juin au 5 juillet : l'activité du 1er juillet est visible,
    // celle du 10 juin non.
    expect(screen.getByText('Marche en forêt')).toBeInTheDocument()
    expect(screen.queryByText('Vieille activité')).not.toBeInTheDocument()
  })

  it('affiche les compteurs bruts réalisées/planifiées de la semaine', () => {
    const entries = [
      makeEntry({ id: 'a1', date: '2026-07-01', done: true, pleasure: 7 }),
      makeEntry({ id: 'a2', date: '2026-07-02', done: false, expected_pleasure: 4 }),
      makeEntry({ id: 'a3', date: '2026-07-03', done: false }),
    ]
    render(<BehavioralActivationPanel entries={entries} locale="fr" />)

    expect(screen.getByText(/evolution\.ba_done_count:1/)).toBeInTheDocument()
    expect(screen.getByText(/evolution\.ba_planned_count:2/)).toBeInTheDocument()
  })

  it('affiche P/M attendus et ressentis bruts, et masque les lignes non renseignées', () => {
    const entries = [
      makeEntry({
        id: 'a1', date: '2026-07-01', label: 'Yoga', done: true,
        expected_pleasure: 4, expected_mastery: 3, pleasure: 7, mastery: 5,
      }),
      makeEntry({ id: 'a2', date: '2026-07-02', label: 'Appel', done: false }),
    ]
    render(<BehavioralActivationPanel entries={entries} locale="fr" />)

    // Yoga : les deux lignes attendu + ressenti
    expect(screen.getByText(/evolution\.ba_pleasure_short 4 · evolution\.ba_mastery_short 3/)).toBeInTheDocument()
    expect(screen.getByText(/evolution\.ba_pleasure_short 7 · evolution\.ba_mastery_short 5/)).toBeInTheDocument()
    // Appel : aucune valeur → aucune ligne de score
    const scoreCaptions = screen.getAllByText('evolution.ba_expected')
    expect(scoreCaptions).toHaveLength(1)
  })

  it('la navigation de semaine change la plage et vide/remplit la grille', () => {
    const entries = [
      makeEntry({ id: 'a1', date: '2026-07-01', label: 'Activité récente' }),
      makeEntry({ id: 'a2', date: '2026-06-24', label: 'Semaine précédente' }),
    ]
    render(<BehavioralActivationPanel entries={entries} locale="fr" />)

    expect(screen.getByText('Activité récente')).toBeInTheDocument()
    expect(screen.queryByText('Semaine précédente')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('evolution.ba_prev_week'))
    expect(screen.getByText('Semaine précédente')).toBeInTheDocument()
    expect(screen.queryByText('Activité récente')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('evolution.ba_next_week'))
    expect(screen.getByText('Activité récente')).toBeInTheDocument()
  })

  it('affiche compteurs globaux et courbe des ressentis (moyennes journalières)', () => {
    const entries = [
      makeEntry({ id: 'a1', date: '2026-07-01', done: true, pleasure: 7, mastery: 5 }),
      makeEntry({ id: 'a2', date: '2026-07-02', done: true, pleasure: 5, mastery: null }),
      makeEntry({ id: 'a3', date: '2026-06-20', done: false }),
      makeEntry({ id: 'a4', date: '2026-08-20', done: false }),
    ]
    render(<BehavioralActivationPanel entries={entries} locale="fr" />)

    // Stats brutes : 2 réalisées, 1 non réalisée (passée), 1 à venir
    expect(screen.getByText('evolution.ba_stat_done').previousSibling?.textContent).toBe('2')
    expect(screen.getByText('evolution.ba_stat_missed').previousSibling?.textContent).toBe('1')
    expect(screen.getByText('evolution.ba_stat_upcoming').previousSibling?.textContent).toBe('1')
    // Courbe à 2 séries (P et A ressentis)
    expect(screen.getByTestId('linechart').getAttribute('data-series')).toBe('2')
  })

  it('sans activité réalisée notée, la courbe est absente', () => {
    const entries = [makeEntry({ id: 'a1', date: '2026-07-01', done: false })]
    render(<BehavioralActivationPanel entries={entries} locale="fr" />)
    expect(screen.queryByTestId('linechart')).toBeNull()
  })

  it('affiche heure prévue et notes brutes quand présentes', () => {
    const entries = [
      makeEntry({ id: 'a1', date: '2026-07-01', label: 'Marche', planned_time: '17:30', notes: 'Avec le chien' }),
    ]
    render(<BehavioralActivationPanel entries={entries} locale="fr" />)

    expect(screen.getByText(/17:30/)).toBeInTheDocument()
    expect(screen.getByText('Avec le chien')).toBeInTheDocument()
  })
})
