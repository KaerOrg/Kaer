import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NotificationRoutine } from '../../../lib/database.types'
import { renderWithClient } from '../../../test/renderWithClient'
import { NotificationRoutinePanel } from './NotificationRoutinePanel'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockGet = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
vi.mock('@services/notificationRoutineService', () => ({
  getRoutinesForPatientModule: (id: string) => mockGet(id),
  createRoutine: (p: unknown) => mockCreate(p),
  updateRoutine: (id: string, patch: unknown) => mockUpdate(id, patch),
  deleteRoutine: (id: string) => mockDelete(id),
}))

function routine(over: Partial<NotificationRoutine> = {}): NotificationRoutine {
  return {
    id: 'r1', patient_module_id: 'pm1', practitioner_id: 'pr1', patient_id: 'pt1',
    days_of_week: [1, 3, 5], time_of_day: '09:00', patient_time_override: null,
    practitioner_note: null, is_active: true, patient_paused: false,
    created_at: '', updated_at: '', ...over,
  }
}

function open() {
  return renderWithClient(
    <NotificationRoutinePanel
      patientModuleId="pm1" practitionerId="pr1" patientId="pt1"
      moduleLabel="Sommeil" moduleIconName="Moon"
    />,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('NotificationRoutinePanel', () => {
  it('charge et affiche les rappels existants', async () => {
    mockGet.mockResolvedValue([routine()])
    open()
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('pm1'))
    expect(await screen.findByText('09:00')).toBeInTheDocument()
  })

  it('supprime un rappel puis invalide (refetch)', async () => {
    mockGet.mockResolvedValue([routine()])
    mockDelete.mockResolvedValue(undefined)
    open()
    await screen.findByText('09:00')

    await userEvent.click(screen.getByLabelText('common.delete'))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('r1'))
    // Invalidation → un 2e fetch de la liste part après l'écriture.
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2))
  })

  it('bascule l\'état actif d\'un rappel', async () => {
    mockGet.mockResolvedValue([routine({ is_active: true })])
    mockUpdate.mockResolvedValue(routine({ is_active: false }))
    open()
    await screen.findByText('09:00')

    await userEvent.click(screen.getByLabelText('notifications.deactivate'))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('r1', { is_active: false }))
  })

  it('affiche le formulaire d\'office quand aucun rappel', async () => {
    mockGet.mockResolvedValue([])
    open()
    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    // Le libellé « jours » du formulaire est visible sans clic sur « ajouter ».
    expect(await screen.findByText('notifications.days_label')).toBeInTheDocument()
  })

  it('le préréglage « tous les jours » active les 7 jours et le bloc d\'aperçu récapitule', async () => {
    mockGet.mockResolvedValue([])
    open()
    await screen.findByText('notifications.days_label')
    // Bloc d'aperçu présent.
    expect(screen.getByText('notifications.preview')).toBeInTheDocument()
    // Préréglage « Tous les jours » → les 7 pastilles jour deviennent actives.
    await userEvent.click(screen.getByText('notifications.freq_daily'))
    const dayButtons = document.querySelectorAll('.nr-form__day--on')
    expect(dayButtons).toHaveLength(7)
  })
})
