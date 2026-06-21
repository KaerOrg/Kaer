import { vi, describe, it, expect, beforeEach } from 'vitest'

const fetchMedications = vi.fn()
const updateMedications = vi.fn()

vi.mock('../../../services/moduleAssignmentService', () => ({
  fetchMedications: (...a: unknown[]) => fetchMedications(...a),
  updateMedications: (...a: unknown[]) => updateMedications(...a),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useMedicationListEditor } from './useMedicationListEditor'
import type { PatientModule } from '../../../lib/database.types'

const modules: PatientModule[] = [{
  id: 'pm1',
  patient_id: 'pat-1',
  practitioner_id: 'prac-1',
  module_type: 'medication_adherence',
  config: {},
  unlocked_at: '2026-06-01T00:00:00Z',
}]
const onReload = vi.fn().mockResolvedValue(undefined)

const MED = { id: 'm1', name: 'Sertraline', posology: '50 mg', kind: 'maintenance' as const }

describe('useMedicationListEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMedications.mockResolvedValue([MED])
    updateMedications.mockResolvedValue({ ok: true })
  })

  it('openEditor charge la liste depuis le service', async () => {
    const { result } = renderHook(() => useMedicationListEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    expect(fetchMedications).toHaveBeenCalledWith('pm1')
    expect(result.current.open).toBe(true)
    expect(result.current.medications).toEqual([MED])
  })

  it('addMedication ajoute une molécule (id généré, champs trimés) et persiste', async () => {
    const { result } = renderHook(() => useMedicationListEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    await act(async () => { result.current.addMedication({ name: '  Lithium  ', posology: ' 400 mg ', kind: 'prn' }) })
    await waitFor(() => {
      const arg = updateMedications.mock.calls.at(-1)?.[1] as { name: string; posology: string; kind: string; id: string }[]
      const added = arg.find(m => m.name === 'Lithium')
      expect(added?.posology).toBe('400 mg')
      expect(added?.kind).toBe('prn')
      expect(added?.id).toBeTruthy()
    })
  })

  it('addMedication ignore un nom vide', async () => {
    const { result } = renderHook(() => useMedicationListEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    updateMedications.mockClear()
    await act(async () => { result.current.addMedication({ name: '   ', posology: '', kind: 'maintenance' }) })
    expect(updateMedications).not.toHaveBeenCalled()
  })

  it('removeMedication retire par id et persiste', async () => {
    const { result } = renderHook(() => useMedicationListEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    await act(async () => { result.current.removeMedication('m1') })
    await waitFor(() => expect(updateMedications).toHaveBeenLastCalledWith('pm1', []))
  })
})
