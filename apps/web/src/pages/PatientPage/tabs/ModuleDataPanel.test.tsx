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
const mockFetchFearEvolution = vi.fn()
const mockFetchMedSideEffectsEvolution = vi.fn()
const mockFetchModuleSummary = vi.fn()

vi.mock('../../../services/engagementService', () => ({
  fetchScaleEvolution: (...args: unknown[]) => mockFetchScaleEvolution(...args),
  fetchMoodEvolution: (...args: unknown[]) => mockFetchMoodEvolution(...args),
  fetchFearEvolution: (...args: unknown[]) => mockFetchFearEvolution(...args),
  fetchMedSideEffectsEvolution: (...args: unknown[]) => mockFetchMedSideEffectsEvolution(...args),
  fetchModuleSummary: (...args: unknown[]) => mockFetchModuleSummary(...args),
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

  it('mood_tracker → graphe à 6 séries (dimensions)', async () => {
    mockFetchMoodEvolution.mockResolvedValue([
      { date: '2026-01-01', humeur: 7, energie: 6, anxiete: 4, plaisir: 5, sommeil: 8, alimentation: 6 },
      { date: '2026-02-01', humeur: 6, energie: 5, anxiete: 5, plaisir: 4, sommeil: 7, alimentation: 5 },
    ])
    const { getByTestId } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="mood_tracker" /></QueryClientProvider>)

    await waitFor(() => expect(getByTestId('linechart')).toBeTruthy())
    expect(getByTestId('linechart').getAttribute('data-series')).toBe('6')
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
    const { container } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="beck_columns" /></QueryClientProvider>)

    await waitFor(() => expect(container.querySelector('.summary-panel')).toBeTruthy())
    expect(mockFetchModuleSummary).toHaveBeenCalledWith('p1', 'beck_columns')
  })

  it('aucune donnée → message vide', async () => {
    mockFetchScaleEvolution.mockResolvedValue([])
    const { container } = render(<QueryClientProvider client={makeClient()}><ModuleDataPanel patientId="p1" moduleType="gad7" /></QueryClientProvider>)

    await waitFor(() =>
      expect(container.querySelector('.module-data-panel__message')?.textContent).toBe('patient.summary_empty')
    )
  })
})
