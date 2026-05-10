import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchModuleFields } from './moduleFields'

function makeChain(result: { data: unknown; error?: unknown } = { data: null, error: null }) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      }
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

function makeClient(): { client: SupabaseClient; from: ReturnType<typeof vi.fn> } {
  const from = vi.fn()
  const client = { from } as unknown as SupabaseClient
  return { client, from }
}

beforeEach(() => vi.clearAllMocks())

describe('fetchModuleFields (shared)', () => {
  it('hiérarchise parent → enfants et attache les props', async () => {
    const { client, from } = makeClient()
    from
      .mockReturnValueOnce(makeChain({ data: { preview_kind: 'fields' } }))
      .mockReturnValueOnce(
        makeChain({
          data: [
            { id: 'parent', module_id: 'm', section_id: null, parent_field_id: null, field_type: 'card_title', text_code: 't.parent', sort_order: 0 },
            { id: 'child', module_id: 'm', section_id: null, parent_field_id: 'parent', field_type: 'card_paragraph', text_code: 't.child', sort_order: 1 },
          ],
        })
      )
      .mockReturnValueOnce(
        makeChain({
          data: [
            { field_id: 'parent', prop_key: 'color', prop_value: '#fff' },
            { field_id: 'parent', prop_key: 'size', prop_value: 'lg' },
          ],
        })
      )

    const result = await fetchModuleFields(client, 'm')

    expect(result.preview_kind).toBe('fields')
    expect(result.fields).toHaveLength(1)
    expect(result.fields[0].id).toBe('parent')
    expect(result.fields[0].props).toEqual({ color: '#fff', size: 'lg' })
    expect(result.fields[0].children).toHaveLength(1)
    expect(result.fields[0].children[0].id).toBe('child')
  })

  it("retourne preview_kind seul quand aucun field n'existe", async () => {
    const { client, from } = makeClient()
    from
      .mockReturnValueOnce(makeChain({ data: { preview_kind: 'questionnaire' } }))
      .mockReturnValueOnce(makeChain({ data: [] }))

    const result = await fetchModuleFields(client, 'phq9')

    expect(result).toEqual({ preview_kind: 'questionnaire', fields: [] })
  })

  it("retombe sur 'coming_soon' si la table modules ne renvoie rien", async () => {
    const { client, from } = makeClient()
    from
      .mockReturnValueOnce(makeChain({ data: null }))
      .mockReturnValueOnce(makeChain({ data: [] }))

    const result = await fetchModuleFields(client, 'inconnu')

    expect(result.preview_kind).toBe('coming_soon')
    expect(result.fields).toEqual([])
  })
})
