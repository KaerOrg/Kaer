import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { fetchThemes, fetchLibraryTopics } from './psyeduService'

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

describe('psyeduService.fetchThemes', () => {
  it('renvoie les thèmes ordonnés', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({
        data: [
          { id: 'treatment', icon_name: 'Pill', sort_order: 1 },
          { id: 'lifestyle', icon_name: 'HeartPulse', sort_order: 2 },
        ],
        error: null,
      }) as never
    )

    const result = await fetchThemes()

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('treatment')
  })
})

describe('psyeduService.fetchLibraryTopics', () => {
  it('mappe les fiches avec clés i18n dérivées et tags regroupés', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        makeChain({
          data: [
            { id: 't1', module_key: 'diet_weight_psycho', theme_id: 'treatment', topic_key: 'general', icon_name: 'Info', sort_order: 1 },
            { id: 't2', module_key: 'psyedu_sleep', theme_id: 'lifestyle', topic_key: 'sleep_chrono', icon_name: 'Moon', sort_order: 6 },
          ],
          error: null,
        }) as never
      )
      .mockReturnValueOnce(
        makeChain({
          data: [
            { topic_id: 't1', tag_id: 'psychoeducation' },
            { topic_id: 't1', tag_id: 'adult' },
            { topic_id: 't2', tag_id: 'sleep' },
          ],
          error: null,
        }) as never
      )

    const result = await fetchLibraryTopics()

    expect(result).toEqual([
      {
        id: 't1',
        module_key: 'diet_weight_psycho',
        theme_id: 'treatment',
        topic_key: 'general',
        icon_name: 'Info',
        sort_order: 1,
        titleKey: 'diet_weight_psycho.general.title',
        summaryKey: 'diet_weight_psycho.general.summary',
        tags: ['psychoeducation', 'adult'],
      },
      {
        id: 't2',
        module_key: 'psyedu_sleep',
        theme_id: 'lifestyle',
        topic_key: 'sleep_chrono',
        icon_name: 'Moon',
        sort_order: 6,
        titleKey: 'psyedu_sleep.sleep_chrono.title',
        summaryKey: 'psyedu_sleep.sleep_chrono.summary',
        tags: ['sleep'],
      },
    ])
  })

  it('retourne [] si aucune fiche', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: [], error: null }) as never)
      .mockReturnValueOnce(makeChain({ data: [], error: null }) as never)

    const result = await fetchLibraryTopics()

    expect(result).toEqual([])
  })
})
