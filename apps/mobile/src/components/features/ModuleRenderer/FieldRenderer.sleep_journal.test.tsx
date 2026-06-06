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
  // Sleep diary — under test
  getAllSleepEntries: jest.fn().mockResolvedValue([]),
  getSleepEntry: jest.fn().mockResolvedValue(null),
  getSleepEntriesForMonth: jest.fn().mockResolvedValue([]),
  saveSleepEntry: jest.fn().mockResolvedValue(undefined),
  deleteSleepEntry: jest.fn().mockResolvedValue(undefined),
  computeSleepDuration: jest.requireActual('../../../lib/database').computeSleepDuration,
  computeSleepEfficiency: jest.requireActual('../../../lib/database').computeSleepEfficiency,
  generateId: jest.fn().mockReturnValue('test-sleep-id-1'),
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
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ setOptions: jest.fn() }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import { useToast } from '../../../contexts/ToastContext'
import type { ContentField } from '../../../services/moduleService'

jest.setTimeout(15000)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'sleep_diary',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'sleep_journal_config',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

// Today's "yesterday" — used for CTA test
function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

const MOCK_FIELDS: ContentField[] = [
  makeField({
    id: 'sj.cfg', field_type: 'sleep_journal_config', sort_order: 0,
    props: {
      history_days: '14',
      awakenings_max: '20',
      onset_max_minutes: '180',
      awak_duration_max_minutes: '300',
      efficiency_good: '85',
      efficiency_warning: '70',
      quality_max: '5',
      quality_good_threshold: '4',
      quality_avg_threshold: '3',
    },
  }),
  makeField({ id: 'sj.cta',           field_type: 'sleep_journal_cta_title',                 sort_order: 1,  text_code: 'modules.sleep_diary.cta_title' }),
  makeField({ id: 'sj.month_btn',     field_type: 'sleep_journal_monthly_button_label',      sort_order: 2,  text_code: 'modules.sleep_diary.monthly_button' }),
  makeField({ id: 'sj.list_header',   field_type: 'sleep_journal_list_header',               sort_order: 3,  text_code: 'modules.sleep_diary.list_header' }),
  makeField({ id: 'sj.incomplete',    field_type: 'sleep_journal_incomplete_label',          sort_order: 4,  text_code: 'modules.sleep_diary.incomplete' }),
  makeField({ id: 'sj.empty_day',     field_type: 'sleep_journal_empty_day_label',           sort_order: 5,  text_code: 'modules.sleep_diary.empty_day' }),
  makeField({ id: 'sj.sec_sched',     field_type: 'sleep_journal_section_schedule_title',    sort_order: 6,  text_code: 'modules.sleep_diary.section_schedule' }),
  makeField({ id: 'sj.sec_awak',      field_type: 'sleep_journal_section_awakenings_title',  sort_order: 7,  text_code: 'modules.sleep_diary.section_awakenings' }),
  makeField({ id: 'sj.sec_night',     field_type: 'sleep_journal_section_nightmares_title',  sort_order: 8,  text_code: 'modules.sleep_diary.section_nightmares' }),
  makeField({ id: 'sj.sec_qual',      field_type: 'sleep_journal_section_quality_title',     sort_order: 9,  text_code: 'modules.sleep_diary.section_quality' }),
  makeField({ id: 'sj.sec_notes',     field_type: 'sleep_journal_section_notes_title',       sort_order: 10, text_code: 'modules.sleep_diary.notes_label' }),
  makeField({ id: 'sj.bedtime',       field_type: 'sleep_journal_bedtime_label',             sort_order: 11, text_code: 'modules.sleep_diary.bedtime_label' }),
  makeField({ id: 'sj.wake',          field_type: 'sleep_journal_wake_time_label',           sort_order: 12, text_code: 'modules.sleep_diary.wake_time_label' }),
  makeField({ id: 'sj.onset',         field_type: 'sleep_journal_onset_label',               sort_order: 13, text_code: 'modules.sleep_diary.onset_label' }),
  makeField({ id: 'sj.awak',          field_type: 'sleep_journal_awakenings_label',          sort_order: 14, text_code: 'modules.sleep_diary.awakenings_label' }),
  makeField({ id: 'sj.awak_dur',      field_type: 'sleep_journal_awakenings_duration_label', sort_order: 15, text_code: 'modules.sleep_diary.awakenings_duration_label' }),
  makeField({ id: 'sj.night',         field_type: 'sleep_journal_nightmares_label',          sort_order: 16, text_code: 'modules.sleep_diary.nightmares_label' }),
  makeField({ id: 'sj.qual',          field_type: 'sleep_journal_quality_label',             sort_order: 17, text_code: 'modules.sleep_diary.quality_label' }),
  makeField({ id: 'sj.qual_miss_t',   field_type: 'sleep_journal_quality_missing_title',     sort_order: 18, text_code: 'modules.sleep_diary.quality_missing' }),
  makeField({ id: 'sj.qual_miss_m',   field_type: 'sleep_journal_quality_missing_msg',       sort_order: 19, text_code: 'modules.sleep_diary.quality_missing_msg' }),
  makeField({ id: 'sj.eff',           field_type: 'sleep_journal_efficiency_label',          sort_order: 20, text_code: 'modules.sleep_diary.sleep_efficiency' }),
  makeField({ id: 'sj.date',          field_type: 'sleep_journal_date_label',                sort_order: 21, text_code: 'modules.sleep_diary.date_label' }),
  makeField({ id: 'sj.save',          field_type: 'sleep_journal_save_label',                sort_order: 22, text_code: 'modules.sleep_diary.save_night' }),
  makeField({ id: 'sj.update',        field_type: 'sleep_journal_update_label',              sort_order: 23, text_code: 'modules.sleep_diary.update_entry' }),
  makeField({ id: 'sj.delete_l',      field_type: 'sleep_journal_delete_label',              sort_order: 24, text_code: 'modules.sleep_diary.delete_entry' }),
  makeField({ id: 'sj.delete_t',      field_type: 'sleep_journal_delete_title',              sort_order: 25, text_code: 'modules.sleep_diary.delete_entry' }),
  makeField({ id: 'sj.notes_ph',      field_type: 'sleep_journal_notes_placeholder',         sort_order: 26, text_code: 'modules.sleep_diary.notes_placeholder' }),
  makeField({ id: 'sj.month_summary', field_type: 'sleep_journal_month_summary_title',       sort_order: 27, text_code: 'modules.sleep_diary.month_summary' }),
  makeField({ id: 'sj.legend_title',  field_type: 'sleep_journal_legend_title',              sort_order: 28, text_code: 'modules.sleep_diary.legend' }),
  makeField({ id: 'sj.legend_good',   field_type: 'sleep_journal_legend_good_label',         sort_order: 29, text_code: 'modules.sleep_diary.legend_good' }),
  makeField({ id: 'sj.legend_avg',    field_type: 'sleep_journal_legend_average_label',      sort_order: 30, text_code: 'modules.sleep_diary.legend_average' }),
  makeField({ id: 'sj.legend_bad',    field_type: 'sleep_journal_legend_bad_label',          sort_order: 31, text_code: 'modules.sleep_diary.legend_bad' }),
  makeField({ id: 'sj.legend_empty',  field_type: 'sleep_journal_legend_empty_label',        sort_order: 32, text_code: 'modules.sleep_diary.legend_empty' }),
  makeField({ id: 'sj.legend_night',  field_type: 'sleep_journal_legend_nightmare_label',    sort_order: 33, text_code: 'modules.sleep_diary.legend_nightmare' }),
  makeField({ id: 'sj.stat_dur',      field_type: 'sleep_journal_stat_avg_duration_label',   sort_order: 34, text_code: 'modules.sleep_diary.stat_avg_duration' }),
  makeField({ id: 'sj.stat_awak',     field_type: 'sleep_journal_stat_avg_awakenings_label', sort_order: 35, text_code: 'modules.sleep_diary.stat_avg_awakenings' }),
  makeField({ id: 'sj.stat_filled',   field_type: 'sleep_journal_stat_nights_filled_label',  sort_order: 36, text_code: 'modules.sleep_diary.stat_nights_filled' }),
  makeField({ id: 'sj.stat_night',    field_type: 'sleep_journal_stat_nightmares_label',     sort_order: 37, text_code: 'modules.sleep_diary.stat_nightmares' }),
  makeField({ id: 'sj.minutes_unit',  field_type: 'sleep_journal_minutes_unit',              sort_order: 38, text_code: 'modules.sleep_diary.minutes_unit' }),
]

const MOCK_ENTRY: database.SleepEntry = {
  id: 'sleep-1',
  date: yesterdayStr(),
  bedtime: '23:00',
  wake_time: '07:00',
  sleep_onset_minutes: 15,
  awakenings: 1,
  awakenings_duration_minutes: 10,
  quality: 4,
  nightmares: 0,
  notes: 'good night',
  created_at: '2026-05-05T10:00:00Z',
}

function renderLayout() {
  return render(
    <FieldRenderer
      preview_kind="sleep_journal"
      fields={MOCK_FIELDS}
      moduleId="sleep_diary"
    />
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FieldRenderer — sleep_journal (SleepJournalLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllSleepEntries as jest.Mock).mockResolvedValue([])
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(null)
    ;(database.getSleepEntriesForMonth as jest.Mock).mockResolvedValue([])
  })

  it('charge l\'historique au montage', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getAllSleepEntries).toHaveBeenCalled()
    })
    expect(await screen.findByTestId('sleep-journal-list')).toBeTruthy()
  })

  it('affiche les 14 derniers jours dans la liste', async () => {
    renderLayout()
    await screen.findByTestId('sleep-journal-list')
    // Au moins le bouton CTA et un day-* doivent être présents
    expect(screen.getByTestId('cta-yesterday')).toBeTruthy()
    expect(screen.getByTestId('cta-month')).toBeTruthy()
    expect(screen.getByTestId(`day-${yesterdayStr()}`)).toBeTruthy()
  })

  it('passe en mode entry au tap sur le CTA', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-yesterday'))
    expect(await screen.findByTestId('sleep-journal-entry')).toBeTruthy()
    expect(database.getSleepEntry).toHaveBeenCalledWith(yesterdayStr())
  })

  it('pré-remplit le formulaire avec une entrée existante', async () => {
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(MOCK_ENTRY)
    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-yesterday'))
    await screen.findByTestId('sleep-journal-entry')
    // Le bouton de suppression apparaît seulement quand existingId est défini
    await waitFor(() => expect(screen.queryByTestId('delete-button')).toBeTruthy())
    // Le compteur d'awakenings doit refléter la valeur (1)
    expect(screen.getByTestId('awakenings-value').props.children).toBe(1)
  })

  it('affiche le score d\'efficacité du sommeil avec les valeurs par défaut', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-yesterday'))
    expect(await screen.findByTestId('sleep-efficiency')).toBeTruthy()
  })

  it('refuse de sauver sans étoiles de qualité', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-yesterday'))
    await screen.findByTestId('sleep-journal-entry')
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    expect(useToast().showToast).toHaveBeenCalled()
    expect(database.saveSleepEntry).not.toHaveBeenCalled()
  })

  it('enregistre une nouvelle entrée avec qualité', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-yesterday'))
    await screen.findByTestId('sleep-journal-entry')
    fireEvent.press(screen.getByTestId('quality-star-4'))
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })

    await waitFor(() => {
      expect(database.saveSleepEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          date: yesterdayStr(),
          quality: 4,
          bedtime: '23:00',
          wake_time: '07:00',
        })
      )
    })
  })

  it('incrémente et décrémente le compteur d\'awakenings', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-yesterday'))
    await screen.findByTestId('sleep-journal-entry')
    fireEvent.press(screen.getByTestId('awakenings-plus'))
    fireEvent.press(screen.getByTestId('awakenings-plus'))
    expect(screen.getByTestId('awakenings-value').props.children).toBe(2)
    fireEvent.press(screen.getByTestId('awakenings-minus'))
    expect(screen.getByTestId('awakenings-value').props.children).toBe(1)
  })

  it('toggle le switch nightmares', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-yesterday'))
    const toggle = await screen.findByTestId('nightmares-toggle')
    fireEvent.press(toggle)
    fireEvent.press(screen.getByTestId('quality-star-3'))
    await act(async () => { fireEvent.press(screen.getByTestId('save-button')) })
    await waitFor(() => {
      expect(database.saveSleepEntry).toHaveBeenCalledWith(
        expect.objectContaining({ nightmares: 1 })
      )
    })
  })

  it('passe en mode month et charge les entrées', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-month'))
    expect(await screen.findByTestId('sleep-journal-month')).toBeTruthy()
    await waitFor(() => {
      expect(database.getSleepEntriesForMonth).toHaveBeenCalled()
    })
  })

  it('navigue d\'un mois en arrière puis revient à la liste', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-month'))
    await screen.findByTestId('sleep-journal-month')
    fireEvent.press(screen.getByTestId('month-prev'))
    await waitFor(() => {
      // 2 calls: initial load + after prev
      expect((database.getSleepEntriesForMonth as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2)
    })
    fireEvent.press(screen.getByTestId('month-back-button'))
    await waitFor(() => expect(screen.getByTestId('sleep-journal-list')).toBeTruthy())
  })

  it('supprime une entrée existante après confirmation', async () => {
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(MOCK_ENTRY)

    renderLayout()
    fireEvent.press(await screen.findByTestId('cta-yesterday'))
    const deleteBtn = await screen.findByTestId('delete-button')
    await act(async () => { fireEvent.press(deleteBtn) })
    await waitFor(() => {
      expect(database.deleteSleepEntry).toHaveBeenCalledWith('sleep-1')
    })
  })
})
