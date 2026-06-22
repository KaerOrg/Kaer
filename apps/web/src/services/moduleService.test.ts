import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { fetchModulePreviewKind } from './moduleService'

// Note : fetchModuleFields est testé dans @kaer/shared (packages/shared/src/services/moduleFields.test.ts)
// car la logique est partagée entre web et mobile via le service injecté.

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

describe('moduleService.fetchModulePreviewKind', () => {
  it("renvoie le preview_kind de la table modules", async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { preview_kind: 'questionnaire' }, error: null }) as never
    )

    const result = await fetchModulePreviewKind('phq9')

    expect(result).toBe('questionnaire')
  })

  it("retombe sur 'coming_soon' si aucune ligne", async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchModulePreviewKind('inconnu')

    expect(result).toBe('coming_soon')
  })
})
