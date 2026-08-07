import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

// Sonde de la fiche d'échelle (ModuleActionsModal).
const modalCalls: { module: string; activeTab: string }[] = []
vi.mock('./ModuleActionsModal', () => ({
  ModuleActionsModal: ({ module, activeTab }: { module: string; activeTab: string }) => {
    modalCalls.push({ module, activeTab })
    return <div data-testid="actions-modal" data-module={module} data-tab={activeTab} />
  },
}))

// Panneau d'évaluations C-SSRS (stub).
vi.mock('../../../components/features/CSSRSScreenPanel', () => ({
  CSSRSScreenPanel: () => <div data-testid="cssrs-panel" />,
}))

// Taxonomie vide : indications non rendues (pas nécessaires ici).
const mockFetchDormantModules = vi.fn().mockResolvedValue([])
vi.mock('@services/moduleCatalogService', () => ({
  fetchModuleTaxonomy: async () => ({ dimensions: [], tagsByDimension: new Map(), tagsByModule: new Map() }),
  fetchDormantModules: () => mockFetchDormantModules(),
}))

import type { ScaleMetaRow } from '@services/scaleService'

function makeScale(over: Partial<ScaleMetaRow> & { id: string }): ScaleMetaRow {
  return {
    evaluationType: 'auto', category: 'Humeur', targetAges: [], validatedAgeRange: '',
    noToggle: false, hasPreview: true, iconName: 'ClipboardList', referenceLabel: '', referenceUrl: '',
    ...over,
  }
}

const SCALE_META: ScaleMetaRow[] = [
  makeScale({ id: 'phq9', evaluationType: 'auto' }),
  makeScale({ id: 'cssrs', evaluationType: 'hetero', noToggle: true }),
  makeScale({ id: 'madrs', evaluationType: 'hetero' }),
]

// Métadonnées d'échelles servies au tableau (scaleQueries.meta → fetchScaleMeta).
vi.mock('@services/scaleService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@services/scaleService')>()),
  fetchScaleMeta: async () => SCALE_META,
}))

// Programmations servies à la colonne « Programmée » (K-7). phq9 est programmée en
// mensuel depuis longtemps sans passation récente → échéance dépassée (en retard).
vi.mock('@services/scaleScheduleService', () => ({
  fetchScaleSchedules: async () => [{
    id: 's1', patient_id: 'p1', practitioner_id: 'pr1', module_id: 'phq9',
    mode: 'home', frequency: 'monthly', day_of_week: 1, time_of_day: '09:00',
    ends_on: null, patient_reminder: true, created_at: '2020-01-01T00:00:00Z',
  }],
  fetchScaleSchedule: async () => null,
  saveScaleSchedule: vi.fn(),
  deleteScaleSchedule: vi.fn(),
}))

import { render, waitFor, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../contexts/ToastProvider'
import { PatientScalesTab } from './PatientScalesTab'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { ModuleCategory } from '@services/moduleCatalogService'

const CATEGORIES: ModuleCategory[] = [{
  id: 'cat', icon: '', labelKey: 'c.label', subtitleKey: 'c.sub',
  modules: [
    { id: 'phq9', icon: '', mobile_icon: '', color: '' },
    { id: 'cssrs', icon: '', mobile_icon: '', color: '' },
    { id: 'madrs', icon: '', mobile_icon: '', color: '' },
  ],
}]
// phq9 déverrouillée ; cssrs toujours dispo (noToggle) ; madrs activable (add modal).
const MODULES: PatientModule[] = [{
  id: 'pm1', patient_id: 'p1', practitioner_id: 'pr1',
  module_type: 'phq9', config: {}, unlocked_at: '2026-01-01T00:00:00Z',
}]
const ENABLED = new Set<ModuleType>(['phq9', 'cssrs', 'madrs'])

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderTab() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ToastProvider>
        <PatientScalesTab
          patientId="p1"
          practitionerId="pr1"
          modules={MODULES}
          categories={CATEGORIES}
          enabledModules={ENABLED}
          onReloadModules={async () => {}}
        />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  modalCalls.length = 0
  mockFetchDormantModules.mockResolvedValue([])
})

describe('PatientScalesTab (K-4)', () => {
  it('rend les échelles activées avec badge éval ; C-SSRS = « Toujours dispo. »', async () => {
    renderTab()
    await waitFor(() => expect(screen.getByText('modules.phq9.label')).toBeTruthy())
    // Échelles activées : phq9 (déverrouillée) + cssrs (noToggle). madrs est activable.
    expect(screen.getByText('modules.cssrs.label')).toBeInTheDocument()
    expect(screen.queryByText('modules.madrs.label')).not.toBeInTheDocument()
    // Badge Auto (phq9) + Hétéro (cssrs) accolés au nom.
    expect(screen.getByText('scales.eval_auto')).toBeInTheDocument()
    expect(screen.getAllByText('scales.eval_hetero').length).toBeGreaterThanOrEqual(1)
    // C-SSRS (hétéro) : sa cellule « Programmée » = « en séance · à la demande » (K-7).
    expect(screen.getByText('scales.programmed.in_session')).toBeInTheDocument()
  })

  it('clic sur une échelle auto ouvre la fiche sur le 1ᵉʳ onglet (Programmation, K-6)', async () => {
    renderTab()
    await waitFor(() => expect(screen.getByText('modules.phq9.label')).toBeTruthy())
    fireEvent.click(screen.getByText('modules.phq9.label'))
    await waitFor(() => expect(modalCalls.length).toBeGreaterThan(0))
    // phq9 est auto → onglet de tête = Programmation (K-6), plus Données.
    expect(modalCalls.at(-1)).toEqual({ module: 'phq9', activeTab: 'schedule' })
  })

  it('clic sur C-SSRS ouvre le panneau d’évaluations dédié (pas la fiche standard)', async () => {
    renderTab()
    await waitFor(() => expect(screen.getByText('modules.cssrs.label')).toBeTruthy())
    fireEvent.click(screen.getByText('modules.cssrs.label'))
    await waitFor(() => expect(screen.getByTestId('cssrs-panel')).toBeTruthy())
    expect(modalCalls.length).toBe(0)
  })

  it('colonne « Programmée » : en-tête + bandeau « auto en retard » quand une échéance est dépassée (K-7)', async () => {
    renderTab()
    await waitFor(() => expect(screen.getByText('modules.phq9.label')).toBeTruthy())
    // En-tête de la colonne « Programmée » (remplace « Débloqué le » côté échelles).
    await waitFor(() => expect(screen.getByText('scales.programmed.col')).toBeInTheDocument())
    // phq9 programmée mais échéance dépassée → pastille « en retard » + bandeau de rappel.
    await waitFor(() => expect(screen.getByText('scales.programmed.home_overdue')).toBeInTheDocument())
    expect(screen.getByText('scales.programmed.banner_title')).toBeInTheDocument()
    // C-SSRS (hétéro) : « en séance · à la demande », jamais une date.
    expect(screen.getByText('scales.programmed.in_session')).toBeInTheDocument()
  })

  // ── Zone « En veille » (QW-4, #421) ───────────────────────────────────────

  it('liste les échelles en veille avec leur motif', async () => {
    mockFetchDormantModules.mockResolvedValue([{ id: 'madrs', reason: 'rights' }])
    renderTab()

    await waitFor(() => expect(screen.getByText('scales.dormant.title')).toBeInTheDocument())
    expect(screen.getByText('scales.dormant.reason_rights')).toBeInTheDocument()
  })

  it('ne fait pas entrer un module « outil » en veille dans la liste des échelles', async () => {
    // Cet onglet ne parle que d'échelles : un module en veille qui n'en est pas une
    // n'a rien à y faire, et `scaleById` est le seul juge.
    mockFetchDormantModules.mockResolvedValue([{ id: 'sleep_diary', reason: 'beta_scope' }])
    renderTab()

    await waitFor(() => expect(screen.getByText('modules.phq9.label')).toBeTruthy())
    expect(screen.queryByText('scales.dormant.title')).not.toBeInTheDocument()
  })

  it('n\'affiche aucune zone quand rien n\'est en veille', async () => {
    renderTab()
    await waitFor(() => expect(screen.getByText('modules.phq9.label')).toBeTruthy())
    expect(screen.queryByText('scales.dormant.title')).not.toBeInTheDocument()
  })
})
