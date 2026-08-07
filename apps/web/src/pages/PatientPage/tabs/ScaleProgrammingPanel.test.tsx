import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const saveSpy = vi.fn().mockResolvedValue({
  id: 's1', patient_id: 'p1', practitioner_id: 'pr1', module_id: 'phq9',
  mode: 'home', frequency: 'biweekly', day_of_week: 1, time_of_day: '09:00',
  ends_on: null, patient_reminder: true,
})
const fetchScheduleSpy = vi.fn().mockResolvedValue(null)
vi.mock('@services/scaleScheduleService', () => ({
  fetchScaleSchedule: (...args: unknown[]) => fetchScheduleSpy(...args),
  saveScaleSchedule: (...args: unknown[]) => saveSpy(...args),
  deleteScaleSchedule: vi.fn(),
}))

const routinesSpy = vi.fn().mockResolvedValue([])
vi.mock('@services/notificationRoutineService', () => ({
  getRoutinesForPatientModule: (...args: unknown[]) => routinesSpy(...args),
  createRoutine: vi.fn(),
  updateRoutine: vi.fn(),
  deleteRoutine: vi.fn(),
  getActivityFeed: vi.fn(),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../contexts/ToastProvider'
import { ScaleProgrammingPanel } from './ScaleProgrammingPanel'

const onRunNow = vi.fn()
const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderPanel(unlockedAtLabel: string | null = null, patientModuleId?: string) {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ToastProvider>
        <ScaleProgrammingPanel
          patientId="p1"
          practitionerId="pr1"
          moduleId="phq9"
          onRunNow={onRunNow}
          unlockedAtLabel={unlockedAtLabel}
          patientModuleId={patientModuleId}
        />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchScheduleSpy.mockResolvedValue(null)
  routinesSpy.mockResolvedValue([])
})

describe('ScaleProgrammingPanel (K-6)', () => {
  it('rend le bandeau MDR, les fréquences et les deux boutons', async () => {
    renderPanel()
    await waitFor(() => expect(screen.getByText('scales.schedule.mdr_note')).toBeInTheDocument())
    expect(screen.getByText('scales.schedule.freq_biweekly')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scales\.schedule\.save/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scales\.schedule\.run_now/ })).toBeInTheDocument()
  })

  it('« Enregistrer » persiste la programmation via le service (cadence choisie, pas de score)', async () => {
    renderPanel()
    await waitFor(() => expect(screen.getByText('scales.schedule.mdr_note')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /scales\.schedule\.save/ }))
    await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(1))
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 'p1', practitionerId: 'pr1', moduleId: 'phq9', mode: 'home', frequency: 'biweekly',
    }))
  })

  it('« Faire passer maintenant » déclenche le callback (câblage minimal K-6)', async () => {
    renderPanel()
    await waitFor(() => expect(screen.getByText('scales.schedule.mdr_note')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /scales\.schedule\.run_now/ }))
    expect(onRunNow).toHaveBeenCalledTimes(1)
  })

  it('affiche « Débloqué le » dans la fiche quand la date est fournie (K-7)', async () => {
    renderPanel('12/07/2026')
    await waitFor(() => expect(screen.getByText('scales.programmed.unlocked_on')).toBeInTheDocument())
  })
})

// ── Consigne au patient et réglages qu'il ajuste (QW-4, #421) ───────────────

describe('ScaleProgrammingPanel : consigne affichée au patient (#421)', () => {
  it('enregistre la consigne saisie, telle quelle', async () => {
    renderPanel()
    await waitFor(() => expect(screen.getByText('scales.schedule.mdr_note')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('scales.schedule.instruction_label'), {
      target: { value: "Remplissez-le la veille de chaque séance." },
    })
    fireEvent.click(screen.getByRole('button', { name: /scales\.schedule\.save/ }))

    await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(1))
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
      instruction: "Remplissez-le la veille de chaque séance.",
    }))
  })

  it('borne la consigne à deux phrases, comme la base', async () => {
    // Le champ n'est pas un canal de messagerie : rien dans l'app ne permet au patient
    // de répondre. La borne du champ doit refléter celle de la contrainte SQL.
    renderPanel()
    await waitFor(() => expect(screen.getByText('scales.schedule.mdr_note')).toBeInTheDocument())

    expect(screen.getByLabelText('scales.schedule.instruction_label'))
      .toHaveAttribute('maxlength', '280')
  })

  it('efface la consigne quand le champ est vidé, sans laisser de chaîne vide', async () => {
    // « Aucune consigne » doit avoir une seule représentation en base.
    fetchScheduleSpy.mockResolvedValue({
      id: 's1', patient_id: 'p1', practitioner_id: 'pr1', module_id: 'phq9',
      mode: 'home', frequency: 'biweekly', day_of_week: 1, time_of_day: '09:00',
      ends_on: null, patient_reminder: true, instruction: 'Ancienne consigne.',
      created_at: '2026-07-01T09:00:00Z',
    })
    renderPanel()
    await waitFor(() =>
      expect(screen.getByLabelText('scales.schedule.instruction_label')).toHaveValue('Ancienne consigne.'))

    fireEvent.change(screen.getByLabelText('scales.schedule.instruction_label'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /scales\.schedule\.save/ }))

    await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(1))
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ instruction: null }))
  })

  it('annonce que le patient peut ajuster son rappel', async () => {
    // « Cadence proposée », pas imposée : le mot doit dire la même chose des deux côtés.
    renderPanel()
    await waitFor(() =>
      expect(screen.getByText('scales.schedule.patient_can_adjust')).toBeInTheDocument())
  })

  it('montre la mise en pause décidée par le patient', async () => {
    routinesSpy.mockResolvedValue([
      { id: 'r1', patient_paused: true, patient_time_override: null },
    ])
    renderPanel(null, 'pm-1')

    await waitFor(() =>
      expect(screen.getByText('scales.schedule.patient_paused')).toBeInTheDocument())
  })

  it('montre l\'heure que le patient a décalée', async () => {
    routinesSpy.mockResolvedValue([
      { id: 'r1', patient_paused: false, patient_time_override: '21:00' },
    ])
    renderPanel(null, 'pm-1')

    await waitFor(() =>
      expect(screen.getByText('scales.schedule.patient_time_override')).toBeInTheDocument())
  })

  it('n\'affiche aucun réglage patient quand il n\'a rien changé', async () => {
    routinesSpy.mockResolvedValue([
      { id: 'r1', patient_paused: false, patient_time_override: null },
    ])
    renderPanel(null, 'pm-1')

    await waitFor(() => expect(screen.getByText('scales.schedule.mdr_note')).toBeInTheDocument())
    expect(screen.queryByText('scales.schedule.patient_paused')).not.toBeInTheDocument()
    expect(screen.queryByText('scales.schedule.patient_time_override')).not.toBeInTheDocument()
  })

  it('ne lit aucun rappel quand l\'échelle n\'est pas débloquée', async () => {
    renderPanel(null, undefined)
    await waitFor(() => expect(screen.getByText('scales.schedule.mdr_note')).toBeInTheDocument())
    expect(routinesSpy).not.toHaveBeenCalled()
  })
})
