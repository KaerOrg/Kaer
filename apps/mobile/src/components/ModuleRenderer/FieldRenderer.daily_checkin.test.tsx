jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../lib/database', () => ({
  // Plan items (editable_steps) — required because FieldRenderer imports them at module-level
  getAllPlanItemsForModule: jest.fn().mockResolvedValue([]),
  savePlanItem: jest.fn().mockResolvedValue(undefined),
  deletePlanItem: jest.fn().mockResolvedValue(undefined),
  // Cognitive saturation — same reason
  getAllCognitiveSaturationSessions: jest.fn().mockResolvedValue([]),
  saveCognitiveSaturationSession: jest.fn().mockResolvedValue(undefined),
  deleteCognitiveSaturationSession: jest.fn().mockResolvedValue(undefined),
  // Daily entries — the layout under test
  getDailyEntry: jest.fn().mockResolvedValue(null),
  getAllDailyEntries: jest.fn().mockResolvedValue([]),
  saveDailyEntry: jest.fn().mockResolvedValue(undefined),
  deleteDailyEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id-daily-1'),
}))

jest.mock('../../lib/dateUtils', () => ({
  formatDateTime: (str: string) => str,
  formatDateFull: (str: string) => `full:${str}`,
  formatDateNumeric: (str: string) => `num:${str}`,
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

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../lib/database'
import * as engagement from '../../services/engagementService'
import type { ContentField } from '../../services/moduleService'

jest.setTimeout(15000)

// ─── Données de test ──────────────────────────────────────────────────────────

function makeField(overrides: Partial<ContentField>): ContentField {
  return {
    id: overrides.id ?? 'field-id',
    module_id: 'medication_adherence',
    section_id: null,
    parent_field_id: null,
    field_type: overrides.field_type ?? 'daily_checkin_config',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: [],
  }
}

const MOCK_FIELDS: ContentField[] = [
  makeField({ id: 'cfg',           field_type: 'daily_checkin_config',         sort_order: 0,   props: { engagement_event_type: 'SAVE_MEDICATION_ADHERENCE' } }),
  makeField({ id: 'tab_today',     field_type: 'daily_tab_today_label',         sort_order: 5,   text_code: 'modules.medication_adherence.tab_today' }),
  makeField({ id: 'tab_history',   field_type: 'daily_tab_history_label',       sort_order: 6,   text_code: 'modules.medication_adherence.tab_history' }),
  makeField({ id: 'today_lbl',     field_type: 'daily_today_label',             sort_order: 10,  text_code: 'modules.medication_adherence.today_label' }),
  makeField({ id: 'already_saved', field_type: 'daily_already_saved_label',     sort_order: 11,  text_code: 'modules.medication_adherence.already_saved' }),
  makeField({ id: 'question',      field_type: 'daily_question',                sort_order: 20,  text_code: 'modules.medication_adherence.intro' }),
  makeField({ id: 'opt_taken',     field_type: 'daily_status_option',           sort_order: 30,  text_code: 'modules.medication_adherence.status_taken',   props: { value: 'taken',   icon: 'check-circle-outline', color: '#10B981', bg_color: '#ECFDF5' } }),
  makeField({ id: 'opt_partial',   field_type: 'daily_status_option',           sort_order: 31,  text_code: 'modules.medication_adherence.status_partial', props: { value: 'partial', icon: 'circle-half-full',     color: '#F59E0B', bg_color: '#FFFBEB' } }),
  makeField({ id: 'opt_missed',    field_type: 'daily_status_option',           sort_order: 32,  text_code: 'modules.medication_adherence.status_missed',  props: { value: 'missed',  icon: 'circle-outline',       color: '#6B7280', bg_color: '#F3F4F6' } }),
  makeField({ id: 'notes_lbl',     field_type: 'daily_notes_label',             sort_order: 40,  text_code: 'common.notes_optional' }),
  makeField({ id: 'notes_ph',      field_type: 'daily_notes_placeholder',       sort_order: 41,  text_code: 'modules.medication_adherence.notes_placeholder' }),
  makeField({ id: 'save_lbl',      field_type: 'daily_save_label',              sort_order: 50,  text_code: 'modules.medication_adherence.save' }),
  makeField({ id: 'update_lbl',    field_type: 'daily_update_label',            sort_order: 51,  text_code: 'common.update' }),
  makeField({ id: 'empty',         field_type: 'daily_history_empty_text',      sort_order: 60,  text_code: 'modules.medication_adherence.empty_history' }),
  makeField({ id: 'miss_title',    field_type: 'daily_status_missing_title',    sort_order: 70,  text_code: 'modules.medication_adherence.status_missing' }),
  makeField({ id: 'miss_msg',      field_type: 'daily_status_missing_msg',      sort_order: 71,  text_code: 'modules.medication_adherence.status_missing_msg' }),
  makeField({ id: 'del_title',     field_type: 'daily_delete_title',            sort_order: 72,  text_code: 'modules.medication_adherence.delete_entry_title' }),
  makeField({ id: 'saved_msg',     field_type: 'daily_saved_message',           sort_order: 73,  text_code: 'modules.medication_adherence.saved_message' }),
]

const TODAY = new Date().toISOString().slice(0, 10)

function renderLayout() {
  return render(
    <FieldRenderer
      preview_kind="daily_checkin"
      fields={MOCK_FIELDS}
      moduleId="medication_adherence"
    />
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FieldRenderer — daily_checkin (DailyCheckinLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getDailyEntry as jest.Mock).mockResolvedValue(null)
    ;(database.getAllDailyEntries as jest.Mock).mockResolvedValue([])
  })

  it('charge les données du module au montage', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getDailyEntry).toHaveBeenCalledWith('medication_adherence', TODAY)
      expect(database.getAllDailyEntries).toHaveBeenCalledWith('medication_adherence', 30)
    })
  })

  it('affiche les onglets Aujourd\'hui et Historique', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('tab-today')).toBeTruthy())
    expect(screen.getByTestId('tab-history')).toBeTruthy()
  })

  it('affiche les 3 boutons de statut sur l\'onglet Aujourd\'hui', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('status-taken')).toBeTruthy())
    expect(screen.getByTestId('status-partial')).toBeTruthy()
    expect(screen.getByTestId('status-missed')).toBeTruthy()
  })

  it('affiche le bouton de sauvegarde sur l\'onglet Aujourd\'hui', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('save-button')).toBeTruthy())
  })

  it('alerte et n\'enregistre pas si aucun statut n\'est sélectionné', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('save-button')).toBeTruthy())
    fireEvent.press(screen.getByTestId('save-button'))

    await waitFor(() => expect(alertSpy).toHaveBeenCalled())
    expect(database.saveDailyEntry).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it('enregistre une nouvelle saisie avec le statut sélectionné et appelle logEvent', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('status-taken')).toBeTruthy())

    fireEvent.press(screen.getByTestId('status-taken'))
    fireEvent.changeText(screen.getByTestId('notes-input'), 'tout va bien')
    fireEvent.press(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(database.saveDailyEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          module_id: 'medication_adherence',
          date: TODAY,
          status: 'taken',
          notes: 'tout va bien',
        })
      )
    })
    expect(engagement.logEvent).toHaveBeenCalledWith(
      'patient-test-id',
      'SAVE_MEDICATION_ADHERENCE',
      {}
    )
  })

  it('pré-remplit le statut et les notes si une saisie existe pour aujourd\'hui', async () => {
    ;(database.getDailyEntry as jest.Mock).mockResolvedValue({
      id: 'existing-1',
      module_id: 'medication_adherence',
      date: TODAY,
      status: 'partial',
      notes: 'oubli matin',
      created_at: '2026-05-06T08:00:00Z',
    })
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('already-saved-badge')).toBeTruthy())
    expect(screen.getByDisplayValue('oubli matin')).toBeTruthy()
  })

  it('bascule sur l\'onglet Historique', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('tab-history')).toBeTruthy())

    fireEvent.press(screen.getByTestId('tab-history'))
    await waitFor(() => expect(screen.getByTestId('history-empty')).toBeTruthy())
  })

  it('affiche les entrées d\'historique', async () => {
    ;(database.getAllDailyEntries as jest.Mock).mockResolvedValue([
      { id: 'h1', module_id: 'medication_adherence', date: '2026-05-05', status: 'taken',   notes: null,            created_at: '2026-05-05T08:00:00Z' },
      { id: 'h2', module_id: 'medication_adherence', date: '2026-05-04', status: 'missed',  notes: 'voyage',        created_at: '2026-05-04T08:00:00Z' },
    ])
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('tab-history')).toBeTruthy())
    fireEvent.press(screen.getByTestId('tab-history'))

    await waitFor(() => expect(screen.getByTestId('history-h1')).toBeTruthy())
    expect(screen.getByTestId('history-h2')).toBeTruthy()
    expect(screen.getByText('voyage')).toBeTruthy()
  })

  it('supprime une entrée via le bouton poubelle après confirmation', async () => {
    ;(database.getAllDailyEntries as jest.Mock).mockResolvedValue([
      { id: 'h1', module_id: 'medication_adherence', date: '2026-05-05', status: 'taken', notes: null, created_at: '2026-05-05T08:00:00Z' },
    ])
    let capturedDestructive: (() => Promise<void>) | undefined
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = (buttons ?? []).find(b => b.style === 'destructive')
      capturedDestructive = destructive?.onPress as () => Promise<void>
    })

    renderLayout()
    await waitFor(() => expect(screen.getByTestId('tab-history')).toBeTruthy())
    fireEvent.press(screen.getByTestId('tab-history'))
    await waitFor(() => expect(screen.getByTestId('delete-h1')).toBeTruthy())

    fireEvent.press(screen.getByTestId('delete-h1'))
    expect(capturedDestructive).toBeDefined()
    await act(async () => { await capturedDestructive!() })

    expect(database.deleteDailyEntry).toHaveBeenCalledWith('h1')
    await waitFor(() => expect(screen.queryByTestId('history-h1')).toBeNull())
  })
})
