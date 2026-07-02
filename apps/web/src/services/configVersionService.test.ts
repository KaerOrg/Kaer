import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMaybeSingle = vi.fn()
const mockSelect = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('../lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}))

import { fetchConfigVersion } from './configVersionService'

beforeEach(() => vi.clearAllMocks())

describe('fetchConfigVersion', () => {
  it('lit le jeton depuis la ligne singleton de app_config_meta', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { config_version: 'v-2026-07-02' }, error: null })

    const version = await fetchConfigVersion()

    expect(version).toBe('v-2026-07-02')
    expect(mockFrom).toHaveBeenCalledWith('app_config_meta')
    expect(mockSelect).toHaveBeenCalledWith('config_version')
  })

  it('renvoie le jeton neutre "0" quand aucune ligne n\'existe', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    expect(await fetchConfigVersion()).toBe('0')
  })

  it('propage l\'erreur Supabase', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('boom') })

    await expect(fetchConfigVersion()).rejects.toThrow('boom')
  })
})
