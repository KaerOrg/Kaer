import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { fetchUsers, fetchPractitionerNames, type AdminUsersQuery } from './adminService'

beforeEach(() => vi.clearAllMocks())

const baseQuery: AdminUsersQuery = {
  kind: null,
  practitioner: null,
  search: null,
  sort: 'created_at',
  dir: 'desc',
  limit: 150,
  offset: 0,
}

describe('adminService.fetchUsers', () => {
  it('relaie tous les paramètres au RPC admin_list_users', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as never)

    await fetchUsers({
      kind: 'patient',
      practitioner: 'Doc Gyneco',
      search: 'ada',
      sort: 'display_name',
      dir: 'asc',
      limit: 150,
      offset: 300,
    })

    expect(supabase.rpc).toHaveBeenCalledWith('admin_list_users', {
      p_kind: 'patient',
      p_practitioner: 'Doc Gyneco',
      p_search: 'ada',
      p_sort: 'display_name',
      p_dir: 'asc',
      p_limit: 150,
      p_offset: 300,
    })
  })

  it('extrait le total depuis total_count et le retire des lignes', async () => {
    const rows = [
      {
        user_id: 'p1',
        kind: 'patient',
        email: 'a@b.fr',
        display_name: 'Ada Lovelace',
        created_at: '2026-01-01T00:00:00Z',
        practitioner_names: ['Doc Gyneco'],
        is_admin: false,
        total_count: 412,
      },
      {
        user_id: 'd1',
        kind: 'practitioner',
        email: 'doc@b.fr',
        display_name: 'Doc Gyneco',
        created_at: '2026-01-02T00:00:00Z',
        practitioner_names: [],
        is_admin: true,
        total_count: 412,
      },
    ]
    vi.mocked(supabase.rpc).mockResolvedValue({ data: rows, error: null } as never)

    const result = await fetchUsers(baseQuery)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.total).toBe(412)
    expect(result.data.users).toHaveLength(2)
    expect(result.data.users[0]).not.toHaveProperty('total_count')
    expect(result.data.users[0].display_name).toBe('Ada Lovelace')
  })

  it('renvoie un total de 0 et une liste vide quand aucune ligne', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const result = await fetchUsers(baseQuery)

    expect(result).toEqual({ ok: true, data: { users: [], total: 0 } })
  })

  it('renvoie ok:false si le RPC rejette (appelant non admin)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'admin_list_users: accès refusé' },
    } as never)

    const result = await fetchUsers(baseQuery)

    expect(result).toEqual({ ok: false, message: 'admin_list_users: accès refusé' })
  })
})

describe('adminService.fetchPractitionerNames', () => {
  it('renvoie les noms via le RPC admin_list_practitioner_names', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [{ name: 'Alice' }, { name: 'Bob' }],
      error: null,
    } as never)

    const names = await fetchPractitionerNames()

    expect(supabase.rpc).toHaveBeenCalledWith('admin_list_practitioner_names')
    expect(names).toEqual(['Alice', 'Bob'])
  })

  it('dégrade gracieusement en liste vide si le RPC échoue', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    } as never)

    expect(await fetchPractitionerNames()).toEqual([])
  })
})
