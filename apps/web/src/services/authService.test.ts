import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  setLanguage: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}))

import { supabase } from '../lib/supabase'
import {
  fetchSessionPractitioner,
  loginWithPassword,
  registerPractitioner,
  signOut,
  updateLanguagePreference,
  updatePractitionerProfile,
} from './authService'

function chain(result: { data: unknown; error?: unknown } = { data: null, error: null }) {
  const c = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(c)
      return target[prop]
    },
  })
  return c
}

beforeEach(() => vi.clearAllMocks())

describe('authService.fetchSessionPractitioner', () => {
  it('retourne null si pas de session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as never)

    const result = await fetchSessionPractitioner()

    expect(result).toBeNull()
  })

  it('retourne le profil praticien si session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'p-1' } } },
      error: null,
    } as never)
    vi.mocked(supabase.from).mockReturnValue(
      chain({ data: { id: 'p-1', email: 'dr@t.fr' }, error: null }) as never
    )

    const result = await fetchSessionPractitioner()

    expect(result).toEqual({ id: 'p-1', email: 'dr@t.fr' })
  })
})

describe('authService.loginWithPassword', () => {
  it('renvoie une erreur générique localisée si signIn échoue', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {},
      error: { message: 'Invalid credentials' },
    } as never)

    const result = await loginWithPassword('a', 'b')

    expect(result).toEqual({ ok: false, message: 'Email ou mot de passe incorrect.' })
  })

  it("renvoie le practitioner après login réussi", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: null } as never)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'p-1' } },
      error: null,
    } as never)
    vi.mocked(supabase.from).mockReturnValue(
      chain({ data: { id: 'p-1', email: 'dr@t.fr' }, error: null }) as never
    )

    const result = await loginWithPassword('a', 'b')

    expect(result).toEqual({ ok: true, practitioner: { id: 'p-1', email: 'dr@t.fr' } })
  })
})

describe('authService.registerPractitioner', () => {
  it("propage le message d'erreur Supabase", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null },
      error: { message: 'taken' },
    } as never)

    const result = await registerPractitioner('a', 'b', 'Jean', 'IPA')

    expect(result).toEqual({ ok: false, message: 'taken' })
  })

  it('signUp + lecture du profil créé par trigger', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: 'p-1' } },
      error: null,
    } as never)
    vi.mocked(supabase.from).mockReturnValue(
      chain({ data: { id: 'p-1', name: 'Jean' }, error: null }) as never
    )

    const result = await registerPractitioner('a', 'b', 'Jean', 'IPA')

    expect(result).toEqual({ ok: true, practitioner: { id: 'p-1', name: 'Jean' } })
  })
})

describe('authService.updatePractitionerProfile', () => {
  it("renvoie l'erreur 'Non authentifié.' si pas de user", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as never)

    const result = await updatePractitionerProfile('Jean', 'IPA')

    expect(result).toEqual({ practitioner: null, error: 'Non authentifié.' })
  })

  it('met à jour et renvoie le profil', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'p-1' } },
      error: null,
    } as never)
    // 1ère call : update().eq() → erreur null
    // 2ème call : select().eq().single() → renvoie data
    let call = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      call += 1
      if (call === 1) {
        return chain({ data: null, error: null }) as never
      }
      return chain({ data: { id: 'p-1', name: 'Martin' }, error: null }) as never
    })

    const result = await updatePractitionerProfile('Martin', 'IPA')

    expect(result).toEqual({ practitioner: { id: 'p-1', name: 'Martin' }, error: null })
  })
})

describe('authService.updateLanguagePreference', () => {
  it("ne fait rien si pas d'utilisateur authentifié", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as never)
    const fromSpy = vi.mocked(supabase.from)

    await updateLanguagePreference('fr')

    expect(fromSpy).not.toHaveBeenCalled()
  })
})

describe('authService.signOut', () => {
  it('appelle supabase.auth.signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)

    await signOut()

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
