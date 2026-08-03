import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFrom = vi.fn()
vi.mock('../lib/supabase', () => ({ supabase: { from: (...a: unknown[]) => mockFrom(...a) } }))

import { toLocalIsoDate } from '@kaer/shared'
import {
  fetchCrisisPlanConfig,
  saveCrisisPlanConfig,
  markPlanReviewedToday,
} from './crisisPlanService'

function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') return (r: (v: unknown) => unknown) => Promise.resolve(result).then(r)
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchCrisisPlanConfig', () => {
  it('retourne le message praticien si présent', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: { practitioner_message: 'Bravo' } }))
    const cfg = await fetchCrisisPlanConfig('patient-1')
    expect(cfg.practitionerMessage).toBe('Bravo')
  })

  it('retourne une valeur par défaut si aucune config', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null }))
    const cfg = await fetchCrisisPlanConfig('patient-2')
    expect(cfg.practitionerMessage).toBe('')
    expect(cfg.createdWithAt).toBeNull()
    expect(cfg.lastReviewedAt).toBeNull()
  })

  it('remonte les deux dates de la relation autour du plan (PW-5)', async () => {
    mockFrom.mockReturnValueOnce(makeChain({
      data: { practitioner_message: '', created_with_at: '2026-03-12', last_reviewed_at: '2026-06-04' },
    }))
    const cfg = await fetchCrisisPlanConfig('patient-4')
    expect(cfg.createdWithAt).toBe('2026-03-12')
    expect(cfg.lastReviewedAt).toBe('2026-06-04')
  })

  it('requête à chaque appel — la déduplication est déléguée à React Query', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { practitioner_message: 'A' } }))
      .mockReturnValueOnce(makeChain({ data: { practitioner_message: 'A' } }))
    await fetchCrisisPlanConfig('patient-3')
    await fetchCrisisPlanConfig('patient-3')
    // 1 requête Supabase par appel (config) × 2 appels = 2 (aucun cache service).
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })
})

describe('saveCrisisPlanConfig', () => {
  it('retourne ok:true si succès', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }))
    const result = await saveCrisisPlanConfig('patient-1', {
      practitionerMessage: 'Test',
    })
    expect(result.ok).toBe(true)
  })

  it('retourne ok:false si erreur sur upsert config', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ error: { message: 'Permission denied' } }))
    const result = await saveCrisisPlanConfig('patient-1', {
      practitionerMessage: '',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Permission denied')
  })

  // Enregistrer un message de soutien n'est PAS une revue du plan : les deux dates ne
  // doivent pas figurer dans l'upsert, sans quoi elles seraient écrasées.
  it('n\'écrit aucune des deux dates de revue', async () => {
    const chain = makeChain({ error: null })
    mockFrom.mockReturnValueOnce(chain)
    await saveCrisisPlanConfig('patient-1', { practitionerMessage: 'Test' })

    const payload = (chain['upsert'] as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload).not.toHaveProperty('last_reviewed_at')
    expect(payload).not.toHaveProperty('created_with_at')
  })
})

describe('markPlanReviewedToday', () => {
  const today = toLocalIsoDate(new Date())

  it('écrit la revue du jour, en date LOCALE', async () => {
    const chain = makeChain({ error: null })
    mockFrom.mockReturnValueOnce(chain)
    const result = await markPlanReviewedToday('patient-1', { createdWithAt: '2026-03-12', lastReviewedAt: '2026-06-04' })

    expect(result.ok).toBe(true)
    const payload = (chain['upsert'] as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload.last_reviewed_at).toBe(today)
  })

  it('pose created_with_at à la première revue, jamais réécrit ensuite', async () => {
    const first = makeChain({ error: null })
    mockFrom.mockReturnValueOnce(first)
    await markPlanReviewedToday('patient-1', { createdWithAt: null, lastReviewedAt: null })
    expect((first['upsert'] as ReturnType<typeof vi.fn>).mock.calls[0][0].created_with_at).toBe(today)

    const later = makeChain({ error: null })
    mockFrom.mockReturnValueOnce(later)
    await markPlanReviewedToday('patient-1', { createdWithAt: '2026-03-12', lastReviewedAt: '2026-06-04' })
    expect((later['upsert'] as ReturnType<typeof vi.fn>).mock.calls[0][0].created_with_at).toBe('2026-03-12')
  })

  // Idempotence dans la journée : deux appuis ne comptent que pour une revue.
  it('ne réécrit rien quand le plan a déjà été revu aujourd\'hui', async () => {
    const result = await markPlanReviewedToday('patient-1', { createdWithAt: '2026-03-12', lastReviewedAt: today })
    expect(result.ok).toBe(true)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('retourne ok:false et le message sur erreur', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ error: { message: 'Permission denied' } }))
    const result = await markPlanReviewedToday('patient-1', { createdWithAt: null, lastReviewedAt: null })
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Permission denied')
  })
})
