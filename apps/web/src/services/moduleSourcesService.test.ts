import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { fetchSourcesByModule, clearModuleSourcesCache } from './moduleSourcesService'

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

beforeEach(() => {
  vi.clearAllMocks()
  clearModuleSourcesCache()
})

describe('moduleSourcesService.fetchSourcesByModule', () => {
  it('retourne les sources du module triées (happy path)', async () => {
    const rows = [
      { id: 's1', module_id: 'crisis_plan', label: 'Source A', source_type: 'guideline', url: null, evidence_grade: 'A', description: null, sort_order: 1 },
      { id: 's2', module_id: 'crisis_plan', label: 'Source B', source_type: 'rct', url: 'https://x', evidence_grade: null, description: 'desc', sort_order: 2 },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchSourcesByModule('crisis_plan')

    expect(result).toEqual(rows)
    expect(supabase.from).toHaveBeenCalledWith('module_sources')
  })

  it('retourne [] quand data est null', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchSourcesByModule('empty_module')

    expect(result).toEqual([])
  })

  it('sert le second appel depuis le cache sans re-requêter', async () => {
    const rows = [
      { id: 's1', module_id: 'phq9', label: 'Source', source_type: 'meta_analysis', url: null, evidence_grade: null, description: null, sort_order: 1 },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const first = await fetchSourcesByModule('phq9')
    const second = await fetchSourcesByModule('phq9')

    expect(first).toEqual(rows)
    expect(second).toBe(first)
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('propage l’erreur Supabase (cas d’erreur)', async () => {
    const error = new Error('rls denied')
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error }) as never)

    await expect(fetchSourcesByModule('gad7')).rejects.toThrow('rls denied')
  })

  it('clearModuleSourcesCache force un rechargement', async () => {
    const rows = [
      { id: 's1', module_id: 'gad7', label: 'Source', source_type: 'rct', url: null, evidence_grade: null, description: null, sort_order: 1 },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    await fetchSourcesByModule('gad7')
    clearModuleSourcesCache()
    await fetchSourcesByModule('gad7')

    expect(supabase.from).toHaveBeenCalledTimes(2)
  })
})
