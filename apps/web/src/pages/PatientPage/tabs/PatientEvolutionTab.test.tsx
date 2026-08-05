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
  EvolutionOverviewBand: ({ cards }: { cards: { kind: string; moduleType: string }[] }) => (
    <div
      data-testid="overview-band"
      data-count={cards.length}
      data-kinds={cards.map(c => `${c.moduleType}:${c.kind}`).join(',')}
    />
  ),
}))

vi.mock('./ColumnFormDataPanel', () => ({
  ColumnFormDataPanel: ({ moduleType, entries }: { moduleType: string; entries: unknown[] }) => (
    <div data-testid="beck-panel" data-module={moduleType} data-entries={entries.length} />
  ),
}))

const {
  mockFetchFormEntries, mockFetchPatientModules, mockFetchSleepEvolution,
  mockFetchAvailableScales, mockFetchScaleEvolution, mockFetchMed, mockFetchNaming,
  mockFetchBreathing,
} = vi.hoisted(() => ({
  mockFetchBreathing: vi.fn(),
  mockFetchFormEntries: vi.fn(),
  mockFetchPatientModules: vi.fn(),
  mockFetchSleepEvolution: vi.fn(),
  mockFetchAvailableScales: vi.fn(),
  mockFetchScaleEvolution: vi.fn(),
  mockFetchMed: vi.fn(),
  mockFetchNaming: vi.fn(),
}))

// Taxonomie du module « Nommer ce que je ressens » : deux familles, deux nuances.
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: async () => ({
    fields: [
      { id: 'ew.cfg', field_type: 'tree_selector_config', text_code: null, props: { context_opt_1: 'ctx.work' } },
      {
        id: 'f1', field_type: 'tree_node', text_code: 'fam.joy', props: {},
        children: [{ id: 'n1', field_type: 'tree_node', text_code: 'n.a', props: {}, children: [] }],
      },
      {
        id: 'f2', field_type: 'tree_node', text_code: 'fam.fear', props: {},
        children: [{ id: 'n2', field_type: 'tree_node', text_code: 'n.b', props: {}, children: [] }],
      },
    ],
  }),
}))

// Agrégat d'évolution : les modules non pilotés par un mock restent sans donnée.
vi.mock('@services/engagementService', () => ({
  fetchAvailableScales: (...args: unknown[]) => mockFetchAvailableScales(...args),
  fetchScaleEvolution: (...args: unknown[]) => mockFetchScaleEvolution(...args),
  fetchMoodEvolution: async () => [],
  fetchFearEvolution: async () => [],
  fetchDefusionEvolution: async () => [],
  fetchMedSideEffectsEvolution: (...args: unknown[]) => mockFetchMed(...args),
  fetchSleepEvolution: (...args: unknown[]) => mockFetchSleepEvolution(...args),
  fetchChronoEntries: async () => [],
  fetchActivityEntries: async () => [],
  fetchEmotionNamingEntries: (...args: unknown[]) => mockFetchNaming(...args),
  fetchBreathingSessions: (...args: unknown[]) => mockFetchBreathing(...args),
  fetchModuleSummary: async () => ({ lastDate: null, count: 0, lastPayload: null }),
  fetchFormEntries: (...args: unknown[]) => mockFetchFormEntries(...args),
}))

vi.mock('@services/moduleAssignmentService', () => ({
  fetchPatientModules: (...args: unknown[]) => mockFetchPatientModules(...args),
  fetchBreathingPractitionerConfig: async () => ({
    enabledTechniques: ['coherence_cardiaque'], primaryTechnique: 'coherence_cardiaque',
    weeklyGoalSessions: 4,
  }),
}))

// Le panneau respiration est couvert par BreathingEvolutionPanel.test.tsx : ici on
// vérifie seulement qu'il est monté avec les sessions et l'objectif de l'agrégat.
vi.mock('./BreathingEvolutionPanel', () => ({
  BreathingEvolutionPanel: ({ sessions, weeklyGoal }: { sessions: unknown[]; weeklyGoal: number | null }) => (
    <div data-testid="breathing-panel" data-sessions={sessions.length} data-goal={String(weeklyGoal)} />
  ),
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
  mockFetchNaming.mockResolvedValue([])
  mockFetchBreathing.mockResolvedValue([])
})

/** Une session de respiration, datée du jour indiqué. */
function breathingSession(startedAt: string) {
  return {
    startedAt, techniqueKey: 'coherence_cardiaque', durationSeconds: 300,
    plannedDurationSeconds: 300, cyclesCompleted: 30, completed: true, feeling: null,
  }
}

describe('PatientEvolutionTab, section respiration (W2)', () => {
  it('ne rend aucune section quand le patient n a pas de session', async () => {
    mockFetchPatientModules.mockResolvedValue([{ id: 'pm1', module_type: 'breathing_techniques' }])
    const { queryByTestId, findByTestId } = renderTab()
    await findByTestId('overview-band')
    expect(queryByTestId('breathing-panel')).toBeNull()
  })

  it('masque la section quand le module n est plus affecte au patient', async () => {
    mockFetchBreathing.mockResolvedValue([breathingSession('2026-03-04T08:00:00')])
    mockFetchPatientModules.mockResolvedValue([])
    const { queryByTestId, findByTestId } = renderTab()
    await findByTestId('overview-band')
    expect(queryByTestId('breathing-panel')).toBeNull()
  })

  it('monte le panneau avec les sessions et l objectif hebdomadaire du patient', async () => {
    mockFetchBreathing.mockResolvedValue([
      breathingSession('2026-03-04T08:00:00'), breathingSession('2026-03-12T19:00:00'),
    ])
    mockFetchPatientModules.mockResolvedValue([{ id: 'pm1', module_type: 'breathing_techniques' }])
    const { findByTestId } = renderTab()
    const panel = await findByTestId('breathing-panel')
    expect(panel.getAttribute('data-sessions')).toBe('2')
    await waitFor(() => expect(panel.getAttribute('data-goal')).toBe('4'))
  })

  it('demande l ouverture de l onglet Donnees du module respiration', async () => {
    mockFetchBreathing.mockResolvedValue([breathingSession('2026-03-04T08:00:00')])
    mockFetchPatientModules.mockResolvedValue([{ id: 'pm1', module_type: 'breathing_techniques' }])
    const onOpen = vi.fn()
    const { findByTestId, getAllByText } = render(
      <QueryClientProvider client={makeClient()}>
        <PatientEvolutionTab patientId="p1" onOpenModuleData={onOpen} />
      </QueryClientProvider>,
    )
    await findByTestId('breathing-panel')
    fireEvent.click(getAllByText('evolution.view_data').at(-1)!)
    expect(onOpen).toHaveBeenCalledWith('breathing_techniques')
  })
})

/** N saisies « Nommer ce que je ressens », datées d'aujourd'hui. */
function namingEntries(count: number) {
  return Array.from({ length: count }, () => ({
    date: new Date().toISOString(),
    familyCode: 'fam.joy', nuanceCode: 'n.a', wordCode: null,
    intensity: null, context: ['ctx.work'], contextOther: null, notes: null,
  }))
}

describe('PatientEvolutionTab, section « Nommer ce que je ressens »', () => {
  it('sous 8 saisies, aucune section n\'est rendue', async () => {
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'emotion_wheel' }])
    mockFetchNaming.mockResolvedValue(namingEntries(7))
    const { queryByText, getByTestId } = renderTab()

    await waitFor(() => expect(getByTestId('overview-band')).toBeTruthy())
    expect(queryByText('modules.emotion_wheel.label')).toBeNull()
  })

  it('à partir de 8 saisies, rend la section avec ses comptages bruts', async () => {
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'emotion_wheel' }])
    mockFetchNaming.mockResolvedValue(namingEntries(12))
    const { getByText, getByTestId } = renderTab()

    await waitFor(() => expect(getByText('modules.emotion_wheel.label')).toBeTruthy())
    expect(getByTestId('naming-depth-band')).toBeTruthy()
    expect(getByTestId('naming-repertoire-band')).toBeTruthy()
    // Le lien « Voir les données » de CETTE section porte bien sa clé de module.
    expect(document.getElementById('evo-section-emotion_wheel')).toBeTruthy()
  })

  it('pousse une carte d\'aperçu SANS métrique (kind « counts »)', async () => {
    // Le rendu de la carte est couvert par EvolutionOverviewCard.test.tsx ; ici on
    // vérifie que l'onglet lui passe bien une carte d'effectifs, jamais une métrique.
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'emotion_wheel' }])
    mockFetchNaming.mockResolvedValue(namingEntries(12))
    const { getByTestId } = renderTab()

    await waitFor(() =>
      expect(getByTestId('overview-band').getAttribute('data-kinds')).toContain('emotion_wheel:counts'))
  })
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

describe('PatientEvolutionTab — bandeau d’aperçu (échelles + médication)', () => {
  it('pousse une carte par échelle active et une carte médication', async () => {
    const recent = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10)
    mockFetchPatientModules.mockResolvedValue([
      { module_type: 'phq9' }, { module_type: 'medication_side_effects' },
    ])
    mockFetchAvailableScales.mockResolvedValue(['phq9'])
    mockFetchScaleEvolution.mockResolvedValue([{ date: recent, score: 10 }])
    mockFetchMed.mockResolvedValue({ effects: ['nausea'], data: [{ date: recent, nausea: 5 }] })
    const { getByTestId } = renderTab()
    await waitFor(() => expect(getByTestId('overview-band')).toBeTruthy())
    // phq9 + medication_side_effects = 2 cartes.
    expect(getByTestId('overview-band').getAttribute('data-count')).toBe('2')
  })
})

describe('PatientEvolutionTab : filtre par famille (K-2)', () => {
  // Patient avec une échelle (phq9) ET un module (sleep_diary) ayant des données.
  function seedMixed() {
    mockFetchPatientModules.mockResolvedValue([{ module_type: 'phq9' }, { module_type: 'sleep_diary' }])
    mockFetchAvailableScales.mockResolvedValue(['phq9'])
    mockFetchScaleEvolution.mockResolvedValue([
      { date: '2026-05-01', score: 12 },
      { date: '2026-06-01', score: 8 },
    ])
    mockFetchSleepEvolution.mockResolvedValue([
      {
        date: '2026-03-15', efficiency: 82, total_sleep_min: 450, onset_min: 12, waso_min: 18,
        nap_min: 0, quality: 4, in_bed_time: '22:45', bedtime: '23:00', wake_time: '07:00',
        out_of_bed_time: '07:15', nightmares: false,
      },
    ])
    // Beck désactivé pour cet essai : on veut un module « pur » (sommeil) et une échelle.
    mockFetchFormEntries.mockResolvedValue([])
  }

  function renderWithFamily(family?: 'modules' | 'scales') {
    return render(
      <QueryClientProvider client={makeClient()}>
        <PatientEvolutionTab patientId="p1" family={family} />
      </QueryClientProvider>,
    )
  }

  it('family="modules" : garde les sections modules, masque les sections d’échelles', async () => {
    seedMixed()
    const { getByText, queryByRole } = renderWithFamily('modules')
    await waitFor(() => expect(getByText('evolution.sleep_section_title')).toBeTruthy())
    // La section de l'échelle phq9 ne doit PAS être rendue.
    expect(queryByRole('button', { name: /evolution\.scale_phq9/ })).toBeNull()
  })

  it('family="scales" : ne garde que les sections d’échelles, masque les modules', async () => {
    seedMixed()
    const { getByRole, queryByText } = renderWithFamily('scales')
    await waitFor(() => expect(getByRole('button', { name: /evolution\.scale_phq9/ })).toBeTruthy())
    // La section module (sommeil) ne doit PAS être rendue.
    expect(queryByText('evolution.sleep_section_title')).toBeNull()
  })

  it('family="modules" : le bandeau d’aperçu ne compte que les cartes modules', async () => {
    seedMixed()
    const { getByTestId } = renderWithFamily('modules')
    // sommeil = 1 carte ; l'échelle phq9 est exclue de la famille modules.
    await waitFor(() =>
      expect(getByTestId('overview-band').getAttribute('data-count')).toBe('1'))
  })

  it('sans family : affiche les deux familles (comportement historique)', async () => {
    seedMixed()
    const { getByText, getByRole } = renderWithFamily(undefined)
    await waitFor(() => expect(getByRole('button', { name: /evolution\.scale_phq9/ })).toBeTruthy())
    expect(getByText('evolution.sleep_section_title')).toBeTruthy()
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
