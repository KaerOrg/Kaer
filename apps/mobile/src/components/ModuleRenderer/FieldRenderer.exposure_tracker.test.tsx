jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../lib/database', () => ({
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
  getAllActivityRecords: jest.fn().mockResolvedValue([]),
  getActivityRecord: jest.fn().mockResolvedValue(null),
  saveActivityRecord: jest.fn().mockResolvedValue(undefined),
  deleteActivityRecord: jest.fn().mockResolvedValue(undefined),
  // Exposure tracker — under test
  getAllFearEntries: jest.fn().mockResolvedValue([]),
  getFearEntry: jest.fn().mockResolvedValue(null),
  saveFearEntry: jest.fn().mockResolvedValue(undefined),
  deleteFearEntry: jest.fn().mockResolvedValue(undefined),
  getAllFearSituations: jest.fn().mockResolvedValue([]),
  saveFearSituation: jest.fn().mockResolvedValue(undefined),
  deleteFearSituation: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id-1'),
}))

jest.mock('../../lib/dateUtils', () => ({
  formatDateTime: (str: string) => str,
  formatDateFull: (str: string) => `full:${str}`,
  formatDateNumeric: (str: string) => `num:${str}`,
  formatDateShort: (str: string) => `short:${str}`,
  formatDateShortYear: (str: string) => `sy:${str}`,
}))

jest.mock('../../services/engagementService', () => ({
  logEvent: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../store/authStore', () => ({
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
import * as database from '../../lib/database'
import * as engagementService from '../../services/engagementService'
import type { ContentField } from '../../services/moduleService'

jest.setTimeout(15000)

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'fear_thermometer',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'exposure_tracker_config',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

const MOCK_FIELDS: ContentField[] = [
  makeField({
    id: 'et.cfg', field_type: 'exposure_tracker_config', sort_order: 0,
    props: {
      engagement_event_type: 'SAVE_FEAR_ENTRY',
      suds_min: '0',
      suds_max: '100',
      suds_step: '10',
      suds_default_before: '50',
      suds_before_color: '#EF4444',
      suds_after_color: '#059669',
    },
  }),
  makeField({ id: 'et.tab_entries',        field_type: 'exposure_tracker_tab_entries_label',         sort_order: 1,  text_code: 'modules.fear_thermometer.tab_entries' }),
  makeField({ id: 'et.tab_situations',     field_type: 'exposure_tracker_tab_situations_label',      sort_order: 2,  text_code: 'modules.fear_thermometer.tab_situations' }),
  makeField({ id: 'et.add_btn',            field_type: 'exposure_tracker_add_btn',                   sort_order: 3,  text_code: 'modules.fear_thermometer.new_entry' }),
  makeField({ id: 'et.empty_title',        field_type: 'exposure_tracker_empty_title',               sort_order: 4,  text_code: 'modules.fear_thermometer.empty_title' }),
  makeField({ id: 'et.empty_text',         field_type: 'exposure_tracker_empty_text',                sort_order: 5,  text_code: 'modules.fear_thermometer.empty_text' }),
  makeField({ id: 'et.section_trigger',    field_type: 'exposure_tracker_section_trigger_title',     sort_order: 10, text_code: 'modules.fear_thermometer.section_trigger' }),
  makeField({ id: 'et.section_before',     field_type: 'exposure_tracker_section_before_title',      sort_order: 11, text_code: 'modules.fear_thermometer.section_before' }),
  makeField({ id: 'et.section_strategies', field_type: 'exposure_tracker_section_strategies_title',  sort_order: 12, text_code: 'modules.fear_thermometer.section_strategies' }),
  makeField({ id: 'et.section_after',      field_type: 'exposure_tracker_section_after_title',       sort_order: 13, text_code: 'modules.fear_thermometer.section_after' }),
  makeField({ id: 'et.section_notes',      field_type: 'exposure_tracker_section_notes_title',       sort_order: 14, text_code: 'modules.fear_thermometer.section_notes' }),
  makeField({ id: 'et.sit_mode_catalogue', field_type: 'exposure_tracker_situation_mode_catalogue',  sort_order: 20, text_code: 'modules.fear_thermometer.situation_mode_catalogue' }),
  makeField({ id: 'et.sit_mode_free',      field_type: 'exposure_tracker_situation_mode_free',       sort_order: 21, text_code: 'modules.fear_thermometer.situation_mode_free' }),
  makeField({ id: 'et.sit_free_ph',        field_type: 'exposure_tracker_situation_free_placeholder',sort_order: 22, text_code: 'modules.fear_thermometer.situation_free_placeholder' }),
  makeField({ id: 'et.sit_cat_empty',      field_type: 'exposure_tracker_situation_catalogue_empty', sort_order: 23, text_code: 'modules.fear_thermometer.situation_catalogue_empty' }),
  makeField({ id: 'et.suds_before_label',  field_type: 'exposure_tracker_suds_before_label',         sort_order: 30, text_code: 'modules.fear_thermometer.suds_before' }),
  makeField({ id: 'et.suds_before_hint',   field_type: 'exposure_tracker_suds_before_hint',          sort_order: 31, text_code: 'modules.fear_thermometer.suds_hint_before' }),
  makeField({ id: 'et.suds_after_label',   field_type: 'exposure_tracker_suds_after_label',          sort_order: 32, text_code: 'modules.fear_thermometer.suds_after' }),
  makeField({ id: 'et.suds_after_hint',    field_type: 'exposure_tracker_suds_after_hint',           sort_order: 33, text_code: 'modules.fear_thermometer.suds_hint_after' }),
  makeField({ id: 'et.suds_skip_null',     field_type: 'exposure_tracker_suds_skip_null',            sort_order: 34, text_code: 'modules.fear_thermometer.suds_skip_null' }),
  makeField({ id: 'et.suds_skip_later',    field_type: 'exposure_tracker_suds_skip_later',           sort_order: 35, text_code: 'modules.fear_thermometer.suds_skip_later' }),
  makeField({ id: 'et.strategies_hint',    field_type: 'exposure_tracker_strategies_hint',           sort_order: 40, text_code: 'modules.fear_thermometer.strategies_hint' }),
  makeField({ id: 'et.strategy_custom_ph', field_type: 'exposure_tracker_strategy_custom_placeholder',sort_order: 41, text_code: 'modules.fear_thermometer.strategy_custom_placeholder' }),
  makeField({ id: 'et.notes_placeholder',  field_type: 'exposure_tracker_notes_placeholder',         sort_order: 50, text_code: 'modules.fear_thermometer.notes_placeholder' }),
  makeField({ id: 'et.save_label',         field_type: 'exposure_tracker_save_label',                sort_order: 60, text_code: 'modules.fear_thermometer.save' }),
  makeField({ id: 'et.update_label',       field_type: 'exposure_tracker_update_label',              sort_order: 61, text_code: 'common.update' }),
  makeField({ id: 'et.delete_label',       field_type: 'exposure_tracker_delete_label',              sort_order: 62, text_code: 'common.delete' }),
  makeField({ id: 'et.back_label',         field_type: 'exposure_tracker_back_label',                sort_order: 63, text_code: 'common.back' }),
  makeField({ id: 'et.sit_missing_title',  field_type: 'exposure_tracker_situation_missing_title',   sort_order: 70, text_code: 'modules.fear_thermometer.situation_missing' }),
  makeField({ id: 'et.sit_missing_msg',    field_type: 'exposure_tracker_situation_missing_msg',     sort_order: 71, text_code: 'modules.fear_thermometer.situation_missing_msg' }),
  makeField({ id: 'et.delete_entry_title', field_type: 'exposure_tracker_delete_entry_title',        sort_order: 72, text_code: 'modules.fear_thermometer.delete_entry_title' }),
  makeField({ id: 'et.sit_delete_title',   field_type: 'exposure_tracker_situation_delete_title',    sort_order: 73, text_code: 'modules.fear_thermometer.delete_situation_title' }),
  makeField({ id: 'et.panel_title',        field_type: 'exposure_tracker_situations_panel_title',    sort_order: 80, text_code: 'modules.fear_thermometer.situations_title' }),
  makeField({ id: 'et.panel_hint',         field_type: 'exposure_tracker_situations_panel_hint',     sort_order: 81, text_code: 'modules.fear_thermometer.situations_hint' }),
  makeField({ id: 'et.sit_placeholder',    field_type: 'exposure_tracker_situation_placeholder',     sort_order: 82, text_code: 'modules.fear_thermometer.situation_placeholder' }),
  makeField({ id: 'et.sit_empty',          field_type: 'exposure_tracker_situation_empty',           sort_order: 83, text_code: 'modules.fear_thermometer.situation_empty' }),
  makeField({ id: 'et.strategy_breathing', field_type: 'exposure_tracker_strategy',                  sort_order: 100, text_code: 'modules.fear_thermometer.strategy_breathing' }),
  makeField({ id: 'et.strategy_grounding', field_type: 'exposure_tracker_strategy',                  sort_order: 101, text_code: 'modules.fear_thermometer.strategy_grounding' }),
]

const MOCK_ENTRY: database.FearEntry = {
  id: 'entry-1',
  date: '2026-05-06',
  situation_id: null,
  situation_label: 'Métro bondé',
  suds_before: 70,
  strategies: '{"selected":["et.strategy_breathing"],"custom":""}',
  custom_strategy: null,
  suds_after: 30,
  notes: null,
  created_at: '2026-05-06T10:00:00Z',
}

const MOCK_SITUATION: database.FearSituation = {
  id: 'sit-1',
  label: 'Prendre le métro',
  hierarchy_id: null,
  target_suds: null,
  is_done: 0,
  created_at: '2026-05-01T10:00:00Z',
}

function renderLayout() {
  return render(
    <FieldRenderer
      preview_kind="exposure_tracker"
      fields={MOCK_FIELDS}
      moduleId="fear_thermometer"
    />
  )
}

describe('FieldRenderer — exposure_tracker (ExposureTrackerLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([])
    ;(database.getFearEntry as jest.Mock).mockResolvedValue(null)
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([])
  })

  it('charge entries et situations au montage et affiche l\'état vide', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getAllFearEntries).toHaveBeenCalled()
      expect(database.getAllFearSituations).toHaveBeenCalled()
    })
    expect(await screen.findByTestId('list-empty')).toBeTruthy()
  })

  it('affiche la liste des entries existantes', async () => {
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    expect(await screen.findByTestId('entry-entry-1')).toBeTruthy()
  })

  it('passe en mode entry depuis le FAB', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    expect(await screen.findByTestId('exposure-tracker-entry')).toBeTruthy()
  })

  it('refuse de sauver sans situation renseignée', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('exposure-tracker-entry')
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    expect(alertSpy).toHaveBeenCalled()
    expect(database.saveFearEntry).not.toHaveBeenCalled()
  })

  it('enregistre une nouvelle entry en texte libre et émet le signal d\'engagement', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('exposure-tracker-entry')
    fireEvent.changeText(screen.getByTestId('situation-free-input'), 'Prendre l\'avion')
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveFearEntry).toHaveBeenCalledWith(
        expect.objectContaining({ situation_label: 'Prendre l\'avion', situation_id: null }),
      )
    })
    expect(engagementService.logEvent).toHaveBeenCalledWith(
      'patient-test-id',
      'SAVE_FEAR_ENTRY',
      expect.any(Object),
    )
  })

  it('enregistre avec une situation choisie dans le catalogue', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([MOCK_SITUATION])
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('exposure-tracker-entry')
    fireEvent.press(screen.getByTestId('situation-sit-1'))
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveFearEntry).toHaveBeenCalledWith(
        expect.objectContaining({ situation_id: 'sit-1', situation_label: 'Prendre le métro' }),
      )
    })
  })

  it('toggle une stratégie de coping et la persiste dans le JSON strategies', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('fab-add-button'))
    await screen.findByTestId('exposure-tracker-entry')
    fireEvent.changeText(screen.getByTestId('situation-free-input'), 'Examen')
    fireEvent.press(screen.getByTestId('strategy-et.strategy_breathing'))
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveFearEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          strategies: expect.stringContaining('et.strategy_breathing'),
        }),
      )
    })
  })

  it('pré-remplit le formulaire avec une entry existante', async () => {
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    ;(database.getFearEntry as jest.Mock).mockResolvedValue(MOCK_ENTRY)
    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-entry-1'))
    await screen.findByTestId('exposure-tracker-entry')
    await waitFor(() => expect(screen.queryByTestId('delete-button')).toBeTruthy())
    expect(database.getFearEntry).toHaveBeenCalledWith('entry-1')
  })

  it('édite une entry sans émettre le signal d\'engagement', async () => {
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    ;(database.getFearEntry as jest.Mock).mockResolvedValue(MOCK_ENTRY)
    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-entry-1'))
    await screen.findByTestId('exposure-tracker-entry')
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveFearEntry).toHaveBeenCalled()
    })
    expect(engagementService.logEvent).not.toHaveBeenCalled()
  })

  it('supprime une entry depuis la liste après confirmation', async () => {
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    let capturedDestructive: (() => Promise<void>) | undefined
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const d = (buttons ?? []).find(b => b.style === 'destructive')
      capturedDestructive = d?.onPress as () => Promise<void>
    })
    renderLayout()
    fireEvent.press(await screen.findByTestId('delete-entry-1'))
    expect(capturedDestructive).toBeDefined()
    await act(async () => { await capturedDestructive!() })
    expect(database.deleteFearEntry).toHaveBeenCalledWith('entry-1')
  })

  it('supprime une entry depuis le mode entry après confirmation', async () => {
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    ;(database.getFearEntry as jest.Mock).mockResolvedValue(MOCK_ENTRY)
    let capturedDestructive: (() => Promise<void>) | undefined
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const d = (buttons ?? []).find(b => b.style === 'destructive')
      capturedDestructive = d?.onPress as () => Promise<void>
    })
    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-entry-1'))
    const deleteBtn = await screen.findByTestId('delete-button')
    fireEvent.press(deleteBtn)
    expect(capturedDestructive).toBeDefined()
    await act(async () => { await capturedDestructive!() })
    expect(database.deleteFearEntry).toHaveBeenCalledWith('entry-1')
  })

  it('bascule sur l\'onglet Situations et ajoute une situation', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('tab-situations'))
    fireEvent.changeText(screen.getByTestId('new-situation-input'), 'Avion')
    await act(async () => { fireEvent.press(screen.getByTestId('add-situation-btn')) })
    await waitFor(() => {
      expect(database.saveFearSituation).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Avion' }),
      )
    })
  })

  it('supprime une situation depuis le panneau après confirmation', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([MOCK_SITUATION])
    let capturedDestructive: (() => Promise<void>) | undefined
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const d = (buttons ?? []).find(b => b.style === 'destructive')
      capturedDestructive = d?.onPress as () => Promise<void>
    })
    renderLayout()
    fireEvent.press(await screen.findByTestId('tab-situations'))
    fireEvent.press(await screen.findByTestId('delete-situation-sit-1'))
    expect(capturedDestructive).toBeDefined()
    await act(async () => { await capturedDestructive!() })
    expect(database.deleteFearSituation).toHaveBeenCalledWith('sit-1')
  })
})
