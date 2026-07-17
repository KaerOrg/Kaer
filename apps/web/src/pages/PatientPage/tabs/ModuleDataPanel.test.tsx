import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

// Stub du graphique recharts (non rendu en jsdom) : on expose juste le nb de séries.
vi.mock('../../../components/ui/Chart', () => ({
  LineChart: ({ series }: { series: { key: string }[] }) => (
    <div data-testid="linechart" data-series={series.length} />
  ),
}))

const mockFetchScaleEvolution = vi.fn()
const mockFetchMoodEvolution = vi.fn()
const mockFetchMoodMarkers = vi.fn()
const mockFetchFearEvolution = vi.fn()
const mockFetchMedSideEffectsEvolution = vi.fn()
const mockFetchModuleSummary = vi.fn()
const mockFetchFormEntries = vi.fn()
const mockFetchActivityEntries = vi.fn()

vi.mock('@services/engagementService', () => ({
  fetchScaleEvolution: (...args: unknown[]) => mockFetchScaleEvolution(...args),
  fetchMoodEvolution: (...args: unknown[]) => mockFetchMoodEvolution(...args),
  fetchMoodMarkers: (...args: unknown[]) => mockFetchMoodMarkers(...args),
  fetchFearEvolution: (...args: unknown[]) => mockFetchFearEvolution(...args),
  fetchMedSideEffectsEvolution: (...args: unknown[]) => mockFetchMedSideEffectsEvolution(...args),
  fetchModuleSummary: (...args: unknown[]) => mockFetchModuleSummary(...args),
  fetchFormEntries: (...args: unknown[]) => mockFetchFormEntries(...args),
  fetchActivityEntries: (...args: unknown[]) => mockFetchActivityEntries(...args),
}))

// Routage seul : le panneau column_form est couvert par ColumnFormDataPanel.test.tsx.
vi.mock('./ColumnFormDataPanel', () => ({
  ColumnFormDataPanel: ({ entries }: { entries: unknown[] }) => (
    <div data-testid="column-form-panel" data-entries={entries.length} />
  ),
}))

// Idem : le panneau humeur est couvert par MoodDataPanel.test.tsx.
vi.mock('./MoodDataPanel', () => ({
  MoodDataPanel: ({ points, markers }: { points: unknown[]; markers: unknown[] }) => (
    <div data-testid="mood-panel" data-points={points.length} data-markers={markers.length} />
  ),
}))

import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ModuleDataPanel } from './ModuleDataPanel'

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ModuleDataPanel', () => {
  it('échelle clinique → graphe à 1 série (score total)', async () => {
    mockFetchScaleEvolution.mockResolvedValue([
      { date: '2026-01-01', score: 12 },
      { date: '2026-02-01', score: 8 },
    ])
    const { container, getByTestId } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="phq9" /></QueryClientProvider>)

    await waitFor(() => expect(getByTestId('linechart')).toBeTruthy())
    expect(mockFetchScaleEvolution).toHaveBeenCalledWith('p1', 'phq9')
    expect(getByTestId('linechart').getAttribute('data-series')).toBe('1')
    expect(container.querySelector('.module-data-panel__chart-count')?.textContent).toBe('evolution.n_sessions')
  })

  it('mood_tracker → panneau humeur dédié (points + repères)', async () => {
    mockFetchMoodEvolution.mockResolvedValue([
      { date: '2026-01-01', humeur: 7, energie: 6, anxiete: 4, plaisir: 5, sommeil: 8, alimentation: 6 },
      { date: '2026-02-01', humeur: 6, energie: 5, anxiete: 5, plaisir: 4, sommeil: 7, alimentation: 5 },
    ])
    mockFetchMoodMarkers.mockResolvedValue([{ id: 'm1', date: '2026-01-15', label: 'X', type: 'treatment' }])
    const { getByTestId } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="mood_tracker" /></QueryClientProvider>)

    await waitFor(() => expect(getByTestId('mood-panel')).toBeTruthy())
    expect(mockFetchMoodMarkers).toHaveBeenCalledWith('p1')
    expect(getByTestId('mood-panel').getAttribute('data-points')).toBe('2')
    expect(getByTestId('mood-panel').getAttribute('data-markers')).toBe('1')
  })

  it('effets indésirables → une série par effet', async () => {
    mockFetchMedSideEffectsEvolution.mockResolvedValue({
      effects: ['sedation', 'nausees'],
      data: [
        { date: '2026-01-01', sedation: 3, nausees: 1 },
        { date: '2026-02-01', sedation: 2, nausees: 2 },
      ],
    })
    const { getByTestId } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="medication_side_effects" /></QueryClientProvider>)

    await waitFor(() => expect(getByTestId('linechart')).toBeTruthy())
    expect(getByTestId('linechart').getAttribute('data-series')).toBe('2')
  })

  it('module sans graphe avec données → tableau résumé (ModuleSummaryPanel)', async () => {
    mockFetchModuleSummary.mockResolvedValue({
      lastDate: '2026-03-01',
      count: 3,
      lastPayload: { total_score: 5 },
    })
    const { container } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="crisis_plan" /></QueryClientProvider>)

    await waitFor(() => expect(container.querySelector('.summary-panel')).toBeTruthy())
    expect(mockFetchModuleSummary).toHaveBeenCalledWith('p1', 'crisis_plan')
  })

  it('beck_columns → panneau column_form avec les fiches synchronisées', async () => {
    mockFetchFormEntries.mockResolvedValue([
      { date: '2026-06-01T10:00:00Z', values: { situation: 'Réunion', emotion_intensity: 80 } },
      { date: '2026-06-03T18:00:00Z', values: { situation: 'Repas', outcome_intensity: 40 } },
    ])
    const { getByTestId } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="beck_columns" /></QueryClientProvider>)

    await waitFor(() => expect(getByTestId('column-form-panel')).toBeTruthy())
    expect(mockFetchFormEntries).toHaveBeenCalledWith('p1', 'beck_columns')
    expect(getByTestId('column-form-panel').getAttribute('data-entries')).toBe('2')
  })

  it('aucune donnée → message vide', async () => {
    mockFetchScaleEvolution.mockResolvedValue([])
    const { container } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="gad7" /></QueryClientProvider>)

    await waitFor(() =>
      expect(container.querySelector('.module-data-panel__message')?.textContent).toBe('patient.summary_empty')
    )
  })

  it('behavioral_activation → grille hebdo (BehavioralActivationPanel)', async () => {
    mockFetchActivityEntries.mockResolvedValue([
      {
        id: 'a1', date: '2026-07-01', label: 'Marche en forêt', done: true,
        expected_pleasure: 4, expected_mastery: 3, pleasure: 7, mastery: 5,
        planned_time: null, domain_id: 'al.dom_body', notes: null,
      },
    ])
    const { container, getByText } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="behavioral_activation" /></QueryClientProvider>)

    await waitFor(() => expect(container.querySelector('.ba-week__grid')).toBeTruthy())
    expect(mockFetchActivityEntries).toHaveBeenCalledWith('p1')
    expect(getByText('Marche en forêt')).toBeTruthy()
  })

  it('behavioral_activation sans saisie → message vide', async () => {
    mockFetchActivityEntries.mockResolvedValue([])
    const { container } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="behavioral_activation" /></QueryClientProvider>)

    await waitFor(() =>
      expect(container.querySelector('.module-data-panel__message')?.textContent).toBe('patient.summary_empty')
    )
  })
})
