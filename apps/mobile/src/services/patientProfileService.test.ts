jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { supabase } from '../lib/supabase'
import { updatePatientProfile } from './patientProfileService'

function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {}
  const pass = jest.fn(() => chain)
  chain.update = pass
  chain.eq = jest.fn().mockResolvedValue(result)
  return chain
}

beforeEach(() => jest.clearAllMocks())

describe('updatePatientProfile', () => {
  it('met à jour les champs et retourne ok', async () => {
    jest.mocked(supabase.from).mockReturnValue(makeChain({ error: null }) as never)
    const result = await updatePatientProfile('patient-1', {
      first_name: 'Marie',
      last_name: 'Dupont',
      phone: '+33612345678',
    })
    expect(result).toEqual({ ok: true })
  })

  it('trimme les espaces en début/fin', async () => {
    const chain = makeChain({ error: null })
    jest.mocked(supabase.from).mockReturnValue(chain as never)
    await updatePatientProfile('patient-1', {
      first_name: '  Marie  ',
      last_name: '  Dupont  ',
      phone: '  +33612345678  ',
    })
    expect(chain.update).toHaveBeenCalledWith({
      first_name: 'Marie',
      last_name: 'Dupont',
      phone: '+33612345678',
    })
  })

  it('stocke null si le téléphone est vide', async () => {
    const chain = makeChain({ error: null })
    jest.mocked(supabase.from).mockReturnValue(chain as never)
    await updatePatientProfile('patient-1', {
      first_name: 'Marie',
      last_name: 'Dupont',
      phone: '',
    })
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null })
    )
  })

  it("retourne ok:false en cas d'erreur Supabase", async () => {
    const chain = makeChain({ error: { message: 'permission denied' } })
    jest.mocked(supabase.from).mockReturnValue(chain as never)
    const result = await updatePatientProfile('patient-1', {
      first_name: 'Marie',
      last_name: 'Dupont',
      phone: null,
    })
    expect(result).toEqual({ ok: false, error: 'permission denied' })
  })
})
