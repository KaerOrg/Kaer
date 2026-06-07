import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: vi.fn(), functions: { invoke: vi.fn() } },
}))

import { supabase } from '../lib/supabase'
import { exportPatientData, erasePatientData } from './patientDataRightsService'

beforeEach(() => vi.clearAllMocks())

describe('patientDataRightsService.exportPatientData', () => {
  it('appelle le RPC export_patient_data et renvoie les données brutes', async () => {
    const payload = { patient_id: 'p1', patient_entries: [] }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: payload, error: null } as never)

    const result = await exportPatientData('p1')

    expect(supabase.rpc).toHaveBeenCalledWith('export_patient_data', { p_patient_id: 'p1' })
    expect(result).toEqual({ ok: true, data: payload })
  })

  it('renvoie ok:false si le RPC rejette (patient d’un autre praticien)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'export_patient_data: accès refusé' },
    } as never)

    const result = await exportPatientData('p2')

    expect(result).toEqual({ ok: false, message: 'export_patient_data: accès refusé' })
  })
})

describe('patientDataRightsService.erasePatientData', () => {
  it('appelle le RPC erase_patient_data PUIS l’Edge Function delete-patient-account', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { ok: true }, error: null } as never)
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { ok: true }, error: null } as never)

    const result = await erasePatientData('p1')

    expect(supabase.rpc).toHaveBeenCalledWith('erase_patient_data', { p_patient_id: 'p1' })
    expect(supabase.functions.invoke).toHaveBeenCalledWith('delete-patient-account', {
      body: { patient_id: 'p1' },
    })
    expect(result).toEqual({ ok: true })
  })

  it('n’appelle PAS l’Edge Function si le RPC échoue', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'erase_patient_data: accès refusé' },
    } as never)

    const result = await erasePatientData('p2')

    expect(supabase.functions.invoke).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: false, message: 'erase_patient_data: accès refusé' })
  })

  it('remonte l’échec de l’Edge Function', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { ok: true }, error: null } as never)
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'delete_failed' },
    } as never)

    const result = await erasePatientData('p1')

    expect(result).toEqual({ ok: false, message: 'delete_failed' })
  })
})
