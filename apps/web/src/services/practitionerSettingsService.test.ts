import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  fetchEnabledModules,
  saveEnabledModules,
} from './practitionerSettingsService'

function makeChain(result: { data: unknown; error?: unknown } = { data: null, error: null }) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

beforeEach(() => vi.clearAllMocks())

describe('practitionerSettingsService.fetchEnabledModules', () => {
  it("renvoie un Set quand des paramètres existent", async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { enabled_modules: ['phq9', 'gad7'] }, error: null }) as never
    )

    const result = await fetchEnabledModules('p-1')

    expect(result).toBeInstanceOf(Set)
    expect(result?.has('phq9')).toBe(true)
    expect(result?.has('gad7')).toBe(true)
  })

  it("renvoie null si aucun paramètre n'a été enregistré (= tous activés)", async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchEnabledModules('p-1')

    expect(result).toBeNull()
  })
})

describe('practitionerSettingsService.saveEnabledModules', () => {
  it('upsert avec un updated_at ISO et onConflict practitioner_id', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never)

    const result = await saveEnabledModules('p-1', new Set(['phq9', 'gad7']))

    expect(result).toEqual({ ok: true })
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        practitioner_id: 'p-1',
        enabled_modules: expect.arrayContaining(['phq9', 'gad7']),
        updated_at: expect.any(String),
      }),
      { onConflict: 'practitioner_id' }
    )
  })

  it('renvoie ok: false en cas d\'erreur', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'fail' } })
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never)

    const result = await saveEnabledModules('p-1', [])

    expect(result).toEqual({ ok: false })
  })
})
