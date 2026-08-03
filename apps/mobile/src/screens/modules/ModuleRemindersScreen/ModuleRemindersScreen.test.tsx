jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'pt-1' } }),
}))

const mockShowToast = jest.fn()
jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockGetRoutines = jest.fn()
const mockGetRef = jest.fn()
const mockCreate = jest.fn()
const mockDelete = jest.fn()
const mockUpdateDays = jest.fn()
const mockUpdateTime = jest.fn()
const mockPause = jest.fn()
const mockResume = jest.fn()
jest.mock('@services/notificationService', () => ({
  getRoutinesForModule: (...a: unknown[]) => mockGetRoutines(...a),
  getPatientModuleRef: (...a: unknown[]) => mockGetRef(...a),
  createPatientRoutine: (...a: unknown[]) => mockCreate(...a),
  deletePatientRoutine: (...a: unknown[]) => mockDelete(...a),
  updateRoutineDays: (...a: unknown[]) => mockUpdateDays(...a),
  updateTimeOverride: (...a: unknown[]) => mockUpdateTime(...a),
  pauseRoutine: (...a: unknown[]) => mockPause(...a),
  resumeRoutine: (...a: unknown[]) => mockResume(...a),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ModuleRemindersScreen from './ModuleRemindersScreen'

const goBack = jest.fn()
const setOptions = jest.fn()

function routine(over: Record<string, unknown> = {}) {
  return {
    id: 'r1', patient_module_id: 'pm-1', practitioner_id: 'pr-1', patient_id: 'pt-1',
    days_of_week: [1, 3, 5], time_of_day: '09:00', patient_time_override: null,
    practitioner_note: null, is_active: true, patient_paused: false,
    created_at: '', updated_at: '', ...over,
  }
}

function renderScreen() {
  const route = { params: { moduleType: 'emotion_wheel' }, key: 'k', name: 'ModuleReminders' as const }
  const navigation = { goBack, setOptions }
  // Le typage complet de react-navigation n'apporte rien au test : l'écran ne lit
  // que `route.params`, `goBack` et `setOptions`.
  return render(
    <ModuleRemindersScreen
      route={route as never}
      navigation={navigation as never}
    />
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetRef.mockResolvedValue({ id: 'pm-1', practitioner_id: 'pr-1' })
  mockGetRoutines.mockResolvedValue([routine()])
  mockDelete.mockResolvedValue(true)
  mockCreate.mockResolvedValue(routine({ id: 'r2' }))
  mockUpdateDays.mockResolvedValue(true)
  mockUpdateTime.mockResolvedValue(true)
  mockPause.mockResolvedValue(true)
  mockResume.mockResolvedValue(true)
})

describe('ModuleRemindersScreen', () => {
  it('charge les rappels du module et affiche leur heure', async () => {
    renderScreen()
    expect(await screen.findByText('09:00')).toBeTruthy()
    expect(mockGetRef).toHaveBeenCalledWith('pt-1', 'emotion_wheel')
    expect(mockGetRoutines).toHaveBeenCalledWith('pm-1')
  })

  it('les jours sont sélectionnables individuellement', async () => {
    renderScreen()
    await screen.findByText('09:00')

    // Mardi (ISO 2) n'est pas retenu au départ : un tap l'ajoute.
    fireEvent.press(screen.getByTestId('reminder-day-r1-2'))
    fireEvent.press(screen.getByTestId('reminder-save'))

    await waitFor(() => expect(mockUpdateDays).toHaveBeenCalledWith('r1', 'pt-1', [1, 2, 3, 5]))
  })

  it('n\'écrit rien quand le patient n\'a rien changé', async () => {
    renderScreen()
    await screen.findByText('09:00')

    fireEvent.press(screen.getByTestId('reminder-save'))

    await waitFor(() => expect(goBack).toHaveBeenCalled())
    expect(mockUpdateDays).not.toHaveBeenCalled()
    expect(mockUpdateTime).not.toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('met en pause depuis l\'interrupteur', async () => {
    renderScreen()
    await screen.findByText('09:00')

    fireEvent(screen.getByTestId('reminder-switch-r1'), 'valueChange', false)
    fireEvent.press(screen.getByTestId('reminder-save'))

    await waitFor(() => expect(mockPause).toHaveBeenCalledWith('r1', 'pt-1', 'emotion_wheel'))
  })

  it('ajoute un rappel, rattaché au praticien du module', async () => {
    renderScreen()
    await screen.findByText('09:00')

    fireEvent.press(screen.getByTestId('reminder-add'))
    fireEvent.press(screen.getByTestId('reminder-save'))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      patientModuleId: 'pm-1',
      patientId: 'pt-1',
      practitionerId: 'pr-1',
    })))
  })

  it('supprime un rappel', async () => {
    renderScreen()
    await screen.findByText('09:00')

    fireEvent.press(screen.getByTestId('reminder-delete-r1'))
    fireEvent.press(screen.getByTestId('reminder-save'))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('r1', 'pt-1'))
  })

  it('affiche un état vide plutôt qu\'un écran muet quand le module n\'a aucun rappel', async () => {
    mockGetRoutines.mockResolvedValue([])
    renderScreen()
    expect(await screen.findByText('notifications.reminders_empty')).toBeTruthy()
  })

  it('ne commente jamais ce que le patient a saisi', async () => {
    const { toJSON } = renderScreen()
    await screen.findByText('09:00')
    // Un écran de rappels parle d'horaires. Aucun vocabulaire d'évaluation.
    expect(JSON.stringify(toJSON())).not.toMatch(/score|niveau|progrès|régulier|bravo/i)
  })
})
