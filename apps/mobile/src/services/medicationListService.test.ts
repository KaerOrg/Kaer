jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { supabase } from '../lib/supabase'
import { fetchMedications, updateMedications } from './medicationListService'
import type { Medication } from '@psytool/shared'

// Chaîne Supabase factice : `.select().eq().eq().maybeSingle()` résout { data },
// et `.update().eq().eq()` (thenable) résout { error }.
function makeChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain.select = jest.fn(() => chain)
  chain.update = jest.fn(() => chain)
  chain.eq = jest.fn(() => chain)
  chain.maybeSingle = jest.fn().mockResolvedValue({ data })
  chain.then = (resolve: (v: unknown) => unknown) => resolve({ error })
  return chain
}

const MED: Medication = { id: 'm1', name: 'Sertraline', posology: '50 mg matin', kind: 'maintenance' }

beforeEach(() => jest.clearAllMocks())

describe('medicationListService', () => {
  it('fetchMedications retourne la liste depuis patient_modules.config.medications', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ config: { medications: [MED] } }) as never)
    const result = await fetchMedications('patient-1')
    expect(result).toEqual([MED])
  })

  it('fetchMedications retourne [] si aucune config / médicaments', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ config: {} }) as never)
    expect(await fetchMedications('patient-1')).toEqual([])
    jest.mocked(supabase.from).mockReturnValue(makeChain(null) as never)
    expect(await fetchMedications('patient-1')).toEqual([])
  })

  it('updateMedications préserve le reste de la config et écrit medications', async () => {
    const chain = makeChain({ config: { tracked_effects: ['x'] } })
    jest.mocked(supabase.from).mockReturnValue(chain as never)
    const result = await updateMedications('patient-1', [MED])
    expect(result).toEqual({ ok: true })
    expect(chain.update).toHaveBeenCalledWith({ config: { tracked_effects: ['x'], medications: [MED] } })
  })

  it('updateMedications retourne ok:false en cas d\'erreur Supabase', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ config: {} }, { message: 'denied' }) as never)
    expect(await updateMedications('patient-1', [MED])).toEqual({ ok: false })
  })
})
