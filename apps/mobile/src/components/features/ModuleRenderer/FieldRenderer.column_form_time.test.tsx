jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../lib/database', () => ({
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
  generateId: jest.fn().mockReturnValue('chrono-test-id-1'),
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

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ setOptions: jest.fn() }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import type { ContentField } from '../../../services/moduleService'

jest.setTimeout(15000)

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'chronobiology_tracker',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'column_header',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

const COL_WAKE = makeField({
  id: 'chrono.wake.h', section_id: 'chrono.wake', sort_order: 10,
  text_code: 'modules.chronobiology_tracker.col_wake',
  props: { color: '#F59E0B', step_number: '1' },
  children: [
    makeField({
      id: 'chrono.wake.t', section_id: 'chrono.wake', parent_field_id: 'chrono.wake.h',
      field_type: 'column_time_field', sort_order: 11,
      text_code: 'modules.chronobiology_tracker.label_wake',
      props: { key: 'wake_time', optional: '1' },
    }),
  ],
})

const COL_BED = makeField({
  id: 'chrono.bed.h', section_id: 'chrono.bed', sort_order: 50,
  text_code: 'modules.chronobiology_tracker.col_bed',
  props: { color: '#8B5CF6', step_number: '5' },
  children: [
    makeField({
      id: 'chrono.bed.t', section_id: 'chrono.bed', parent_field_id: 'chrono.bed.h',
      field_type: 'column_time_field', sort_order: 51,
      text_code: 'modules.chronobiology_tracker.label_bed',
      props: { key: 'bedtime', optional: '1' },
    }),
  ],
})

const MOCK_FIELDS: ContentField[] = [
  makeField({
    id: 'chrono.cfg', field_type: 'column_form_config', sort_order: 0,
    props: {},
  }),
  makeField({ id: 'chrono.new_btn', field_type: 'column_form_new_btn_label', sort_order: 1, text_code: 'modules.chronobiology_tracker.new' }),
  COL_WAKE, COL_BED,
]

const MOCK_ENTRY: database.FormEntry = {
  id: 'chrono-entry-1',
  module_id: 'chronobiology_tracker',
  values: { wake_time: '07:30', bedtime: '23:15' },
  created_at: '2026-05-05T10:00:00Z',
}

function renderLayout() {
  return render(
    <FieldRenderer
      preview_kind="column_form"
      fields={MOCK_FIELDS}
      moduleId="chronobiology_tracker"
    />
  )
}

describe('FieldRenderer — column_form (column_time_field)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('rend un placeholder pour un champ horaire vide en mode entry', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    expect(await screen.findByTestId('time-wake_time')).toBeTruthy()
    expect(screen.getByTestId('time-wake_time-button')).toBeTruthy()
    // Pas de bouton clear quand la valeur est vide
    expect(screen.queryByTestId('time-wake_time-clear')).toBeNull()
  })

  it('affiche les valeurs HH:MM en mode list', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    expect(await screen.findByTestId('record-chrono-entry-1')).toBeTruthy()
    expect(screen.getByTestId('record-time-wake_time')).toBeTruthy()
    expect(screen.getByTestId('record-time-bedtime')).toBeTruthy()
    expect(screen.getByText(/07:30/)).toBeTruthy()
    expect(screen.getByText(/23:15/)).toBeTruthy()
  })

  it('affiche le bouton clear quand le champ optionnel a une valeur (mode edit)', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    fireEvent.press(await screen.findByTestId(`edit-${MOCK_ENTRY.id}`))
    await waitFor(() => expect(screen.getByTestId('time-wake_time-clear')).toBeTruthy())
  })

  it('persiste la valeur HH:MM lorsque la saisie est sauvegardée', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    fireEvent.press(await screen.findByTestId(`edit-${MOCK_ENTRY.id}`))
    await waitFor(() => expect(screen.getByTestId('save-entry')).toBeTruthy())
    await act(async () => {
      fireEvent.press(screen.getByTestId('save-entry'))
    })
    await waitFor(() => expect(database.saveFormEntry).toHaveBeenCalled())
    const call = (database.saveFormEntry as jest.Mock).mock.calls[0][0]
    expect(call.values.wake_time).toBe('07:30')
    expect(call.values.bedtime).toBe('23:15')
  })

  it('vide la valeur quand on tape sur le bouton clear', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    fireEvent.press(await screen.findByTestId(`edit-${MOCK_ENTRY.id}`))
    await waitFor(() => expect(screen.getByTestId('time-wake_time-clear')).toBeTruthy())
    fireEvent.press(screen.getByTestId('time-wake_time-clear'))
    // Après clear, le bouton ne doit plus exister (valeur vide)
    await waitFor(() => expect(screen.queryByTestId('time-wake_time-clear')).toBeNull())
    // Sauvegarde et vérifie
    await act(async () => {
      fireEvent.press(screen.getByTestId('save-entry'))
    })
    await waitFor(() => expect(database.saveFormEntry).toHaveBeenCalled())
    const call = (database.saveFormEntry as jest.Mock).mock.calls[0][0]
    expect(call.values.wake_time).toBe('')
  })

  it('initialise le champ optionnel à vide pour une nouvelle saisie', async () => {
    renderLayout()
    await waitFor(() => expect(database.getAllFormEntries).toHaveBeenCalled())
    fireEvent.press(screen.getByTestId('new-entry'))
    // Aucun bouton clear (aucune valeur initiale)
    expect(screen.queryByTestId('time-wake_time-clear')).toBeNull()
    expect(screen.queryByTestId('time-bedtime-clear')).toBeNull()
    await act(async () => {
      fireEvent.press(screen.getByTestId('save-entry'))
    })
    await waitFor(() => expect(database.saveFormEntry).toHaveBeenCalled())
    const call = (database.saveFormEntry as jest.Mock).mock.calls[0][0]
    expect(call.values.wake_time).toBe('')
    expect(call.values.bedtime).toBe('')
  })
})

const FIELDS_WITH_PREFILL: ContentField[] = [
  makeField({
    id: 'chrono.cfg', field_type: 'column_form_config', sort_order: 0,
    props: { prefill_from_last: 'common.prefill_from_last' },
  }),
  COL_WAKE, COL_BED,
]

function renderWithPrefill() {
  return render(
    <FieldRenderer preview_kind="column_form" fields={FIELDS_WITH_PREFILL} moduleId="chronobiology_tracker" />
  )
}

describe('column_form — capture anti-friction « comme d\'habitude »', () => {
  beforeEach(() => jest.clearAllMocks())

  it('n\'affiche pas le bouton de préremplissage sans saisie précédente', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
    renderWithPrefill()
    fireEvent.press(await screen.findByTestId('new-entry'))
    expect(screen.queryByTestId('prefill-from-last')).toBeNull()
  })

  it('préremplit depuis la dernière saisie et enregistre une nouvelle entrée', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderWithPrefill()
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.press(await screen.findByTestId('prefill-from-last'))
    // Les valeurs sont remplies → le bouton clear du champ horaire apparaît.
    await waitFor(() => expect(screen.getByTestId('time-wake_time-clear')).toBeTruthy())
    await act(async () => { fireEvent.press(screen.getByTestId('save-entry')) })
    await waitFor(() => expect(database.saveFormEntry).toHaveBeenCalled())
    const call = (database.saveFormEntry as jest.Mock).mock.calls[0][0]
    expect(call.values.wake_time).toBe('07:30')
    expect(call.values.bedtime).toBe('23:15')
    expect(call.id).toBe('chrono-test-id-1') // nouvelle entrée, pas l'id de la précédente
  })

  it('masque le bouton en mode édition d\'une entrée existante', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderWithPrefill()
    fireEvent.press(await screen.findByTestId(`edit-${MOCK_ENTRY.id}`))
    await waitFor(() => expect(screen.getByTestId('save-entry')).toBeTruthy())
    expect(screen.queryByTestId('prefill-from-last')).toBeNull()
  })
})
