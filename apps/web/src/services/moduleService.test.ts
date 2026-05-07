import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  fetchModuleFields,
  fetchModulePreviewKind,
  fetchPsychoCards,
} from './moduleService'

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

describe('moduleService.fetchModuleFields', () => {
  it('hiérarchise les champs parent → enfants et attache les props', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: { preview_kind: 'fields' }, error: null }) as never)
      .mockReturnValueOnce(makeChain({
        data: [
          { id: 'parent', module_id: 'm', section_id: null, parent_field_id: null, field_type: 'card_title', text_code: 't.parent', sort_order: 0 },
          { id: 'child',  module_id: 'm', section_id: null, parent_field_id: 'parent', field_type: 'card_paragraph', text_code: 't.child', sort_order: 1 },
        ],
        error: null,
      }) as never)
      .mockReturnValueOnce(makeChain({
        data: [{ field_id: 'parent', prop_key: 'color', prop_value: '#fff' }],
        error: null,
      }) as never)

    const result = await fetchModuleFields('m')

    expect(result.preview_kind).toBe('fields')
    expect(result.fields).toHaveLength(1)
    expect(result.fields[0].id).toBe('parent')
    expect(result.fields[0].props).toEqual({ color: '#fff' })
    expect(result.fields[0].children).toHaveLength(1)
    expect(result.fields[0].children[0].id).toBe('child')
  })

  it("retourne preview_kind seul quand aucun field", async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: { preview_kind: 'questionnaire' }, error: null }) as never)
      .mockReturnValueOnce(makeChain({ data: [], error: null }) as never)

    const result = await fetchModuleFields('phq9')

    expect(result).toEqual({ preview_kind: 'questionnaire', fields: [] })
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
