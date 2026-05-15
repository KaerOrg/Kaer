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

jest.mock('../../../lib/dateUtils', () => ({
  formatDateTime: (str: string) => str,
  formatDateFull: (str: string) => `full:${str}`,
  formatDateNumeric: (str: string) => `num:${str}`,
  formatDateShort: (str: string) => `short:${str}`,
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
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import * as engagementService from '../../../services/engagementService'
import type { ContentField } from '../../../services/moduleService'

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
      engagement_event_type: 'SAVE_BEHAVIORAL_ACTIVATION',
      pleasure_min: '0',
      pleasure_max: '10',
      pleasure_step: '1',
      mastery_min: '0',
      mastery_max: '10',
      mastery_step: '1',
      pleasure_color: '#059669',
      mastery_color: '#4F46E5',
      dot_done_color: '#10B981',
      dot_planned_color: '#3B82F6',
      locale: 'fr-FR',
    },
  }),
  makeField({ id: 'al.tab_list',           field_type: 'activity_log_tab_list_label',           sort_order: 1,  text_code: 'modules.behavioral_activation.tab_list' }),
  makeField({ id: 'al.tab_month',          field_type: 'activity_log_tab_month_label',          sort_order: 2,  text_code: 'modules.behavioral_activation.tab_month' }),
  makeField({ id: 'al.add_btn',            field_type: 'activity_log_add_btn',                  sort_order: 3,  text_code: 'modules.behavioral_activation.add_btn' }),
  makeField({ id: 'al.empty_title',        field_type: 'activity_log_empty_title',              sort_order: 4,  text_code: 'modules.behavioral_activation.empty_title' }),
  makeField({ id: 'al.empty_text',         field_type: 'activity_log_empty_text',               sort_order: 5,  text_code: 'modules.behavioral_activation.empty_text' }),
  makeField({ id: 'al.section_activity',   field_type: 'activity_log_section_activity_title',   sort_order: 10, text_code: 'modules.behavioral_activation.section_activity' }),
  makeField({ id: 'al.section_evaluation', field_type: 'activity_log_section_evaluation_title', sort_order: 11, text_code: 'modules.behavioral_activation.section_evaluation' }),
  makeField({ id: 'al.section_notes',      field_type: 'activity_log_section_notes_title',      sort_order: 12, text_code: 'modules.behavioral_activation.section_notes' }),
  makeField({ id: 'al.placeholder',        field_type: 'activity_log_activity_placeholder',     sort_order: 13, text_code: 'modules.behavioral_activation.activity_placeholder' }),
  makeField({ id: 'al.pleasure_label',     field_type: 'activity_log_pleasure_label',           sort_order: 14, text_code: 'modules.behavioral_activation.pleasure_label' }),
  makeField({ id: 'al.pleasure_sublabel',  field_type: 'activity_log_pleasure_sublabel',        sort_order: 15, text_code: 'modules.behavioral_activation.pleasure_sublabel' }),
  makeField({ id: 'al.mastery_label',      field_type: 'activity_log_mastery_label',            sort_order: 16, text_code: 'modules.behavioral_activation.mastery_label' }),
  makeField({ id: 'al.mastery_sublabel',   field_type: 'activity_log_mastery_sublabel',         sort_order: 17, text_code: 'modules.behavioral_activation.mastery_sublabel' }),
  makeField({ id: 'al.done_label',         field_type: 'activity_log_done_label',               sort_order: 18, text_code: 'modules.behavioral_activation.done_label' }),
  makeField({ id: 'al.mark_done',          field_type: 'activity_log_mark_done_label',          sort_order: 19, text_code: 'modules.behavioral_activation.mark_done' }),
  makeField({ id: 'al.mark_undone',        field_type: 'activity_log_mark_undone_label',        sort_order: 20, text_code: 'modules.behavioral_activation.mark_undone' }),
  makeField({ id: 'al.notes_ph',           field_type: 'activity_log_notes_placeholder',        sort_order: 21, text_code: 'common.notes_placeholder' }),
  makeField({ id: 'al.date_label',         field_type: 'activity_log_date_label',               sort_order: 22, text_code: 'modules.behavioral_activation.date_label' }),
  makeField({ id: 'al.date_confirm',       field_type: 'activity_log_date_confirm_label',       sort_order: 23, text_code: 'modules.behavioral_activation.date_confirm' }),
  makeField({ id: 'al.save',               field_type: 'activity_log_save_label',               sort_order: 30, text_code: 'modules.behavioral_activation.save' }),
  makeField({ id: 'al.update',             field_type: 'activity_log_update_label',             sort_order: 31, text_code: 'common.update' }),
  makeField({ id: 'al.delete_label',       field_type: 'activity_log_delete_label',             sort_order: 32, text_code: 'common.delete' }),
  makeField({ id: 'al.delete_title',       field_type: 'activity_log_delete_title',             sort_order: 33, text_code: 'modules.behavioral_activation.delete_activity_title' }),
  makeField({ id: 'al.name_missing_t',     field_type: 'activity_log_name_missing_title',       sort_order: 34, text_code: 'modules.behavioral_activation.name_missing' }),
  makeField({ id: 'al.name_missing_m',     field_type: 'activity_log_name_missing_msg',         sort_order: 35, text_code: 'modules.behavioral_activation.name_missing_msg' }),
  makeField({ id: 'al.legend_done',        field_type: 'activity_log_legend_done_label',        sort_order: 40, text_code: 'modules.behavioral_activation.legend_done' }),
  makeField({ id: 'al.legend_planned',     field_type: 'activity_log_legend_planned_label',     sort_order: 41, text_code: 'modules.behavioral_activation.legend_planned' }),
  makeField({ id: 'al.month_hint_tap',     field_type: 'activity_log_month_hint_tap',           sort_order: 42, text_code: 'modules.behavioral_activation.month_hint_tap' }),
  makeField({ id: 'al.month_hint_empty',   field_type: 'activity_log_month_hint_empty',         sort_order: 43, text_code: 'modules.behavioral_activation.month_hint_empty' }),
  makeField({ id: 'al.back',               field_type: 'activity_log_back_label',               sort_order: 44, text_code: 'modules.behavioral_activation.back_btn' }),
  makeField({ id: 'al.sug_walk',           field_type: 'activity_log_suggestion',               sort_order: 100, text_code: 'modules.behavioral_activation.suggestion_walk' }),
  makeField({ id: 'al.sug_yoga',           field_type: 'activity_log_suggestion',               sort_order: 104, text_code: 'modules.behavioral_activation.suggestion_yoga' }),
]

const MOCK_RECORD: database.ActivityRecord = {
  id: 'rec-1',
  date: '2026-05-06',
  label: 'Marche au parc',
  pleasure: 7,
  mastery: 5,
  done: 0,
  notes: null,
  created_at: '2026-05-06T10:00:00Z',
}

const MOCK_DONE_RECORD: database.ActivityRecord = {
  id: 'rec-2',
  date: '2026-05-06',
  label: 'Lecture',
  pleasure: 8,
  mastery: 6,
  done: 1,
  notes: 'Très agréable',
  created_at: '2026-05-06T11:00:00Z',
}

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
  })

  it('charge les enregistrements au montage et affiche l\'état vide', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getAllActivityRecords).toHaveBeenCalled()
    })
    expect(await screen.findByTestId('list-empty')).toBeTruthy()
  })

  it('affiche la liste des enregistrements groupés par date', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD, MOCK_DONE_RECORD])
    renderLayout()
    expect(await screen.findByTestId('record-rec-1')).toBeTruthy()
    expect(await screen.findByTestId('record-rec-2')).toBeTruthy()
  })

  it('passe en mode entry depuis le FAB', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    expect(await screen.findByTestId('activity-log-entry')).toBeTruthy()
  })

  it('refuse de sauver sans nom d\'activité', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('activity-log-entry')
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    expect(alertSpy).toHaveBeenCalled()
    expect(database.saveActivityRecord).not.toHaveBeenCalled()
  })

  it('enregistre une nouvelle activité et émet le signal d\'engagement', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('activity-log-entry')
    fireEvent.changeText(screen.getByTestId('label-input'), 'Marche')
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Marche', done: 0 })
      )
    })
    expect(engagementService.logEvent).toHaveBeenCalledWith(
      'patient-test-id',
      'SAVE_BEHAVIORAL_ACTIVATION',
      expect.any(Object)
    )
  })

  it('toggle l\'état done depuis l\'entrée', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('activity-log-entry')
    fireEvent.changeText(screen.getByTestId('label-input'), 'Lecture')
    fireEvent.press(screen.getByTestId('done-toggle'))
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Lecture', done: 1 })
      )
    })
  })

  it('pré-remplit le formulaire avec un enregistrement existant', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD])
    ;(database.getActivityRecord as jest.Mock).mockResolvedValue(MOCK_RECORD)
    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-rec-1'))
    await screen.findByTestId('activity-log-entry')
    await waitFor(() => expect(screen.queryByTestId('delete-button')).toBeTruthy())
    expect(database.getActivityRecord).toHaveBeenCalledWith('rec-1')
  })

  it('édite sans émettre le signal d\'engagement', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD])
    ;(database.getActivityRecord as jest.Mock).mockResolvedValue(MOCK_RECORD)
    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-rec-1'))
    await screen.findByTestId('activity-log-entry')
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalled()
    })
    expect(engagementService.logEvent).not.toHaveBeenCalled()
  })

  it('toggle done directement depuis la liste', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD])
    renderLayout()
    fireEvent.press(await screen.findByTestId('toggle-rec-1'))
    await waitFor(() => {
      expect(database.saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'rec-1', done: 1 })
      )
    })
  })

  it('passe en mode month et navigue', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('tab-month'))
    expect(await screen.findByTestId('activity-log-month')).toBeTruthy()
    fireEvent.press(screen.getByTestId('month-prev'))
    fireEvent.press(screen.getByTestId('month-next'))
    fireEvent.press(screen.getByTestId('month-back-button'))
    await waitFor(() => expect(screen.getByTestId('activity-log-list')).toBeTruthy())
  })

  it('supprime une entrée depuis le mode entry après confirmation', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD])
    ;(database.getActivityRecord as jest.Mock).mockResolvedValue(MOCK_RECORD)
    let capturedDestructive: (() => Promise<void>) | undefined
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const d = (buttons ?? []).find(b => b.style === 'destructive')
      capturedDestructive = d?.onPress as () => Promise<void>
    })

    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-rec-1'))
    const deleteBtn = await screen.findByTestId('delete-button')
    fireEvent.press(deleteBtn)
    expect(capturedDestructive).toBeDefined()
    await act(async () => { await capturedDestructive!() })
    expect(database.deleteActivityRecord).toHaveBeenCalledWith('rec-1')
  })

  it('supprime une entrée directement depuis la liste après confirmation', async () => {
    ;(database.getAllActivityRecords as jest.Mock).mockResolvedValue([MOCK_RECORD])
    let capturedDestructive: (() => Promise<void>) | undefined
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const d = (buttons ?? []).find(b => b.style === 'destructive')
      capturedDestructive = d?.onPress as () => Promise<void>
    })

    renderLayout()
    fireEvent.press(await screen.findByTestId('delete-rec-1'))
    expect(capturedDestructive).toBeDefined()
    await act(async () => { await capturedDestructive!() })
    expect(database.deleteActivityRecord).toHaveBeenCalledWith('rec-1')
  })
})
