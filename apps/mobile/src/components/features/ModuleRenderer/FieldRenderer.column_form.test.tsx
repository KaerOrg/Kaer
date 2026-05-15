jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../lib/database', () => ({
  // Plan items / cognitive saturation / daily — unused here but required at module load
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
  // Form entries — under test
  getAllFormEntries: jest.fn().mockResolvedValue([]),
  saveFormEntry: jest.fn().mockResolvedValue(undefined),
  deleteFormEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-form-id-1'),
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
import * as database from '../../../lib/database'
import * as engagement from '../../../services/engagementService'
import type { ContentField } from '../../../services/moduleService'

jest.setTimeout(15000)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'beck_columns',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'column_header',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

// On reflète la structure que `fetchModuleFields` renverrait : top-level + children.
const COL1 = makeField({
  id: 'beck.col1.h', section_id: 'beck.col_situation', sort_order: 10,
  text_code: 'modules.beck_columns.entry_col_1_title',
  props: { color: '#0EA5E9', step_number: '1', hint_code: 'modules.beck_columns.entry_col_1_hint' },
  children: [
    makeField({
      id: 'beck.col1.text', section_id: 'beck.col_situation', parent_field_id: 'beck.col1.h',
      field_type: 'column_text_field', sort_order: 11,
      text_code: 'modules.beck_columns.entry_col_1_placeholder',
      props: { key: 'situation', multiline: '1', min_height: '72' },
    }),
  ],
})

const COL3 = makeField({
  id: 'beck.col3.h', section_id: 'beck.col_thought', sort_order: 30,
  text_code: 'modules.beck_columns.entry_col_3_title',
  props: { color: '#EF4444', step_number: '3', hint_code: 'modules.beck_columns.entry_col_3_hint' },
  children: [
    makeField({
      id: 'beck.col3.text', section_id: 'beck.col_thought', parent_field_id: 'beck.col3.h',
      field_type: 'column_text_field', sort_order: 31,
      text_code: 'modules.beck_columns.entry_col_3_placeholder',
      props: { key: 'automatic_thought', multiline: '1' },
    }),
    makeField({
      id: 'beck.col3.slider', section_id: 'beck.col_thought', parent_field_id: 'beck.col3.h',
      field_type: 'column_slider_field', sort_order: 32,
      text_code: 'modules.beck_columns.entry_col_3_belief',
      props: { key: 'thought_belief', min: '0', max: '100', step: '10', color: '#EF4444' },
    }),
  ],
})

const MOCK_FIELDS: ContentField[] = [
  makeField({
    id: 'beck.cfg', field_type: 'column_form_config', sort_order: 0,
    props: { engagement_event_type: 'SAVE_BECK_THOUGHT_RECORD', required_keys_any: 'situation,automatic_thought' },
  }),
  makeField({ id: 'beck.new_btn',     field_type: 'column_form_new_btn_label',    sort_order: 1, text_code: 'modules.beck_columns.new_thought' }),
  makeField({ id: 'beck.save_label',  field_type: 'column_form_save_label',       sort_order: 2, text_code: 'modules.beck_columns.save' }),
  makeField({ id: 'beck.empty_title', field_type: 'column_form_empty_title',      sort_order: 3, text_code: 'modules.beck_columns.empty_title' }),
  makeField({ id: 'beck.empty_text',  field_type: 'column_form_empty_text',       sort_order: 4, text_code: 'modules.beck_columns.intro' }),
  makeField({ id: 'beck.del_title',   field_type: 'column_form_delete_title',     sort_order: 5, text_code: 'modules.beck_columns.delete_record_title' }),
  makeField({ id: 'beck.val_title',   field_type: 'column_form_validation_title', sort_order: 6, text_code: 'modules.beck_columns.empty_alert_title' }),
  makeField({ id: 'beck.val_msg',     field_type: 'column_form_validation_msg',   sort_order: 7, text_code: 'modules.beck_columns.empty_alert_msg' }),
  COL1, COL3,
]

const MOCK_ENTRY: database.FormEntry = {
  id: 'entry-1',
  module_id: 'beck_columns',
  values: { situation: 'au travail', automatic_thought: 'je suis nul', thought_belief: 80 },
  created_at: '2026-05-05T10:00:00Z',
}

function renderLayout() {
  return render(
    <FieldRenderer
      preview_kind="column_form"
      fields={MOCK_FIELDS}
      moduleId="beck_columns"
    />
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FieldRenderer — column_form (ColumnFormLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('charge les entrées au montage', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getAllFormEntries).toHaveBeenCalledWith('beck_columns')
    })
  })

  it('affiche l\'état vide quand il n\'y a pas d\'entrée', async () => {
    renderLayout()
    expect(await screen.findByTestId('list-empty')).toBeTruthy()
  })

  it('affiche les enregistrements existants en mode liste', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    expect(await screen.findByTestId('record-entry-1')).toBeTruthy()
    expect(screen.getByText(/au travail/)).toBeTruthy()
  })

  it('passe en mode entry au tap sur Nouveau', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    expect(await screen.findByTestId('column-beck.col_situation')).toBeTruthy()
    expect(screen.getByTestId('column-beck.col_thought')).toBeTruthy()
  })

  it('rend les champs texte et sliders enfants', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    expect(screen.getByTestId('field-situation')).toBeTruthy()
    expect(screen.getByTestId('field-automatic_thought')).toBeTruthy()
    expect(screen.getByTestId('slider-thought_belief')).toBeTruthy()
  })

  it('alerte et n\'enregistre pas si aucun champ requis n\'est rempli', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.press(screen.getByTestId('save-entry'))

    await waitFor(() => expect(alertSpy).toHaveBeenCalled())
    expect(database.saveFormEntry).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it('enregistre une nouvelle entrée et appelle logEvent', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.changeText(screen.getByTestId('field-situation'), 'au bureau, lundi matin')
    fireEvent.press(screen.getByTestId('save-entry'))

    await waitFor(() => {
      expect(database.saveFormEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          module_id: 'beck_columns',
          values: expect.objectContaining({ situation: 'au bureau, lundi matin' }),
        })
      )
    })
    expect(engagement.logEvent).toHaveBeenCalledWith(
      'patient-test-id',
      'SAVE_BECK_THOUGHT_RECORD',
      {}
    )
  })

  it('édite une entrée existante sans déclencher logEvent', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-entry-1'))

    expect(screen.getByDisplayValue('au travail')).toBeTruthy()
    fireEvent.press(screen.getByTestId('save-entry'))

    await waitFor(() => {
      expect(database.saveFormEntry).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'entry-1' })
      )
    })
    expect(engagement.logEvent).not.toHaveBeenCalled()
  })

  it('annule la saisie et revient à la liste', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.press(screen.getByTestId('cancel-entry'))
    await waitFor(() => expect(screen.getByTestId('list-empty')).toBeTruthy())
  })

  it('supprime une entrée après confirmation', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    let capturedDestructive: (() => Promise<void>) | undefined
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = (buttons ?? []).find(b => b.style === 'destructive')
      capturedDestructive = destructive?.onPress as () => Promise<void>
    })

    renderLayout()
    fireEvent.press(await screen.findByTestId('delete-entry-1'))
    expect(capturedDestructive).toBeDefined()
    await act(async () => { await capturedDestructive!() })

    expect(database.deleteFormEntry).toHaveBeenCalledWith('entry-1')
    await waitFor(() => expect(screen.queryByTestId('record-entry-1')).toBeNull())
  })
})
