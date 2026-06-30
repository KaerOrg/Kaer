const mockGetDailyEntry = jest.fn()
const mockGetAllDailyEntries = jest.fn()
jest.mock('../../../../../lib/database', () => ({
  getDailyEntry: (...a: unknown[]) => mockGetDailyEntry(...a),
  getAllDailyEntries: (...a: unknown[]) => mockGetAllDailyEntries(...a),
  generateId: () => 'gen-id-1',
}))

const mockSaveDailyEntry = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/dailyEntryService', () => ({
  saveDailyEntry: (...a: unknown[]) => mockSaveDailyEntry(...a),
}))

const mockGetIntakes = jest.fn()
const mockSaveIntake = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/medicationIntakeService', () => ({
  getMedicationIntakes: (...a: unknown[]) => mockGetIntakes(...a),
  saveMedicationIntake: (...a: unknown[]) => mockSaveIntake(...a),
}))

const mockFetchMeds = jest.fn()
const mockUpdateMeds = jest.fn().mockResolvedValue({ ok: true })
jest.mock('@services/medicationListService', () => ({
  fetchMedications: (...a: unknown[]) => mockFetchMeds(...a),
  updateMedications: (...a: unknown[]) => mockUpdateMeds(...a),
}))

jest.mock('../../../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, teenColor: () => undefined }),
}))

jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-1' } }),
}))

const mockShowToast = jest.fn()
jest.mock('../../../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

jest.mock('../../../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: jest.fn() }),
}))

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../../../../lib/dateUtils', () => ({
  formatDateFull: (s: string) => `full:${s}`,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { MedicationTrackerLayout } from './MedicationTrackerLayout'
import { shiftDate } from './streakUtils'
import type { ContentField } from '@services/moduleService'

function field(o: Partial<ContentField>): ContentField {
  return {
    id: o.id ?? 'f', module_id: 'medication_adherence', section_id: null, parent_field_id: null,
    field_type: o.field_type ?? 'medication_tracker_config', text_code: o.text_code ?? null,
    sort_order: o.sort_order ?? 0, props: o.props ?? {}, children: [],
  }
}

const FIELDS: ContentField[] = [
  field({ id: 'cfg', field_type: 'medication_tracker_config', props: {
    tab_today_label: 'modules.medication_adherence.tab_today',
    tab_calendar_label: 'modules.medication_adherence.tab_calendar',
    tab_meds_label: 'modules.medication_adherence.tab_meds',
    today_label: 'modules.medication_adherence.today_label',
    question: 'modules.medication_adherence.intro',
    reason_prompt: 'modules.medication_adherence.reason_prompt',
    per_molecule_label: 'modules.medication_adherence.per_molecule',
    save_label: 'modules.medication_adherence.save',
    status_missing_msg: 'modules.medication_adherence.status_missing_msg',
    side_effects_bridge_label: 'modules.medication_adherence.side_effects_bridge',
    meds_add_label: 'modules.medication_adherence.meds_add',
    streak_label: 'modules.medication_adherence.streak',
    calendar_days_label: 'modules.medication_adherence.calendar_days',
    calendar_legend_label: 'modules.medication_adherence.calendar_legend',
  } }),
  field({ id: 'taken',   field_type: 'daily_status_option', sort_order: 30, text_code: 'modules.medication_adherence.status_taken',   props: { value: 'taken',   icon: 'check', color: '#10B981', bg_color: '#ECFDF5' } }),
  field({ id: 'partial', field_type: 'daily_status_option', sort_order: 31, text_code: 'modules.medication_adherence.status_partial', props: { value: 'partial', icon: 'half',  color: '#F59E0B', bg_color: '#FFFBEB' } }),
  field({ id: 'missed',  field_type: 'daily_status_option', sort_order: 32, text_code: 'modules.medication_adherence.status_missed',  props: { value: 'missed',  icon: 'circle', color: '#6B7280', bg_color: '#F3F4F6' } }),
  field({ id: 'r_forgot', field_type: 'medication_reason_option', sort_order: 40, text_code: 'modules.medication_adherence.reason_forgot', props: { value: 'forgot', icon: 'clock' } }),
  field({ id: 'r_side',   field_type: 'medication_reason_option', sort_order: 41, text_code: 'modules.medication_adherence.reason_side_effect', props: { value: 'side_effect', icon: 'pill', links_module: 'medication_side_effects' } }),
]

const TODAY = new Date().toISOString().slice(0, 10)

beforeEach(() => {
  jest.clearAllMocks()
  mockGetDailyEntry.mockResolvedValue(null)
  mockGetAllDailyEntries.mockResolvedValue([])
  mockGetIntakes.mockResolvedValue([])
  mockFetchMeds.mockResolvedValue([])
})

function renderLayout() {
  return render(<MedicationTrackerLayout fields={FIELDS} moduleId="medication_adherence" />)
}

describe('MedicationTrackerLayout', () => {
  it('charge toutes les sources au montage', async () => {
    renderLayout()
    await waitFor(() => {
      expect(mockGetDailyEntry).toHaveBeenCalledWith('medication_adherence', TODAY)
      expect(mockGetAllDailyEntries).toHaveBeenCalledWith('medication_adherence', 60)
      expect(mockGetIntakes).toHaveBeenCalledWith('medication_adherence', TODAY)
      expect(mockFetchMeds).toHaveBeenCalledWith('patient-1')
    })
  })

  it('affiche les 3 onglets', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('tab-today')).toBeTruthy())
    expect(screen.getByTestId('tab-calendar')).toBeTruthy()
    expect(screen.getByTestId('tab-meds')).toBeTruthy()
  })

  it('révèle les motifs quand le statut n\'est pas « pris »', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('status-missed')).toBeTruthy())
    expect(screen.queryByTestId('reason-forgot')).toBeNull()
    fireEvent.press(screen.getByTestId('status-missed'))
    expect(screen.getByTestId('reason-forgot')).toBeTruthy()
  })

  it('le motif « effet indésirable » affiche le pont et navigue vers le module dédié', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('status-missed')).toBeTruthy())
    fireEvent.press(screen.getByTestId('status-missed'))
    fireEvent.press(screen.getByTestId('reason-side_effect'))
    const bridge = screen.getByTestId('side-effects-bridge')
    fireEvent.press(bridge)
    expect(mockNavigate).toHaveBeenCalledWith('MedicationSideEffectsHistory')
  })

  it('enregistre le statut global et son motif', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('status-missed')).toBeTruthy())
    fireEvent.press(screen.getByTestId('status-missed'))
    fireEvent.press(screen.getByTestId('reason-forgot'))
    fireEvent.press(screen.getByTestId('save-button'))
    await waitFor(() => {
      expect(mockSaveDailyEntry).toHaveBeenCalledWith(expect.objectContaining({
        module_id: 'medication_adherence', date: TODAY, status: 'missed', reason: 'forgot',
      }))
    })
  })

  it('alerte sans enregistrer si aucun statut sélectionné', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('save-button')).toBeTruthy())
    fireEvent.press(screen.getByTestId('save-button'))
    await waitFor(() => expect(mockShowToast).toHaveBeenCalled())
    expect(mockSaveDailyEntry).not.toHaveBeenCalled()
  })

  it('onglet « Mes médicaments » : bouton d\'ajout présent', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('tab-meds')).toBeTruthy())
    fireEvent.press(screen.getByTestId('tab-meds'))
    expect(screen.getByTestId('med-add-button')).toBeTruthy()
  })

  it('détail par molécule : enregistre une prise par médicament', async () => {
    mockFetchMeds.mockResolvedValue([{ id: 'med-a', name: 'Sertraline', posology: '50mg', kind: 'maintenance' }])
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('toggle-detail')).toBeTruthy())
    fireEvent.press(screen.getByTestId('toggle-detail'))
    fireEvent.press(screen.getByTestId('mol-med-a-status-taken'))
    await waitFor(() => {
      expect(mockSaveIntake).toHaveBeenCalledWith(expect.objectContaining({
        medication_id: 'med-a', status: 'taken', module_id: 'medication_adherence',
      }))
    })
  })

  it('permet de renseigner un jour précédent via la navigation de date', async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('prev-day')).toBeTruthy())
    fireEvent.press(screen.getByTestId('prev-day'))
    const yesterday = shiftDate(TODAY, -1)
    await waitFor(() => expect(mockGetDailyEntry).toHaveBeenCalledWith('medication_adherence', yesterday))
    fireEvent.press(screen.getByTestId('status-taken'))
    fireEvent.press(screen.getByTestId('save-button'))
    await waitFor(() => {
      expect(mockSaveDailyEntry).toHaveBeenCalledWith(expect.objectContaining({ date: yesterday, status: 'taken' }))
    })
  })

  it('onglet calendrier : affiche la série de jours renseignés', async () => {
    const d1 = TODAY
    mockGetAllDailyEntries.mockResolvedValue([
      { id: 'h1', module_id: 'medication_adherence', date: d1, status: 'taken', reason: null, notes: null, created_at: `${d1}T08:00:00Z` },
    ])
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('tab-calendar')).toBeTruthy())
    fireEvent.press(screen.getByTestId('tab-calendar'))
    await waitFor(() => expect(screen.getByTestId('streak-badge')).toBeTruthy())
  })
})
