jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../lib/database', () => ({
  // Plan items / cognitive saturation / daily / form — unused here but required at module load
  getAllPlanItemsForModule: jest.fn().mockResolvedValue([]),
  savePlanItem: jest.fn().mockResolvedValue(undefined),
  deletePlanItem: jest.fn().mockResolvedValue(undefined),
  getAllCognitiveSaturationSessions: jest.fn().mockResolvedValue([]),
  saveCognitiveSaturationSession: jest.fn().mockResolvedValue(undefined),
  deleteCognitiveSaturationSession: jest.fn().mockResolvedValue(undefined),
  getDailyEntry: jest.fn().mockResolvedValue(null),
  getAllDailyEntries: jest.fn().mockResolvedValue([]),
  saveDailyEntry: jest.fn().mockResolvedValue(undefined),
  deleteDailyEntry: jest.fn().mockResolvedValue(undefined),
  getAllFormEntries: jest.fn().mockResolvedValue([]),
  saveFormEntry: jest.fn().mockResolvedValue(undefined),
  deleteFormEntry: jest.fn().mockResolvedValue(undefined),
  // Tree selections — under test
  getAllTreeSelections: jest.fn().mockResolvedValue([]),
  saveTreeSelection: jest.fn().mockResolvedValue(undefined),
  deleteTreeSelection: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-tree-id-1'),
}))

jest.mock('../../../lib/dateUtils', () => ({
  formatDateTime: (str: string) => str,
  formatDateFull: (str: string) => `full:${str}`,
  formatDateNumeric: (str: string) => `num:${str}`,
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-test-id' } }),
}))

// Le layout ouvre l'écran des rappels (#257) : hors NavigationContainer en test.
const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, setOptions: jest.fn() }),
  // Sans `startEntry`, le module s'ouvre sur l'historique (comportement par défaut).
  useRoute: () => ({ params: {} }),
}))

// Rappels du module : aucun par défaut, la ligne « Prochain rappel » reste masquée.
const mockGetRoutines = jest.fn().mockResolvedValue([])
const mockGetModuleRef = jest.fn().mockResolvedValue({ id: 'pm-1', practitioner_id: 'pr-1' })
jest.mock('@services/notificationService', () => ({
  getRoutinesForModule: (...a: unknown[]) => mockGetRoutines(...a),
  getPatientModuleRef: (...a: unknown[]) => mockGetModuleRef(...a),
}))

const mockHasSeen = jest.fn().mockResolvedValue(false)
const mockMarkSeen = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/moduleOnboardingService', () => ({
  hasSeenModuleOnboarding: (...a: unknown[]) => mockHasSeen(...a),
  markModuleOnboardingSeen: (...a: unknown[]) => mockMarkSeen(...a),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import { useActionSheet } from '../../../contexts/ActionSheetContext'
import type { ContentField } from '@services/moduleService'

jest.setTimeout(15000)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'emotion_wheel',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'tree_node',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

// Arbre minimal : 2 émotions primaires, chacune avec 1 secondaire, chacune avec 2 spécifiques.
// On reflète la structure que `fetchModuleFields` renverrait : top-level + children.
const SPEC_CALM = makeField({
  id: 'ew.joy.serenity.calm',
  parent_field_id: 'ew.joy.serenity',
  text_code: 'modules.emotion_wheel.node.joy__serenity__calm',
  sort_order: 1,
})
const SPEC_PEACEFUL = makeField({
  id: 'ew.joy.serenity.peaceful',
  parent_field_id: 'ew.joy.serenity',
  text_code: 'modules.emotion_wheel.node.joy__serenity__peaceful',
  sort_order: 2,
})
const SEC_SERENITY = makeField({
  id: 'ew.joy.serenity',
  parent_field_id: 'ew.joy',
  text_code: 'modules.emotion_wheel.node.joy__serenity',
  sort_order: 1,
  children: [SPEC_CALM, SPEC_PEACEFUL],
})
const PRIMARY_JOY = makeField({
  id: 'ew.joy',
  text_code: 'modules.emotion_wheel.node.joy',
  sort_order: 100,
  props: { color: '#F59E0B', icon: 'emoticon-happy-outline' },
  children: [SEC_SERENITY],
})

const SEC_TERROR = makeField({
  id: 'ew.fear.terror',
  parent_field_id: 'ew.fear',
  text_code: 'modules.emotion_wheel.node.fear__terror',
  sort_order: 3,
  children: [
    makeField({
      id: 'ew.fear.terror.panicked',
      parent_field_id: 'ew.fear.terror',
      text_code: 'modules.emotion_wheel.node.fear__terror__panicked',
      sort_order: 1,
    }),
  ],
})
const PRIMARY_FEAR = makeField({
  id: 'ew.fear',
  text_code: 'modules.emotion_wheel.node.fear',
  sort_order: 120,
  props: { color: '#6EE7B7', icon: 'alert-circle-outline' },
  children: [SEC_TERROR],
})

const MOCK_FIELDS: ContentField[] = [
  makeField({
    id: 'ew.cfg', field_type: 'tree_selector_config', sort_order: 0,
    props: { enable_intensity: '1', enable_notes: '1', intensity_min: '1', intensity_max: '5' },
  }),
  makeField({ id: 'ew.intro',           field_type: 'tree_selector_intro',           sort_order: 1, text_code: 'modules.emotion_wheel.intro' }),
  makeField({ id: 'ew.step1.title',     field_type: 'tree_selector_step_1_title',    sort_order: 2, text_code: 'modules.emotion_wheel.step_primary_title' }),
  makeField({ id: 'ew.step1.hint',      field_type: 'tree_selector_step_1_hint',     sort_order: 3, text_code: 'modules.emotion_wheel.step_primary_hint' }),
  makeField({ id: 'ew.step2.hint',      field_type: 'tree_selector_step_2_hint',     sort_order: 4, text_code: 'modules.emotion_wheel.step_secondary_hint' }),
  makeField({ id: 'ew.step3.title',     field_type: 'tree_selector_step_3_title',    sort_order: 5, text_code: 'modules.emotion_wheel.step_specific_title' }),
  makeField({ id: 'ew.step3.hint',      field_type: 'tree_selector_step_3_hint',     sort_order: 6, text_code: 'modules.emotion_wheel.step_specific_hint' }),
  makeField({ id: 'ew.intensity.title', field_type: 'tree_selector_intensity_title', sort_order: 7, text_code: 'modules.emotion_wheel.step_intensity_title' }),
  makeField({ id: 'ew.notes.title',     field_type: 'tree_selector_notes_title',     sort_order: 8, text_code: 'modules.emotion_wheel.step_notes_title' }),
  makeField({ id: 'ew.continue_btn',    field_type: 'tree_selector_continue_btn',    sort_order: 9, text_code: 'modules.emotion_wheel.continue' }),
  makeField({ id: 'ew.save_btn',        field_type: 'tree_selector_save_btn',       sort_order: 10, text_code: 'modules.emotion_wheel.save' }),
  makeField({ id: 'ew.new_btn',         field_type: 'tree_selector_new_btn',        sort_order: 11, text_code: 'modules.emotion_wheel.identify_btn' }),
  makeField({ id: 'ew.history_label',   field_type: 'tree_selector_history_label',  sort_order: 12, text_code: 'modules.emotion_wheel.history_label' }),
  makeField({ id: 'ew.empty_title',     field_type: 'tree_selector_empty_title',    sort_order: 13, text_code: 'modules.emotion_wheel.empty_title' }),
  makeField({ id: 'ew.empty_text',      field_type: 'tree_selector_empty_text',     sort_order: 14, text_code: 'modules.emotion_wheel.empty_text' }),
  makeField({ id: 'ew.delete_title',    field_type: 'tree_selector_delete_title',   sort_order: 15, text_code: 'modules.emotion_wheel.delete_entry_title' }),
  PRIMARY_JOY,
  PRIMARY_FEAR,
]

const MOCK_ENTRY: database.TreeSelection = {
  id: 'sel-1',
  module_id: 'emotion_wheel',
  selected_id: 'ew.joy.serenity.calm',
  selected_label: 'modules.emotion_wheel.node.joy__serenity__calm',
  path: [
    { id: 'ew.joy', text_code: 'modules.emotion_wheel.node.joy', color: '#F59E0B', icon: 'emoticon-happy-outline' },
    { id: 'ew.joy.serenity', text_code: 'modules.emotion_wheel.node.joy__serenity' },
    { id: 'ew.joy.serenity.calm', text_code: 'modules.emotion_wheel.node.joy__serenity__calm' },
  ],
  intensity: 6,
  notes: 'au lever',
  context: ['modules.emotion_wheel.context.work'],
  context_other: null,
  created_at: '2026-05-05T10:00:00Z',
}

// Config complète : intensité + contexte + notes + profondeur libre.
const MOCK_FIELDS_FULL: ContentField[] = [
  makeField({
    id: 'ew.cfg', field_type: 'tree_selector_config', sort_order: 0,
    props: {
      enable_intensity: '1', enable_notes: '1', enable_context: '1',
      enable_early_validate: '1', intensity_min: '1', intensity_max: '5',
      context_opt_1: 'modules.emotion_wheel.context.work',
      context_opt_2: 'modules.emotion_wheel.context.family',
      context_icon_1: 'briefcase-outline', context_icon_2: 'home-heart',
    },
  }),
  PRIMARY_JOY,
  PRIMARY_FEAR,
]

function renderLayout() {
  return render(
    <FieldRenderer
      preview_kind="tree_selector"
      fields={MOCK_FIELDS}
      moduleId="emotion_wheel"
    />
  )
}

function renderFull() {
  return render(
    <FieldRenderer
      preview_kind="tree_selector"
      fields={MOCK_FIELDS_FULL}
      moduleId="emotion_wheel"
    />
  )
}

// Config portant l'écran de première ouverture (K-2).
const MOCK_FIELDS_WELCOME: ContentField[] = MOCK_FIELDS.map(f =>
  f.id === 'ew.cfg'
    ? makeField({
        ...f,
        props: {
          ...f.props,
          welcome_title: 'modules.emotion_wheel.welcome_title',
          welcome_point_1: 'modules.emotion_wheel.welcome_point_1',
          welcome_ack_btn: 'modules.emotion_wheel.welcome_ack_btn',
        },
      })
    : f
)

function renderWelcome() {
  return render(
    <FieldRenderer
      preview_kind="tree_selector"
      fields={MOCK_FIELDS_WELCOME}
      moduleId="emotion_wheel"
    />
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FieldRenderer — tree_selector (TreeSelectorLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllTreeSelections as jest.Mock).mockResolvedValue([])
    mockHasSeen.mockResolvedValue(false)
    mockMarkSeen.mockResolvedValue(undefined)
  })

  // ── Écran de première ouverture (K-2, ticket #250) ────────────────────────

  it('affiche l\'écran de première ouverture au premier accès', async () => {
    renderWelcome()
    expect(await screen.findByTestId('module-welcome')).toBeTruthy()
    // Le module lui-même n'est pas encore accessible derrière.
    expect(screen.queryByTestId('start-new-button')).toBeNull()
  })

  it('« J\'ai compris » mémorise le passage et ouvre le module', async () => {
    renderWelcome()
    const btn = await screen.findByTestId('acknowledge-welcome')
    await act(async () => { fireEvent.press(btn) })
    expect(mockMarkSeen).toHaveBeenCalledWith('emotion_wheel')
    expect(await screen.findByTestId('start-new-button')).toBeTruthy()
    expect(screen.queryByTestId('module-welcome')).toBeNull()
  })

  it('ne réaffiche jamais l\'écran une fois vu', async () => {
    mockHasSeen.mockResolvedValue(true)
    renderWelcome()
    expect(await screen.findByTestId('start-new-button')).toBeTruthy()
    expect(screen.queryByTestId('module-welcome')).toBeNull()
  })

  it('n\'affiche pas d\'écran d\'introduction si la config n\'en porte pas', async () => {
    renderLayout()
    expect(await screen.findByTestId('start-new-button')).toBeTruthy()
    expect(screen.queryByTestId('module-welcome')).toBeNull()
    // Aucune lecture inutile : le module sans écran d'intro ne consulte même pas l'état.
    expect(mockHasSeen).not.toHaveBeenCalled()
  })

  it('ouvre le module malgré un échec de lecture de l\'état', async () => {
    mockHasSeen.mockRejectedValue(new Error('sqlite down'))
    renderWelcome()
    // On n'impose pas l'écran à cause d'une panne technique.
    expect(await screen.findByTestId('start-new-button')).toBeTruthy()
  })

  it('charge l\'historique au montage', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getAllTreeSelections).toHaveBeenCalledWith('emotion_wheel')
    })
  })

  it('affiche l\'état vide quand aucune entrée', async () => {
    renderLayout()
    expect(await screen.findByTestId('list-empty')).toBeTruthy()
  })

  it('affiche les entrées passées en mode historique', async () => {
    ;(database.getAllTreeSelections as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    expect(await screen.findByTestId('entry-card-sel-1')).toBeTruthy()
  })

  it('passe en mode sélection et affiche le niveau 1 au tap sur Nouveau', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    expect(await screen.findByTestId('level-1-grid')).toBeTruthy()
    expect(screen.getByTestId('node-ew.joy')).toBeTruthy()
    expect(screen.getByTestId('node-ew.fear')).toBeTruthy()
  })

  it('descend dans l\'arbre au tap sur un noeud', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    expect(await screen.findByTestId('level-2-list')).toBeTruthy()
    expect(screen.getByTestId('node-ew.joy.serenity')).toBeTruthy()
  })

  it('atteint l\'étape intensité quand une feuille est sélectionnée', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity'))
    fireEvent.press(await screen.findByTestId('leaf-ew.joy.serenity.calm'))
    expect(await screen.findByTestId('intensity-section')).toBeTruthy()
    expect(screen.getByTestId('notes-section')).toBeTruthy()
  })

  it('met à jour le cran d\'intensité sélectionné au tap', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity'))
    fireEvent.press(await screen.findByTestId('leaf-ew.joy.serenity.calm'))
    fireEvent.press(screen.getByTestId('intensity-btn-4'))
    expect(screen.getByTestId('intensity-btn-4').props.accessibilityState).toEqual({ selected: true })
  })

  it('la note se saisit sur le même écran que l\'intensité (K-6)', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity'))
    fireEvent.press(await screen.findByTestId('leaf-ew.joy.serenity.calm'))
    expect(await screen.findByTestId('notes-input')).toBeTruthy()
    expect(screen.getByTestId('intensity-section')).toBeTruthy()
  })

  it('enregistre une nouvelle sélection avec intensité et notes', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity'))
    fireEvent.press(await screen.findByTestId('leaf-ew.joy.serenity.calm'))
    fireEvent.press(screen.getByTestId('intensity-btn-4'))
    fireEvent.changeText(await screen.findByTestId('notes-input'), 'au lever')
    await act(async () => {
      fireEvent.press(screen.getByTestId('save-entry'))
    })

    await waitFor(() => {
      expect(database.saveTreeSelection).toHaveBeenCalledWith(
        expect.objectContaining({
          module_id: 'emotion_wheel',
          selected_id: 'ew.joy.serenity.calm',
          intensity: 4,
          notes: 'au lever',
          path: expect.arrayContaining([
            expect.objectContaining({ id: 'ew.joy' }),
            expect.objectContaining({ id: 'ew.joy.serenity' }),
            expect.objectContaining({ id: 'ew.joy.serenity.calm' }),
          ]),
        })
      )
    })
  })

  it('annule la saisie et revient à l\'historique', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity'))
    fireEvent.press(await screen.findByTestId('leaf-ew.joy.serenity.calm'))
    fireEvent.press(await screen.findByTestId('cancel-entry'))
    await waitFor(() => expect(screen.getByTestId('list-empty')).toBeTruthy())
  })

  it('⋯ ouvre une feuille d\'actions rappelant l\'entrée', async () => {
    ;(database.getAllTreeSelections as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    const { showActionSheet } = useActionSheet()
    renderLayout()
    // Attendre le rendu de la carte : le chargement asynchrone de l'historique doit
    // être retombé avant d'interroger le menu.
    await screen.findByTestId('entry-card-sel-1')
    await act(async () => { fireEvent.press(screen.getByTestId('menu-sel-1')) })

    expect(showActionSheet).toHaveBeenCalledWith(expect.objectContaining({
      // Le titre rappelle de quelle entrée il s'agit (K-3, écran E3a).
      title: expect.stringContaining('modules.emotion_wheel.node.joy'),
      options: expect.arrayContaining([
        expect.objectContaining({ destructive: true }),
      ]),
    }))
  })

  it('modifier une entrée conserve son identifiant et son horodatage (K-8)', async () => {
    ;(database.getAllTreeSelections as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    const { showActionSheet } = useActionSheet()
    renderLayout()
    await screen.findByTestId('entry-card-sel-1')
    await act(async () => { fireEvent.press(screen.getByTestId('menu-sel-1')) })

    const config = (showActionSheet as jest.Mock).mock.calls.at(-1)?.[0]
    const edit = config.options.find((o: { destructive?: boolean }) => !o.destructive)
    await act(async () => { edit.onPress() })

    // Le parcours rouvre à l'étape 1 : on re-choisit, puis on enregistre.
    fireEvent.press(await screen.findByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity'))
    fireEvent.press(await screen.findByTestId('leaf-ew.joy.serenity.calm'))
    await act(async () => { fireEvent.press(await screen.findByTestId('save-entry')) })

    await waitFor(() => {
      expect(database.saveTreeSelection).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sel-1',                       // pas un nouvel identifiant
          created_at: '2026-05-05T10:00:00Z', // ni un nouvel horodatage
        })
      )
    })
  })

  it('supprime une entrée après confirmation depuis la feuille d\'actions', async () => {
    ;(database.getAllTreeSelections as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    const { showActionSheet } = useActionSheet()
    renderLayout()
    await screen.findByTestId('entry-card-sel-1')
    await act(async () => { fireEvent.press(screen.getByTestId('menu-sel-1')) })

    // La doublure de test n'affiche pas la feuille : on déclenche l'option nous-mêmes.
    // `showConfirm` auto-valide (jest.setup), donc la suppression va jusqu'au bout.
    const config = (showActionSheet as jest.Mock).mock.calls.at(-1)?.[0]
    const destructive = config.options.find((o: { destructive?: boolean }) => o.destructive)
    await act(async () => { destructive.onPress() })

    await waitFor(() => {
      expect(database.deleteTreeSelection).toHaveBeenCalledWith('sel-1')
    })
    await waitFor(() => expect(screen.queryByTestId('entry-card-sel-1')).toBeNull())
  })

  it('affiche les chips de contexte d\'une entrée passée', async () => {
    ;(database.getAllTreeSelections as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    expect(await screen.findByTestId('chips-sel-1')).toBeTruthy()
  })

  // ── Profondeur libre + contexte (config complète) ──────────────────────────

  it('profondeur libre : bouton « valider ici » dès le niveau 2', async () => {
    renderFull()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    expect(await screen.findByTestId('validate-here')).toBeTruthy()
  })

  it('valider une famille seule ouvre la fiche unique', async () => {
    renderFull()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('validate-here'))
    expect(await screen.findByTestId('intensity-section')).toBeTruthy()
  })

  it('intensité, contexte et note tiennent sur le même écran (K-6)', async () => {
    renderFull()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('validate-here'))
    expect(await screen.findByTestId('intensity-section')).toBeTruthy()
    expect(screen.getByTestId('context-chips')).toBeTruthy()
    expect(screen.getByTestId('notes-input')).toBeTruthy()
  })

  it('enregistre le contexte sélectionné', async () => {
    renderFull()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('validate-here'))
    fireEvent.press(await screen.findByTestId('context-modules.emotion_wheel.context.work'))
    await act(async () => {
      fireEvent.press(await screen.findByTestId('save-entry'))
    })
    await waitFor(() => {
      expect(database.saveTreeSelection).toHaveBeenCalledWith(
        expect.objectContaining({
          selected_id: 'ew.joy',
          context: ['modules.emotion_wheel.context.work'],
        })
      )
    })
  })
})
