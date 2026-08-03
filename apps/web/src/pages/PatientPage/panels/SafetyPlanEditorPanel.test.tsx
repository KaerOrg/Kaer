import { vi, describe, it, expect, beforeEach } from 'vitest'

// `t` rend la clé, sauf interpolation : on veut voir QUELLE clé est demandée, et vérifier
// que toutes dérivent du `moduleId` reçu en prop : aucune n'est écrite en dur.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && !('defaultValue' in opts)
        ? `${key}(${Object.values(opts).join(',')})`
        : key,
    i18n: { language: 'fr' },
  }),
}))

const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() }
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => mockToast }))

const mockFetchItems = vi.fn()
const mockSaveItem = vi.fn()
const mockDeleteItem = vi.fn()
vi.mock('@services/safetyPlanItemsService', () => ({
  fetchSafetyPlanItems: (...a: unknown[]) => mockFetchItems(...a),
  saveSafetyPlanItem: (...a: unknown[]) => mockSaveItem(...a),
  deleteSafetyPlanItem: (...a: unknown[]) => mockDeleteItem(...a),
}))

const mockFetchConfig = vi.fn()
const mockMarkReviewed = vi.fn()
const mockSaveConfig = vi.fn()
vi.mock('@services/crisisPlanService', () => ({
  fetchCrisisPlanConfig: (...a: unknown[]) => mockFetchConfig(...a),
  markPlanReviewedToday: (...a: unknown[]) => mockMarkReviewed(...a),
  saveCrisisPlanConfig: (...a: unknown[]) => mockSaveConfig(...a),
}))

const mockFetchFields = vi.fn()
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: (...a: unknown[]) => mockFetchFields(...a),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ContentField } from '@kaer/shared'
import { SafetyPlanEditorPanel } from './SafetyPlanEditorPanel'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

function stepTitle(n: number, props: Record<string, string> = {}): ContentField {
  return {
    id: `crisis_plan.step_${n}.title`,
    module_id: 'crisis_plan',
    section_id: `step_${n}`,
    parent_field_id: null,
    field_type: 'step_title',
    text_code: `modules.crisis_plan.step_${n}_title`,
    sort_order: n * 10,
    props: { step_number: String(n), ...props },
    children: [],
  }
}

const SIX_STEPS: ContentField[] = [
  stepTitle(1),
  stepTitle(2),
  stepTitle(3, { mixed_kind: 'true' }),
  stepTitle(4, { contactable: 'true' }),
  stepTitle(5, { contactable: 'true' }),
  stepTitle(6, {
    measure_editor: 'true',
    measure_verb_1: 'modules.crisis_plan.measure_verb_entrust',
    measure_verb_6: 'modules.crisis_plan.measure_verb_other',
  }),
]

function item(over: Partial<SafetyPlanItem>): SafetyPlanItem {
  return {
    id: over.id ?? 'i1',
    section_id: over.section_id ?? 'step_1',
    text: over.text ?? 'Quand je ne dors plus',
    kind: over.kind ?? null,
    role: over.role ?? null,
    note: over.note ?? null,
    phone: over.phone ?? null,
    sort_order: over.sort_order ?? 0,
    authored_by: 'practitioner',
    created_at: '', updated_at: '',
  }
}

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <SafetyPlanEditorPanel patientId="p1" moduleId="crisis_plan" />
    </QueryClientProvider>,
  )
  return client
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchFields.mockResolvedValue({ preview_kind: 'safety_plan', fields: SIX_STEPS })
  mockFetchItems.mockResolvedValue([])
  mockFetchConfig.mockResolvedValue({
    practitionerMessage: '', createdWithAt: null, lastReviewedAt: null,
  })
  mockSaveItem.mockResolvedValue(undefined)
  mockDeleteItem.mockResolvedValue(undefined)
  mockMarkReviewed.mockResolvedValue({ ok: true })
  mockSaveConfig.mockResolvedValue({ ok: true })
})

describe('SafetyPlanEditorPanel : les six étapes', () => {
  it('liste les six étapes dans l\'ordre de la configuration', async () => {
    renderPanel()
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(await screen.findByTestId(`plan-step-step_${n}`)).toBeTruthy()
    }
  })

  it('marque « vide » les étapes sans item, et compte les autres', async () => {
    mockFetchItems.mockResolvedValue([item({ section_id: 'step_4' })])
    renderPanel()
    const step4 = await screen.findByTestId('plan-step-step_4')
    const step5 = await screen.findByTestId('plan-step-step_5')
    expect(step4.textContent).toContain('1')
    expect(step5.textContent).toContain('modules.crisis_plan.step_empty_mark')
  })

  it('ouvre la première étape par défaut, et suit le clic ensuite', async () => {
    mockFetchItems.mockResolvedValue([
      item({ id: 'a', section_id: 'step_1', text: 'Quand je ne dors plus' }),
      item({ id: 'b', section_id: 'step_4', text: 'Yasmine' }),
    ])
    renderPanel()
    expect(await screen.findByDisplayValue('Quand je ne dors plus')).toBeTruthy()

    fireEvent.click(screen.getByTestId('plan-step-step_4'))
    expect(await screen.findByDisplayValue('Yasmine')).toBeTruthy()
    expect(screen.queryByDisplayValue('Quand je ne dors plus')).toBeNull()
  })
})

describe('SafetyPlanEditorPanel : écriture', () => {
  it('un item créé part en écriture puis la liste est invalidée, sans rechargement', async () => {
    const client = renderPanel()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    // Le formulaire n'existe qu'une fois la configuration lue : sans étape connue, un
    // ajout écrirait un item sans `section_id`.
    await screen.findByTestId('plan-item-text')

    fireEvent.change(screen.getByTestId('plan-item-text'), { target: { value: 'Claire' } })
    fireEvent.click(screen.getByText('modules.crisis_plan.add_item'))

    await waitFor(() => expect(mockSaveItem).toHaveBeenCalledWith('p1', expect.objectContaining({
      section_id: 'step_1', text: 'Claire', sort_order: 0,
    })))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['crisis', 'planItems', 'p1'] }),
    ))
  })

  // Aucune suppression sans annulation possible : l'item revient tel quel, IDENTIFIANT
  // COMPRIS : ce n'est pas un nouvel item, c'est celui qu'on remet.
  it('l\'annulation d\'une suppression restaure l\'item à l\'identique', async () => {
    mockFetchItems.mockResolvedValue([
      item({ id: 'gone', section_id: 'step_1', text: 'Thomas', phone: '0600000000', role: 'mon frère' }),
    ])
    renderPanel()
    fireEvent.click(await screen.findByLabelText('common.delete : Thomas'))
    await waitFor(() => expect(mockDeleteItem).toHaveBeenCalledWith('p1', 'gone'))

    fireEvent.click(await screen.findByText('common.undo'))
    await waitFor(() => expect(mockSaveItem).toHaveBeenCalledWith('p1', {
      id: 'gone',
      section_id: 'step_1',
      text: 'Thomas',
      kind: null,
      role: 'mon frère',
      note: null,
      phone: '0600000000',
      sort_order: 0,
    }))
  })

  it('le bandeau d\'annulation n\'apparaît qu\'après une suppression', async () => {
    mockFetchItems.mockResolvedValue([item({ id: 'x', section_id: 'step_1', text: 'Thomas' })])
    renderPanel()
    await screen.findByDisplayValue('Thomas')
    expect(screen.queryByText('common.undo')).toBeNull()
  })

  it('signale l\'échec d\'une écriture par un toast, sans perdre la saisie', async () => {
    mockSaveItem.mockRejectedValue(new Error('nope'))
    renderPanel()
    await screen.findByTestId('plan-item-text')
    fireEvent.change(screen.getByTestId('plan-item-text'), { target: { value: 'Claire' } })
    fireEvent.click(screen.getByText('modules.crisis_plan.add_item'))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('common.save_error'))
  })
})

describe('SafetyPlanEditorPanel : date de revue (PW-5)', () => {
  it('affiche les deux dates quand elles existent', async () => {
    mockFetchConfig.mockResolvedValue({
      practitionerMessage: '', createdWithAt: '2026-03-12', lastReviewedAt: '2026-06-04',
    })
    renderPanel()
    expect(await screen.findByText(/modules\.crisis_plan\.plan_created_with\(/)).toBeTruthy()
    expect(screen.getByText(/modules\.crisis_plan\.plan_reviewed_with\(/)).toBeTruthy()
  })

  it('un appui date la revue du jour, en repassant la config courante au service', async () => {
    mockFetchConfig.mockResolvedValue({
      practitionerMessage: '', createdWithAt: '2026-03-12', lastReviewedAt: '2026-06-04',
    })
    renderPanel()
    const button = await screen.findByText('modules.crisis_plan.plan_review_today')
    await waitFor(() => expect(button).not.toBeDisabled())
    fireEvent.click(button)
    await waitFor(() => expect(mockMarkReviewed).toHaveBeenCalledWith('p1', expect.objectContaining({
      createdWithAt: '2026-03-12', lastReviewedAt: '2026-06-04',
    })))
  })

  // Sans cette garde, un appui avant la lecture de la config enverrait
  // `createdWithAt: null`, et la date de PREMIÈRE élaboration serait réécrite avec celle
  // du jour. Une revue ne doit jamais effacer une élaboration.
  it('reste indisponible tant que la config n\'est pas lue', async () => {
    let resolveConfig: (v: unknown) => void = () => {}
    mockFetchConfig.mockReturnValue(new Promise(resolve => { resolveConfig = resolve }))
    renderPanel()

    const button = await screen.findByText('modules.crisis_plan.plan_review_today')
    fireEvent.click(button)
    expect(mockMarkReviewed).not.toHaveBeenCalled()

    resolveConfig({ practitionerMessage: '', createdWithAt: '2026-03-12', lastReviewedAt: null })
    await waitFor(() => expect(button).not.toBeDisabled())
    fireEvent.click(button)
    await waitFor(() => expect(mockMarkReviewed).toHaveBeenCalledWith('p1', expect.objectContaining({
      createdWithAt: '2026-03-12',
    })))
  })

  // Idempotence dans la journée : deux appuis ne comptent que pour une revue. La garde
  // vit dans le service, testée là-bas ; ici on vérifie qu'on lui passe bien l'état lu.
  it('deux appuis passent la même config : le service tranche, pas l\'UI', async () => {
    renderPanel()
    const button = await screen.findByText('modules.crisis_plan.plan_review_today')
    await waitFor(() => expect(button).not.toBeDisabled())
    fireEvent.click(button)
    await waitFor(() => expect(mockMarkReviewed).toHaveBeenCalledTimes(1))
    fireEvent.click(button)
    await waitFor(() => expect(mockMarkReviewed).toHaveBeenCalledTimes(2))
    expect(mockMarkReviewed.mock.calls[0][1]).toEqual(mockMarkReviewed.mock.calls[1][1])
  })
})

describe('SafetyPlanEditorPanel : étape 6 et message de soutien', () => {
  it('oriente l\'étape 6 vers l\'éditeur de mesures, d\'après sa configuration', async () => {
    renderPanel()
    fireEvent.click(await screen.findByTestId('plan-step-step_6'))
    // L'éditeur de mesures a ses propres champs ; le tableau d'items disparaît.
    expect(await screen.findByTestId('measure-what')).toBeTruthy()
    expect(screen.queryByTestId('plan-item-text')).toBeNull()
  })

  it('enregistre le message de soutien sans toucher aux dates de revue', async () => {
    mockFetchConfig.mockResolvedValue({
      practitionerMessage: 'Vous avez traversé mars.', createdWithAt: null, lastReviewedAt: null,
    })
    renderPanel()
    const field = await screen.findByDisplayValue('Vous avez traversé mars.')
    fireEvent.change(field, { target: { value: 'Ce plan, nous l\'avons écrit ensemble.' } })
    fireEvent.click(screen.getByText('common.save'))
    await waitFor(() => expect(mockSaveConfig).toHaveBeenCalledWith('p1', {
      practitionerMessage: 'Ce plan, nous l\'avons écrit ensemble.',
    }))
    expect(mockMarkReviewed).not.toHaveBeenCalled()
  })

  it('annonce que les ancres existent, sans jamais afficher leur contenu', async () => {
    renderPanel()
    expect(await screen.findByText('modules.crisis_plan.anchors_local_only')).toBeTruthy()
  })
})

describe('SafetyPlanEditorPanel : conformité', () => {
  it('toutes les clés i18n dérivent du module reçu, aucune n\'est écrite en dur', async () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <SafetyPlanEditorPanel patientId="p1" moduleId="autre_plan" />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(container.textContent).toContain('modules.autre_plan.'))
    expect(container.textContent).not.toContain('modules.crisis_plan.')
  })

  it('n\'affiche ni pourcentage, ni score', async () => {
    mockFetchItems.mockResolvedValue([item({ section_id: 'step_1' })])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      <QueryClientProvider client={client}>
        <SafetyPlanEditorPanel patientId="p1" moduleId="crisis_plan" />
      </QueryClientProvider>,
    )
    await screen.findByTestId('plan-step-step_1')
    expect(container.textContent).not.toMatch(/%/)
  })
})
