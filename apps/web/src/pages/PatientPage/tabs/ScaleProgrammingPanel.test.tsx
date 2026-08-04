import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const saveSpy = vi.fn().mockResolvedValue({
  id: 's1', patient_id: 'p1', practitioner_id: 'pr1', module_id: 'phq9',
  mode: 'home', frequency: 'biweekly', day_of_week: 1, time_of_day: '09:00',
  ends_on: null, patient_reminder: true,
})
vi.mock('@services/scaleScheduleService', () => ({
  fetchScaleSchedule: vi.fn().mockResolvedValue(null),
  saveScaleSchedule: (...args: unknown[]) => saveSpy(...args),
  deleteScaleSchedule: vi.fn(),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../contexts/ToastProvider'
import { ScaleProgrammingPanel } from './ScaleProgrammingPanel'

const onRunNow = vi.fn()
const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderPanel() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ToastProvider>
        <ScaleProgrammingPanel patientId="p1" practitionerId="pr1" moduleId="phq9" onRunNow={onRunNow} />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => vi.clearAllMocks())

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
})
