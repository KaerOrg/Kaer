import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  fetchComingSoonModuleIds,
  fetchInviteCategories,
  fetchModuleCategories,
  fetchModuleTaxonomy,
} from './moduleCatalogService'

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

describe('moduleCatalogService.fetchModuleCategories', () => {
  it('joint catégories ↔ modules par category_id et formate les clés i18n', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: [{ id: 'cat-a', sort_order: 1, icon: 'shield' }], error: null }) as never)
      .mockReturnValueOnce(makeChain({
        data: [
          { id: 'phq9', category_id: 'cat-a', sort_order: 0, icon: 'i', mobile_icon: 'mi', color: '#000' },
          { id: 'foo',  category_id: 'cat-b', sort_order: 0, icon: null, mobile_icon: null, color: null },
        ],
        error: null,
      }) as never)

    const result = await fetchModuleCategories()

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'cat-a',
      icon: 'shield',
      labelKey: 'category.cat-a.label',
      subtitleKey: 'category.cat-a.subtitle',
      modules: [{ id: 'phq9', icon: 'i', mobile_icon: 'mi', color: '#000' }],
    })
  })

  it('retourne [] si une des deux requêtes renvoie null', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: null, error: null }) as never)
      .mockReturnValueOnce(makeChain({ data: [], error: null }) as never)

    const result = await fetchModuleCategories()

    expect(result).toEqual([])
  })
})

describe('moduleCatalogService.fetchComingSoonModuleIds', () => {
  it('renvoie un Set des ids coming_soon', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: [{ id: 'a' }, { id: 'b' }], error: null }) as never
    )

    const result = await fetchComingSoonModuleIds()

    expect(result.has('a')).toBe(true)
    expect(result.has('b')).toBe(true)
  })

  it('renvoie un Set vide si data null', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchComingSoonModuleIds()

    expect(result.size).toBe(0)
  })
})

describe('moduleCatalogService.fetchInviteCategories', () => {
  it('exclut les modules is_invite_excluded et coming_soon', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: [{ id: 'cat', sort_order: 1, icon: 'shield' }], error: null }) as never)
      .mockReturnValueOnce(makeChain({
        data: [
          { id: 'phq9',  category_id: 'cat', sort_order: 0, icon: '', mobile_icon: '', color: '#000', is_invite_excluded: false, preview_kind: 'questionnaire' },
          { id: 'beta',  category_id: 'cat', sort_order: 0, icon: '', mobile_icon: '', color: '#000', is_invite_excluded: false, preview_kind: 'coming_soon' },
          { id: 'admin', category_id: 'cat', sort_order: 0, icon: '', mobile_icon: '', color: '#000', is_invite_excluded: true,  preview_kind: 'fields' },
        ],
        error: null,
      }) as never)

    const result = await fetchInviteCategories()

    expect(result).toHaveLength(1)
    expect(result[0].modules.map(m => m.id)).toEqual(['phq9'])
  })

  it("filtre les catégories sans aucun module éligible", async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: [{ id: 'cat-empty', sort_order: 1, icon: '' }], error: null }) as never)
      .mockReturnValueOnce(makeChain({
        data: [
          { id: 'a', category_id: 'cat-empty', sort_order: 0, icon: '', mobile_icon: '', color: null, is_invite_excluded: true, preview_kind: 'fields' },
        ],
        error: null,
      }) as never)

    const result = await fetchInviteCategories()

    expect(result).toEqual([])
  })
})

describe('moduleCatalogService.fetchModuleTaxonomy', () => {
  it('groupe les tags par dimension et les liaisons par module', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({
        data: [
          { id: 'indication', sort_order: 1 },
          { id: 'population', sort_order: 2 },
        ],
        error: null,
      }) as never)
      .mockReturnValueOnce(makeChain({
        data: [
          { id: 'anxiety', dimension_id: 'indication', sort_order: 10 },
          { id: 'ocd',     dimension_id: 'indication', sort_order: 20 },
          { id: 'teen',    dimension_id: 'population', sort_order: 20 },
        ],
        error: null,
      }) as never)
      .mockReturnValueOnce(makeChain({
        data: [
          { module_id: 'fear_thermometer', tag_id: 'anxiety' },
          { module_id: 'fear_thermometer', tag_id: 'ocd' },
          { module_id: 'grounding',        tag_id: 'anxiety' },
        ],
        error: null,
      }) as never)

    const result = await fetchModuleTaxonomy()

    expect(result.dimensions.map(d => d.id)).toEqual(['indication', 'population'])
    expect(result.tagsByDimension.get('indication')?.map(t => t.id)).toEqual(['anxiety', 'ocd'])
    expect(result.tagsByDimension.get('population')?.map(t => t.id)).toEqual(['teen'])
    expect(result.tagsByModule.get('fear_thermometer')).toEqual(new Set(['anxiety', 'ocd']))
    expect(result.tagsByModule.get('grounding')).toEqual(new Set(['anxiety']))
  })

  it('renvoie des structures vides si les requêtes échouent (data null)', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'boom' } }) as never)

    const result = await fetchModuleTaxonomy()

    expect(result.dimensions).toEqual([])
    expect(result.tagsByDimension.size).toBe(0)
    expect(result.tagsByModule.size).toBe(0)
  })
})
