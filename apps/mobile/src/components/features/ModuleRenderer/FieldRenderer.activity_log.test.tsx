jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../lib/database', () => ({
  // Other layouts — required at module load
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
  getAllTreeSelections: jest.fn().mockResolvedValue([]),
  saveTreeSelection: jest.fn().mockResolvedValue(undefined),
  deleteTreeSelection: jest.fn().mockResolvedValue(undefined),
  getAllSleepEntries: jest.fn().mockResolvedValue([]),
  getSleepEntry: jest.fn().mockResolvedValue(null),
  getSleepEntriesForMonth: jest.fn().mockResolvedValue([]),
  saveSleepEntry: jest.fn().mockResolvedValue(undefined),
  deleteSleepEntry: jest.fn().mockResolvedValue(undefined),
  computeSleepDuration: jest.fn(),
  computeSleepEfficiency: jest.fn(),
  // Activity log — under test
  getAllActivityRecords: jest.fn().mockResolvedValue([]),
  getActivityRecord: jest.fn().mockResolvedValue(null),
  saveActivityRecord: jest.fn().mockResolvedValue(undefined),
  deleteActivityRecord: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-activity-id-1'),
}))

const mockFetchBAActivities = jest.fn()
jest.mock('@services/baActivitiesService', () => ({
  fetchBAActivities: (...a: unknown[]) => mockFetchBAActivities(...a),
}))

jest.mock('../../../lib/dateUtils', () => ({
  formatDateTime: (str: string) => str,
  formatDateFull: (str: string) => `full:${str}`,
  formatDateNumeric: (str: string) => `num:${str}`,
  formatDateShort: (str: string) => `short:${str}`,
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-test-id' } }),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { todayIso, shiftDate } from '@kaer/shared'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import { useToast } from '../../../contexts/ToastContext'
import type { ContentField } from '@services/moduleService'

jest.setTimeout(15000)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'behavioral_activation',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'activity_log_config',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

const MOCK_FIELDS: ContentField[] = [
  makeField({
    id: 'al.cfg', field_type: 'activity_log_config', sort_order: 0,
    props: {
      engagement_event_type:  'SAVE_BEHAVIORAL_ACTIVATION',
      pleasure_min:           '0',
      pleasure_max:           '10',
      pleasure_step:          '1',
      mastery_min:            '0',
      mastery_max:            '10',
      mastery_step:           '1',
      pleasure_color:         '#059669',
      mastery_color:          '#4F46E5',
      dot_done_color:         '#10B981',
      dot_planned_color:      '#3B82F6',
      locale:                 'fr-FR',
      tab_upcoming_label:     'modules.behavioral_activation.tab_upcoming',
      tab_history_label:      'modules.behavioral_activation.tab_history',
      add_btn:                'modules.behavioral_activation.add_btn',
      today_empty_text:       'modules.behavioral_activation.today_empty',
      history_empty_text:     'modules.behavioral_activation.history_empty',
      section_activity_title: 'modules.behavioral_activation.section_activity',
      section_felt_title:     'modules.behavioral_activation.section_felt',
      section_notes_title:    'modules.behavioral_activation.section_notes',
      activity_placeholder:   'modules.behavioral_activation.activity_placeholder',
      pleasure_label:         'modules.behavioral_activation.pleasure_label',
      pleasure_sublabel:      'modules.behavioral_activation.pleasure_sublabel',
      mastery_label:          'modules.behavioral_activation.mastery_label',
      mastery_sublabel:       'modules.behavioral_activation.mastery_sublabel',
      pleasure_short_label:   'modules.behavioral_activation.pleasure_short',
      mastery_short_label:    'modules.behavioral_activation.mastery_short',
      mark_done_label:        'modules.behavioral_activation.mark_done',
      mark_undone_label:      'modules.behavioral_activation.mark_undone',
      status_planned_label:   'modules.behavioral_activation.status_planned',
      status_done_label:      'modules.behavioral_activation.status_done',
      completion_title:       'modules.behavioral_activation.completion_title',
      completion_skip_label:  'modules.behavioral_activation.completion_skip',
      notes_placeholder:      'common.notes_placeholder',
      date_label:             'modules.behavioral_activation.date_label',
      date_confirm_label:     'modules.behavioral_activation.date_confirm',
      planned_time_label:     'modules.behavioral_activation.planned_time',
      planned_time_clear_label: 'modules.behavioral_activation.planned_time_clear',
      save_label:             'modules.behavioral_activation.save',
      update_label:           'common.update',
      delete_label:           'common.delete',
      delete_title:           'modules.behavioral_activation.delete_activity_title',
      name_missing_title:     'modules.behavioral_activation.name_missing',
      name_missing_msg:       'modules.behavioral_activation.name_missing_msg',
      my_activities_title:    'modules.behavioral_activation.my_activities',
      linked_value_prefix:    'modules.behavioral_activation.linked_value',
      back_label:             'modules.behavioral_activation.back_btn',
    },
  }),
  makeField({ id: 'al.dom_body', field_type: 'activity_log_domain', sort_order: 10, text_code: 'modules.behavioral_activation.domain_body' }),
  makeField({ id: 'al.sug_walk', field_type: 'activity_log_suggestion', sort_order: 100, text_code: 'modules.behavioral_activation.suggestion_walk', props: { domain: 'al.dom_body' } }),
  makeField({ id: 'al.sug_yoga', field_type: 'activity_log_suggestion', sort_order: 104, text_code: 'modules.behavioral_activation.suggestion_yoga', props: { domain: 'al.dom_body' } }),
]

const TODAY = todayIso()

function makeRecord(overrides: Partial<database.ActivityRecord>): database.ActivityRecord {
  return {
    id: 'rec-1',
    date: TODAY,
    label: 'Marche au parc',
    expected_pleasure: 6,
    expected_mastery: 4,
    pleasure: null,
    mastery: null,
    done: 0,
    notes: null,
    planned_time: null,
    domain_id: 'al.dom_body',
    config_activity_id: null,
    created_at: '2026-05-06T10:00:00Z',
  ...overrides,
  }
}

const MOCK_RECORD = makeRecord({})
const MOCK_DONE_RECORD = makeRecord({
  id: 'rec-2', label: 'Lecture', done: 1, pleasure: 8, mastery: 6, notes: 'Très agréable',
})

function renderLayout() {
  return render(
    <FieldRenderer
      preview_kind="activity_log"
      fields={MOCK_FIELDS}
      moduleId="behavioral_activation"
    />
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FieldRenderer — activity_log (ActivityLogLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([])
    ;(database.getActivityRecord as jest.Mock).mockResolvedValue(null)
    mockFetchBAActivities.mockResolvedValue([])
  })

  it('monte en vue agenda : Aujourd\'hui toujours affiché, même vide', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getAllActivityRecords).toHaveBeenCalled()
    })
    expect(await screen.findByTestId('activity-log-agenda')).toBeTruthy()
    expect(await screen.findByTestId('agenda-today')).toBeTruthy()
    expect(await screen.findByTestId('agenda-today-empty')).toBeTruthy()
  })

  it('affiche les activités du jour et celles à venir dans l\'agenda', async () => {
    const futureRecord = makeRecord({ id: 'rec-future', date: shiftDate(TODAY, 3), label: 'Piscine' })
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD, MOCK_DONE_RECORD, futureRecord])
    renderLayout()
    expect(await screen.findByTestId('record-rec-1')).toBeTruthy()
    expect(await screen.findByTestId('record-rec-2')).toBeTruthy()
    expect(await screen.findByTestId(`agenda-day-${shiftDate(TODAY, 3)}`)).toBeTruthy()
    expect(await screen.findByTestId('record-rec-future')).toBeTruthy()
  })

  it('une activité passée vit dans l\'onglet Historique, pas dans l\'agenda', async () => {
    const oldRecord = makeRecord({ id: 'rec-old', date: shiftDate(TODAY, -30), label: 'Ancienne' })
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([oldRecord])
    renderLayout()
    await screen.findByTestId('activity-log-agenda')
    expect(screen.queryByTestId('record-rec-old')).toBeNull()
    fireEvent.press(screen.getByTestId('tab-history'))
    expect(await screen.findByTestId('activity-log-list')).toBeTruthy()
    expect(await screen.findByTestId('record-rec-old')).toBeTruthy()
  })

  it('l\'historique vide affiche son message dédié', async () => {
    renderLayout()
    await screen.findByTestId('activity-log-agenda')
    fireEvent.press(screen.getByTestId('tab-history'))
    expect(await screen.findByTestId('list-empty')).toBeTruthy()
  })

  it('passe en mode entry depuis le FAB', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    expect(await screen.findByTestId('activity-log-entry')).toBeTruthy()
  })

  it('refuse de sauver sans nom d\'activité', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('activity-log-entry')
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    expect(useToast().showToast).toHaveBeenCalled()
    expect(database.saveActivityRecord).not.toHaveBeenCalled()
  })

  it('planifier = quoi + quand : aucun slider, aucune évaluation imposée', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('activity-log-entry')
    // Aucun slider visible en mode planification
    expect(screen.queryByTestId('pleasure-7')).toBeNull()
    expect(screen.queryByTestId('mastery-5')).toBeNull()
    fireEvent.changeText(screen.getByTestId('label-input'), 'Marche')
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Marche',
          done: 0,
          expected_pleasure: null,
          expected_mastery: null,
          pleasure: null,
          mastery: null,
        })
      )
    })
  })

  it('re-taper le pip sélectionné efface la note (retour à non renseigné)', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('activity-log-entry')
    fireEvent.changeText(screen.getByTestId('label-input'), 'Marche')
    fireEvent.press(screen.getByText("Je l'ai déjà faite"))
    fireEvent.press(await screen.findByTestId('pleasure-7'))
    fireEvent.press(screen.getByTestId('pleasure-7'))
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({ done: 1, pleasure: null })
      )
    })
  })

  it('« Je l\'ai déjà faite » : les sliders ressentis s\'affichent directement', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('activity-log-entry')
    fireEvent.changeText(screen.getByTestId('label-input'), 'Lecture')
    fireEvent.press(screen.getByText("Je l'ai déjà faite"))
    fireEvent.press(await screen.findByTestId('pleasure-8'))
    fireEvent.press(screen.getByTestId('mastery-6'))
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Lecture',
          done: 1,
          pleasure: 8,
          mastery: 6,
          expected_pleasure: null,
        })
      )
    })
  })

  it('édition : pré-remplit le formulaire et propose la suppression', async () => {
    const doneRecord = makeRecord({ id: 'rec-3', done: 1, pleasure: 7, mastery: 5 })
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([doneRecord])
    ;(database.getActivityRecord as jest.Mock).mockResolvedValue(doneRecord)
    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-rec-3'))
    await screen.findByTestId('activity-log-entry')
    expect(screen.getByTestId('delete-button')).toBeTruthy()
    expect(database.getActivityRecord).toHaveBeenCalledWith('rec-3')
  })

  it('propose les activités co-construites en premier et affiche la phrase valeur', async () => {
    mockFetchBAActivities.mockResolvedValue([
      { id: 'cfg-a1', label: 'Marche 20 min', domain_id: 'al.dom_body', value_text: 'Retrouver mon souffle' },
    ])
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('activity-log-entry')
    const chip = await screen.findByTestId('my-activity-cfg-a1')
    fireEvent.press(chip)
    expect(await screen.findByTestId('linked-value')).toBeTruthy()
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Marche 20 min',
          domain_id: 'al.dom_body',
          config_activity_id: 'cfg-a1',
        })
      )
    })
  })

  it('cocher réalisée ouvre la feuille « C\'était comment ? » sans rien enregistrer', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD])
    renderLayout()
    fireEvent.press(await screen.findByTestId('toggle-rec-1'))
    expect(await screen.findByTestId('completion-sheet')).toBeTruthy()
    expect(database.saveActivityRecord).not.toHaveBeenCalled()
  })

  it('feuille de complétion : noter puis enregistrer écrit les ressentis et préserve les champs', async () => {
    const withTime = makeRecord({ planned_time: '17:30' })
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([withTime])
    renderLayout()
    fireEvent.press(await screen.findByTestId('toggle-rec-1'))
    await screen.findByTestId('completion-sheet')
    fireEvent.press(screen.getByTestId('completion-pleasure-7'))
    await act(async () => { fireEvent.press(screen.getByTestId('completion-save')) })
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rec-1',
          done: 1,
          pleasure: 7,
          mastery: null,
          expected_pleasure: 6,
          planned_time: '17:30',
          domain_id: 'al.dom_body',
        })
      )
    })
    await waitFor(() => expect(screen.queryByTestId('completion-sheet')).toBeNull())
  })

  it('feuille de complétion : « Passer » marque réalisée sans noter', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD])
    renderLayout()
    fireEvent.press(await screen.findByTestId('toggle-rec-1'))
    await screen.findByTestId('completion-sheet')
    await act(async () => { fireEvent.press(screen.getByTestId('completion-skip')) })
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'rec-1', done: 1, pleasure: null, mastery: null })
      )
    })
  })

  it('décocher une activité réalisée reste immédiat (pas de feuille)', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_DONE_RECORD])
    renderLayout()
    fireEvent.press(await screen.findByTestId('toggle-rec-2'))
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'rec-2', done: 0 })
      )
    })
    expect(screen.queryByTestId('completion-sheet')).toBeNull()
  })

  it('supprime une entrée depuis le mode entry après confirmation', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD])
    ;(database.getActivityRecord as jest.Mock).mockResolvedValue(MOCK_RECORD)
    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-rec-1'))
    const deleteBtn = await screen.findByTestId('delete-button')
    await act(async () => { fireEvent.press(deleteBtn) })
    await waitFor(() => {
      expect(database.deleteActivityRecord).toHaveBeenCalledWith('rec-1')
    })
  })

  it('supprime une entrée directement depuis la liste après confirmation', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD])
    renderLayout()
    const deleteBtn = await screen.findByTestId('delete-rec-1')
    await act(async () => { fireEvent.press(deleteBtn) })
    await waitFor(() => {
      expect(database.deleteActivityRecord).toHaveBeenCalledWith('rec-1')
    })
  })
})
