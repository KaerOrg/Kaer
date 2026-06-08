import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { fetchAllUsers } from './adminService'

beforeEach(() => vi.clearAllMocks())

describe('adminService.fetchAllUsers', () => {
  it('appelle le RPC admin_list_users et renvoie la liste (patients + médecins)', async () => {
    const rows = [
      {
        user_id: 'p1',
        kind: 'patient',
        email: 'a@b.fr',
        display_name: 'Ada Lovelace',
        created_at: '2026-01-01T00:00:00Z',
        practitioner_names: ['Doc Gyneco'],
        is_admin: false,
      },
      {
        user_id: 'd1',
        kind: 'practitioner',
        email: 'doc@b.fr',
        display_name: 'Doc Gyneco',
        created_at: '2026-01-02T00:00:00Z',
        practitioner_names: [],
        is_admin: true,
      },
    ]
    vi.mocked(supabase.rpc).mockResolvedValue({ data: rows, error: null } as never)

    const result = await fetchAllUsers()

    expect(supabase.rpc).toHaveBeenCalledWith('admin_list_users')
    expect(result).toEqual({ ok: true, users: rows })
  })

  it('renvoie ok:false si le RPC rejette (appelant non admin)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'admin_list_users: accès refusé' },
    } as never)

    const result = await fetchAllUsers()

    expect(result).toEqual({ ok: false, message: 'admin_list_users: accès refusé' })
  })

  it('renvoie une liste vide quand le RPC ne renvoie aucune ligne', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const result = await fetchAllUsers()

    expect(result).toEqual({ ok: true, users: [] })
  })
})
