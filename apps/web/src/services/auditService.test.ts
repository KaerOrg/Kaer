import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { logDataAccess } from './auditService'

beforeEach(() => vi.clearAllMocks())

describe('auditService.logDataAccess', () => {
  it('appelle le RPC log_data_access avec les paramètres mappés', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await logDataAccess({
      action: 'read',
      targetTable: 'patients',
      targetId: 'pat-1',
      patientId: 'pat-1',
      metadata: { scope: 'header' },
    })

    expect(supabase.rpc).toHaveBeenCalledWith('log_data_access', {
      p_action: 'read',
      p_target_table: 'patients',
      p_target_id: 'pat-1',
      p_patient_id: 'pat-1',
      p_metadata: { scope: 'header' },
    })
  })

  it('remplace les champs optionnels manquants par null / objet vide', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await logDataAccess({ action: 'purge', targetTable: 'patient_entries' })

    expect(supabase.rpc).toHaveBeenCalledWith('log_data_access', {
      p_action: 'purge',
      p_target_table: 'patient_entries',
      p_target_id: null,
      p_patient_id: null,
      p_metadata: {},
    })
  })

  it("n'interrompt PAS l'appelant quand le RPC renvoie une erreur (best-effort)", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'rls denied' },
    } as never)

    await expect(
      logDataAccess({ action: 'read', targetTable: 'patients', patientId: 'pat-1' })
    ).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[auditService] logDataAccess a échoué :',
      'rls denied'
    )

    consoleSpy.mockRestore()
  })
})
