import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { fetchModulePreviewKind, fetchPsychoCards } from './moduleService'

// Note : fetchModuleFields est testé dans @psytool/shared (packages/shared/src/services/moduleFields.test.ts)
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

describe('moduleService.fetchPsychoCards', () => {
  it('mappe les rows vers { id, titleKey, summaryKey } (summary dérivé du title)', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({
        data: [
          { id: 'f-1', section_id: 'card_a', text_code: 'modules.psychoeducation.card_a.title' },
          { id: 'f-2', section_id: null,    text_code: 'modules.psychoeducation.card_b.title' },
        ],
        error: null,
      }) as never
    )

    const result = await fetchPsychoCards()

    expect(result).toEqual([
      { id: 'card_a', titleKey: 'modules.psychoeducation.card_a.title', summaryKey: 'modules.psychoeducation.card_a.summary' },
      { id: 'f-2',    titleKey: 'modules.psychoeducation.card_b.title', summaryKey: 'modules.psychoeducation.card_b.summary' },
    ])
  })

  it('retourne [] si data null', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchPsychoCards()

    expect(result).toEqual([])
  })
})
