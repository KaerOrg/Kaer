import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => (opts?.count != null ? `${key}:${opts.count}` : key),
    i18n: { language: 'fr' },
  }),
}))

// Stub du graphique recharts (non rendu en jsdom). Sa présence servirait à
// détecter qu'une courbe est encore rendue : pour Beck il ne doit plus y en avoir.
vi.mock('../../../components/ui/Chart', () => ({
  LineChart: ({ series }: { series: { key: string }[] }) => (
    <div data-testid="linechart" data-series-keys={series.map(s => s.key).join(',')} />
  ),
}))

// Le panneau détaillé lui-même est couvert par ColumnFormDataPanel.test.tsx :
// ici on vérifie seulement qu'il est monté avec les fiches de l'agrégat.
vi.mock('./ColumnFormDataPanel', () => ({
  ColumnFormDataPanel: ({ moduleType, entries }: { moduleType: string; entries: unknown[] }) => (
    <div data-testid="beck-panel" data-module={moduleType} data-entries={entries.length} />
  ),
}))

const { mockFetchFormEntries, mockFetchPatientModules } = vi.hoisted(() => ({
  mockFetchFormEntries: vi.fn(),
  mockFetchPatientModules: vi.fn(),
}))

// Agrégat d'évolution : tous les autres modules sans donnée, seul Beck en porte.
vi.mock('@services/engagementService', () => ({
  fetchAvailableScales: async () => [],
  fetchScaleEvolution: async () => [],
  fetchMoodEvolution: async () => [],
  fetchFearEvolution: async () => [],
  fetchMedSideEffectsEvolution: async () => ({ effects: [], data: [] }),
  fetchSleepEvolution: async () => [],
  fetchChronoEntries: async () => [],
  fetchActivityEntries: async () => [],
  fetchModuleSummary: async () => ({ lastDate: null, count: 0, lastPayload: null }),
  fetchFormEntries: (...args: unknown[]) => mockFetchFormEntries(...args),
}))

vi.mock('@services/moduleAssignmentService', () => ({
  fetchPatientModules: (...args: unknown[]) => mockFetchPatientModules(...args),
}))

import { render, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PatientEvolutionTab } from './PatientEvolutionTab'

const BECK_ENTRIES = [
  { date: '2026-06-01T10:00:00Z', values: { situation: 'Réunion', emotion_intensity: 80 } },
  { date: '2026-06-03T18:00:00Z', values: { situation: 'Repas', outcome_intensity: 40 } },
]

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderTab() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <PatientEvolutionTab patientId="p1" />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchFormEntries.mockResolvedValue(BECK_ENTRIES)
})

describe('PatientEvolutionTab — section Colonnes de Beck', () => {
  it('module actif : affiche le panneau détaillé (fiches de l’agrégat) et aucune courbe', async () => {
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'beck_columns' }])
    const { getByTestId, getByText, queryByTestId } = renderTab()

    await waitFor(() => expect(getByTestId('beck-panel')).toBeTruthy())
    // Fiches issues de l'agrégat (fetchFormEntries), pas d'un fetch séparé.
    expect(mockFetchFormEntries).toHaveBeenCalledWith('p1', 'beck_columns')
    expect(getByTestId('beck-panel').getAttribute('data-module')).toBe('beck_columns')
    expect(getByTestId('beck-panel').getAttribute('data-entries')).toBe('2')
    // La courbe d'intensité avant/après a été retirée pour Beck.
    expect(queryByTestId('linechart')).toBeNull()
    // Titre de section (clé i18n dédiée, remplace evolution.beck_title).
    expect(getByText('evolution.beck_section_title')).toBeTruthy()
  })

  it('module révoqué : section masquée par défaut, révélée par « Afficher les archivés » avec badge', async () => {
    mockFetchPatientModules.mockResolvedValue([]) // beck_columns plus affecté → archivé
    const { queryByTestId, getByTestId, getByLabelText, getByText } = renderTab()

    // Les données Beck existent (l'empty state ne s'affiche pas) mais la section est masquée.
    await waitFor(() => expect(getByText('evolution.all_archived')).toBeTruthy())
    expect(queryByTestId('beck-panel')).toBeNull()

    // Toggle « Afficher les archivés » → la section apparaît avec son badge.
    fireEvent.click(getByLabelText('evolution.show_archived'))
    await waitFor(() => expect(getByTestId('beck-panel')).toBeTruthy())
    expect(getByText('evolution.archived_badge')).toBeTruthy()
  })
})
