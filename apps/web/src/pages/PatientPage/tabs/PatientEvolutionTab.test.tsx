import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => (opts?.count != null ? `${key}:${opts.count}` : key),
    i18n: { language: 'fr' },
  }),
}))

// Stub de LineChart (non rendu en jsdom) : sa présence détecte qu'une courbe est
// encore rendue (pour Beck il ne doit plus y en avoir). Le reste de ui/Chart reste
// réel (TrendChart / helpers) — le TrendChart de la section sommeil monte pour de vrai.
vi.mock('../../../components/ui/Chart', async (importActual) => {
  const actual = await importActual<typeof import('../../../components/ui/Chart')>()
  return {
    ...actual,
    LineChart: ({ series }: { series: { key: string }[] }) => (
      <div data-testid="linechart" data-series-keys={series.map(s => s.key).join(',')} />
    ),
  }
})

// Le panneau détaillé lui-même est couvert par ColumnFormDataPanel.test.tsx :
// ici on vérifie seulement qu'il est monté avec les fiches de l'agrégat.
// Le bandeau d'aperçu est couvert par EvolutionOverviewBand.test.tsx ; ici on
// teste le routage des sections. Stub pour ne pas dupliquer les libellés de module.
vi.mock('../../../components/features/EvolutionOverviewBand', () => ({
  EvolutionOverviewBand: ({ cards }: { cards: unknown[] }) => (
    <div data-testid="overview-band" data-count={cards.length} />
  ),
}))

vi.mock('./ColumnFormDataPanel', () => ({
  ColumnFormDataPanel: ({ moduleType, entries }: { moduleType: string; entries: unknown[] }) => (
    <div data-testid="beck-panel" data-module={moduleType} data-entries={entries.length} />
  ),
}))

const {
  mockFetchFormEntries, mockFetchPatientModules, mockFetchSleepEvolution,
  mockFetchAvailableScales, mockFetchScaleEvolution, mockFetchMed,
} = vi.hoisted(() => ({
  mockFetchFormEntries: vi.fn(),
  mockFetchPatientModules: vi.fn(),
  mockFetchSleepEvolution: vi.fn(),
  mockFetchAvailableScales: vi.fn(),
  mockFetchScaleEvolution: vi.fn(),
  mockFetchMed: vi.fn(),
}))

// Agrégat d'évolution : les modules non pilotés par un mock restent sans donnée.
vi.mock('@services/engagementService', () => ({
  fetchAvailableScales: (...args: unknown[]) => mockFetchAvailableScales(...args),
  fetchScaleEvolution: (...args: unknown[]) => mockFetchScaleEvolution(...args),
  fetchMoodEvolution: async () => [],
  fetchFearEvolution: async () => [],
  fetchMedSideEffectsEvolution: (...args: unknown[]) => mockFetchMed(...args),
  fetchSleepEvolution: (...args: unknown[]) => mockFetchSleepEvolution(...args),
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
  mockFetchSleepEvolution.mockResolvedValue([])
  mockFetchAvailableScales.mockResolvedValue([])
  mockFetchScaleEvolution.mockResolvedValue([])
  mockFetchMed.mockResolvedValue({ effects: [], data: [] })
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

describe('PatientEvolutionTab — sections repliables', () => {
  it('replie la section au clic sur l’en-tête (corps masqué)', async () => {
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'beck_columns' }])
    const { getByTestId, queryByTestId, getByRole } = renderTab()
    await waitFor(() => expect(getByTestId('beck-panel')).toBeTruthy())
    fireEvent.click(getByRole('button', { name: /evolution\.beck_section_title/ }))
    expect(queryByTestId('beck-panel')).toBeNull()
  })

  it('« Voir les données → » demande l’ouverture de l’onglet Données du module', async () => {
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'beck_columns' }])
    const onOpen = vi.fn()
    const { getByTestId, getByRole } = render(
      <QueryClientProvider client={makeClient()}>
        <PatientEvolutionTab patientId="p1" onOpenModuleData={onOpen} />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(getByTestId('beck-panel')).toBeTruthy())
    fireEvent.click(getByRole('button', { name: /evolution\.view_data/ }))
    expect(onOpen).toHaveBeenCalledWith('beck_columns')
  })
})

describe('PatientEvolutionTab — sections converties (échelle, effets)', () => {
  it('échelle clinique : section repliable + « Voir les données → » porte la clé de l’échelle', async () => {
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'phq9' }])
    mockFetchAvailableScales.mockResolvedValue(['phq9'])
    mockFetchScaleEvolution.mockResolvedValue([
      { date: '2026-05-01', score: 12 },
      { date: '2026-06-01', score: 8 },
    ])
    const onOpen = vi.fn()
    const { getByRole, getAllByTestId } = render(
      <QueryClientProvider client={makeClient()}>
        <PatientEvolutionTab patientId="p1" onOpenModuleData={onOpen} />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(getByRole('button', { name: /evolution\.scale_phq9/ })).toBeTruthy())
    expect(getAllByTestId('linechart').length).toBeGreaterThanOrEqual(1)
    fireEvent.click(getByRole('button', { name: /evolution\.view_data/ }))
    expect(onOpen).toHaveBeenCalledWith('phq9')
  })

  it('effets indésirables : une seule section groupe un sous-graphe par effet', async () => {
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'medication_side_effects' }])
    mockFetchMed.mockResolvedValue({
      effects: ['nausea', 'insomnia'],
      data: [
        { date: '2026-05-01', nausea: 3, insomnia: 5 },
        { date: '2026-06-01', nausea: 6, insomnia: 2 },
      ],
    })
    const { getByRole, getAllByTestId } = renderTab()
    await waitFor(() => expect(getByRole('button', { name: /evolution\.med_effects_title/ })).toBeTruthy())
    // Deux effets → deux sous-graphes dans la même section.
    expect(getAllByTestId('linechart')).toHaveLength(2)
  })
})

describe('PatientEvolutionTab — comparaison période de référence (sommeil)', () => {
  it('le bouton « Comparer » révèle le choix de période de référence (off par défaut)', async () => {
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'sleep_diary' }])
    mockFetchSleepEvolution.mockResolvedValue([
      {
        date: '2026-03-15', efficiency: 82, total_sleep_min: 450, onset_min: 12, waso_min: 18,
        nap_min: 0, quality: 4, in_bed_time: '22:45', bedtime: '23:00', wake_time: '07:00',
        out_of_bed_time: '07:15', nightmares: false,
      },
    ])
    const { getByLabelText, getByText, queryByText } = renderTab()

    await waitFor(() => expect(getByText('evolution.sleep_section_title')).toBeTruthy())
    // Décoché par défaut → aucune période de référence proposée (graphe épuré)
    expect(queryByText('evolution.compare_ref_previous')).toBeNull()

    fireEvent.click(getByLabelText('evolution.compare_toggle'))
    expect(getByText('evolution.compare_ref_previous')).toBeTruthy()
    expect(getByText('evolution.compare_ref_last_year')).toBeTruthy()
  })
})
