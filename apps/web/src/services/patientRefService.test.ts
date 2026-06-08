import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { resolvePatientRef } from './patientRefService'

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

describe('patientRefService.resolvePatientRef', () => {
  it('renvoie le patient_id réel pour un token connu', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { patient_id: 'pat-1' }, error: null }) as never
    )

    const result = await resolvePatientRef('p_8Kf3aQ')

    expect(result).toBe('pat-1')
    expect(supabase.from).toHaveBeenCalledWith('practitioner_patients')
  })

  it('renvoie null pour un token inconnu (aucune ligne)', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await resolvePatientRef('p_inconnu')

    expect(result).toBeNull()
  })

  it("renvoie null pour le token d'un autre praticien (filtré par la RLS → aucune ligne)", async () => {
    // La policy ptp_practitioner (auth.uid() = practitioner_id) ne renvoie aucune
    // ligne si le praticien connecté ne possède pas cette relation : côté client,
    // c'est indiscernable d'un token inexistant.
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await resolvePatientRef('p_autrePraticien')

    expect(result).toBeNull()
  })

  it('renvoie null si Supabase remonte une erreur', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'fail' } }) as never
    )

    const result = await resolvePatientRef('p_8Kf3aQ')

    expect(result).toBeNull()
  })

  it('renvoie null pour un token vide sans requêter la base', async () => {
    const result = await resolvePatientRef('')

    expect(result).toBeNull()
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
