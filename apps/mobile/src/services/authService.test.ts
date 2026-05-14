jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn(),
  },
}))

import { supabase } from '../lib/supabase'
import {
  fetchTeenContext,
  getCurrentSessionPatient,
  registerWithInvitation,
  signInWithPassword,
} from './authService'

function chainResolving(result: unknown) {
  const chain: Record<string, unknown> = {}
  const passThrough = jest.fn(() => chain)
  chain.select = passThrough
  chain.eq = passThrough
  chain.is = passThrough
  chain.gt = passThrough
  chain.update = passThrough
  chain.insert = jest.fn().mockResolvedValue(result)
  chain.single = jest.fn().mockResolvedValue(result)
  return chain
}

beforeEach(() => jest.clearAllMocks())

describe('authService.getCurrentSessionPatient', () => {
  it('retourne null si pas de session', async () => {
    jest.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as never)

    const result = await getCurrentSessionPatient()

    expect(result).toBeNull()
  })

  it('renvoie le profil patient avec avatar_url quand une session existe', async () => {
    jest.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'pat-1', email: 'p@t.fr' } } },
      error: null,
    } as never)
    ;(supabase.from as jest.Mock).mockReturnValue(
      chainResolving({ data: { avatar_url: 'https://x/y.jpg' }, error: null })
    )

    const result = await getCurrentSessionPatient()

    expect(result).toEqual({ id: 'pat-1', email: 'p@t.fr', first_name: '', last_name: '', phone: null, avatar_url: 'https://x/y.jpg' })
  })
})

describe('authService.signInWithPassword', () => {
  it("rejette si Supabase renvoie une erreur", async () => {
    jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: { message: 'bad creds' } } as never)

    await expect(signInWithPassword('a', 'b')).rejects.toThrow('bad creds')
  })

  it('résout sans erreur en cas de succès', async () => {
    jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: null } as never)

    await expect(signInWithPassword('a', 'b')).resolves.toBeUndefined()
  })
})

describe('authService.fetchTeenContext', () => {
  it('agrège teen_mode et la map de couleurs des modules', async () => {
    const ppChain = chainResolving({ data: { teen_mode: true }, error: null })
    const modsChain: Record<string, unknown> = {}
    const passThrough = jest.fn(() => modsChain)
    modsChain.select = passThrough
    // Pour `select(...)` non-promise, on doit imiter une promise.
    Object.assign(modsChain, {
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [{ id: 'a', color: '#111' }, { id: 'b', color: null }], error: null }).then(resolve),
    })
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(ppChain)
      .mockReturnValueOnce(modsChain)

    const result = await fetchTeenContext('pat-1')

    expect(result.teenMode).toBe(true)
    expect(result.moduleColors).toEqual({ a: '#111' })
  })
})

describe('authService.registerWithInvitation', () => {
  it("rejette si l'invitation est invalide ou expirée", async () => {
    ;(supabase.from as jest.Mock).mockReturnValue(
      chainResolving({ data: null, error: { message: 'expired' } })
    )

    await expect(registerWithInvitation('bad', 'pwd')).rejects.toThrow(/Code d'invitation/)
  })

  it("traverse les étapes signup → insert profil → marquer accepted_at", async () => {
    const invitationChain = chainResolving({
      data: { id: 'inv-1', patient_email: 'pat@t.fr' },
      error: null,
    })
    const patientsChain = chainResolving({ error: null })
    const updateChain = chainResolving({ error: null })
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(invitationChain)
      .mockReturnValueOnce(patientsChain)
      .mockReturnValueOnce(updateChain)

    jest.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: 'usr-1' } },
      error: null,
    } as never)

    await expect(registerWithInvitation('tok', 'pwd')).resolves.toBeUndefined()
    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'pat@t.fr', password: 'pwd' })
  })
})
