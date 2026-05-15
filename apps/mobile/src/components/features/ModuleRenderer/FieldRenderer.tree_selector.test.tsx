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

jest.mock('../../../services/engagementService', () => ({
  logEvent: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-test-id' } }),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import type { ContentField } from '../../../services/moduleService'

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
    props: { enable_intensity: '1', enable_notes: '1', intensity_min: '1', intensity_max: '10' },
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
  created_at: '2026-05-05T10:00:00Z',
}

function renderLayout() {
  return render(
    <FieldRenderer
      preview_kind="tree_selector"
      fields={MOCK_FIELDS}
      moduleId="emotion_wheel"
    />
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FieldRenderer — tree_selector (TreeSelectorLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllTreeSelections as jest.Mock).mockResolvedValue([])
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
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity.calm'))
    expect(await screen.findByTestId('intensity-card')).toBeTruthy()
    expect(screen.getByTestId('intensity-value')).toBeTruthy()
  })

  it('met à jour l\'intensité au tap sur un bouton', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity.calm'))
    fireEvent.press(screen.getByTestId('intensity-btn-8'))
    expect(screen.getByTestId('intensity-value').props.children).toBe(8)
  })

  it('passe à l\'étape notes après confirmation de l\'intensité', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity.calm'))
    fireEvent.press(await screen.findByTestId('continue-intensity'))
    expect(await screen.findByTestId('notes-input')).toBeTruthy()
    expect(screen.getByTestId('summary-card')).toBeTruthy()
  })

  it('enregistre une nouvelle sélection avec intensité et notes', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-ew.joy'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity'))
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity.calm'))
    fireEvent.press(screen.getByTestId('intensity-btn-7'))
    fireEvent.press(screen.getByTestId('continue-intensity'))
    fireEvent.changeText(await screen.findByTestId('notes-input'), 'au lever')
    await act(async () => {
      fireEvent.press(screen.getByTestId('save-entry'))
    })

    await waitFor(() => {
      expect(database.saveTreeSelection).toHaveBeenCalledWith(
        expect.objectContaining({
          module_id: 'emotion_wheel',
          selected_id: 'ew.joy.serenity.calm',
          intensity: 7,
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
    fireEvent.press(await screen.findByTestId('node-ew.joy.serenity.calm'))
    fireEvent.press(await screen.findByTestId('continue-intensity'))
    fireEvent.press(await screen.findByTestId('cancel-entry'))
    await waitFor(() => expect(screen.getByTestId('list-empty')).toBeTruthy())
  })

  it('supprime une entrée après confirmation', async () => {
    ;(database.getAllTreeSelections as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    let capturedDestructive: (() => Promise<void>) | undefined
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = (buttons ?? []).find(b => b.style === 'destructive')
      capturedDestructive = destructive?.onPress as () => Promise<void>
    })

    renderLayout()
    fireEvent.press(await screen.findByTestId('delete-sel-1'))
    expect(capturedDestructive).toBeDefined()
    await act(async () => { await capturedDestructive!() })

    expect(database.deleteTreeSelection).toHaveBeenCalledWith('sel-1')
    await waitFor(() => expect(screen.queryByTestId('entry-card-sel-1')).toBeNull())
  })
})
