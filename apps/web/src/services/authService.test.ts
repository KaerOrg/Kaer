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
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(),
        listFactors: vi.fn(),
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
        unenroll: vi.fn(),
      },
    },
    from: vi.fn(),
  },
}))

import { supabase } from '../lib/supabase'
import {
  completeMfaLogin,
  enrollMfaTotp,
  fetchSessionPractitioner,
  getMfaStatus,
  loginWithPassword,
  registerPractitioner,
  signOut,
  unenrollMfa,
  updateLanguagePreference,
  updatePractitionerProfile,
  verifyMfaCode,
} from './authService'

/** Raccourci : AAL sans MFA requis (session classique). */
function noMfaAal() {
  vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
    data: { currentLevel: 'aal1', nextLevel: 'aal1', currentAuthenticationMethods: [] },
    error: null,
  } as never)
}

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

  it('retourne le profil praticien si session (sans MFA en attente)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'p-1' } } },
      error: null,
    } as never)
    noMfaAal()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'p-1' } },
      error: null,
    } as never)
    vi.mocked(supabase.from).mockReturnValue(
      chain({ data: { id: 'p-1', email: 'dr@t.fr' }, error: null }) as never
    )

    const result = await fetchSessionPractitioner()

    expect(result).toEqual({ id: 'p-1', email: 'dr@t.fr' })
  })

  it('retourne null si la session existe mais le MFA n’est pas franchi (aal1 → aal2)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'p-1' } } },
      error: null,
    } as never)
    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    } as never)
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValue({
      data: { totp: [{ id: 'f-1', status: 'verified' }], all: [], phone: [] },
      error: null,
    } as never)

    const result = await fetchSessionPractitioner()

    expect(result).toBeNull()
  })
})

describe('authService.loginWithPassword', () => {
  it('renvoie une erreur localisée si signIn échoue', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {},
      error: { message: 'Invalid credentials' },
    } as never)

    const result = await loginWithPassword('a', 'b')

    expect(result).toEqual({ status: 'error', message: 'Email ou mot de passe incorrect.' })
  })

  it('renvoie le practitioner après login réussi sans MFA', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: null } as never)
    noMfaAal()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'p-1' } },
      error: null,
    } as never)
    vi.mocked(supabase.from).mockReturnValue(
      chain({ data: { id: 'p-1', email: 'dr@t.fr' }, error: null }) as never
    )

    const result = await loginWithPassword('a', 'b')

    expect(result).toEqual({ status: 'success', practitioner: { id: 'p-1', email: 'dr@t.fr' } })
  })

  it('renvoie mfa_required + factorId si un facteur TOTP est vérifié', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: null } as never)
    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    } as never)
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValue({
      data: { totp: [{ id: 'factor-9', status: 'verified' }], all: [], phone: [] },
      error: null,
    } as never)

    const result = await loginWithPassword('a', 'b')

    expect(result).toEqual({ status: 'mfa_required', factorId: 'factor-9' })
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

describe('authService — MFA', () => {
  it('enrollMfaTotp renvoie factorId + qrCode + secret', async () => {
    vi.mocked(supabase.auth.mfa.enroll).mockResolvedValue({
      data: { id: 'f-1', totp: { qr_code: 'data:image/svg', secret: 'ABCD1234', uri: 'otpauth://' } },
      error: null,
    } as never)

    const result = await enrollMfaTotp()

    expect(result).toEqual({ ok: true, factorId: 'f-1', qrCode: 'data:image/svg', secret: 'ABCD1234' })
  })

  it('enrollMfaTotp renvoie ok:false en cas d’erreur', async () => {
    vi.mocked(supabase.auth.mfa.enroll).mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    } as never)

    const result = await enrollMfaTotp()

    expect(result).toEqual({ ok: false, message: 'boom' })
  })

  it('verifyMfaCode enchaîne challenge puis verify (succès)', async () => {
    vi.mocked(supabase.auth.mfa.challenge).mockResolvedValue({ data: { id: 'c-1' }, error: null } as never)
    vi.mocked(supabase.auth.mfa.verify).mockResolvedValue({ data: {}, error: null } as never)

    const result = await verifyMfaCode('f-1', '123456')

    expect(supabase.auth.mfa.challenge).toHaveBeenCalledWith({ factorId: 'f-1' })
    expect(supabase.auth.mfa.verify).toHaveBeenCalledWith({
      factorId: 'f-1',
      challengeId: 'c-1',
      code: '123456',
    })
    expect(result).toEqual({ ok: true })
  })

  it('verifyMfaCode renvoie ok:false si le code est invalide', async () => {
    vi.mocked(supabase.auth.mfa.challenge).mockResolvedValue({ data: { id: 'c-1' }, error: null } as never)
    vi.mocked(supabase.auth.mfa.verify).mockResolvedValue({
      data: null,
      error: { message: 'invalid code' },
    } as never)

    const result = await verifyMfaCode('f-1', '000000')

    expect(result).toEqual({ ok: false, message: 'invalid code' })
  })

  it('getMfaStatus renvoie enabled:true quand un facteur TOTP est vérifié', async () => {
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValue({
      data: { totp: [{ id: 'f-1', status: 'verified' }], all: [], phone: [] },
      error: null,
    } as never)

    const result = await getMfaStatus()

    expect(result).toEqual({ enabled: true, factorId: 'f-1' })
  })

  it('getMfaStatus renvoie enabled:false si aucun facteur vérifié', async () => {
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValue({
      data: { totp: [{ id: 'f-1', status: 'unverified' }], all: [], phone: [] },
      error: null,
    } as never)

    const result = await getMfaStatus()

    expect(result).toEqual({ enabled: false, factorId: null })
  })

  it('unenrollMfa propage le succès', async () => {
    vi.mocked(supabase.auth.mfa.unenroll).mockResolvedValue({ data: {}, error: null } as never)

    const result = await unenrollMfa('f-1')

    expect(supabase.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'f-1' })
    expect(result).toEqual({ ok: true })
  })

  it('completeMfaLogin charge le practitioner après vérification réussie', async () => {
    vi.mocked(supabase.auth.mfa.challenge).mockResolvedValue({ data: { id: 'c-1' }, error: null } as never)
    vi.mocked(supabase.auth.mfa.verify).mockResolvedValue({ data: {}, error: null } as never)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'p-1' } },
      error: null,
    } as never)
    vi.mocked(supabase.from).mockReturnValue(
      chain({ data: { id: 'p-1', email: 'dr@t.fr' }, error: null }) as never
    )

    const result = await completeMfaLogin('f-1', '123456')

    expect(result).toEqual({ status: 'success', practitioner: { id: 'p-1', email: 'dr@t.fr' } })
  })

  it('completeMfaLogin renvoie une erreur si le code est invalide', async () => {
    vi.mocked(supabase.auth.mfa.challenge).mockResolvedValue({ data: { id: 'c-1' }, error: null } as never)
    vi.mocked(supabase.auth.mfa.verify).mockResolvedValue({
      data: null,
      error: { message: 'invalid' },
    } as never)

    const result = await completeMfaLogin('f-1', '000000')

    expect(result).toEqual({ status: 'error', message: 'invalid' })
  })
})
