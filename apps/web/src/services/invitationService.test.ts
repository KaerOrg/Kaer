import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { signUp: vi.fn() },
    functions: { invoke: vi.fn() },
  },
}))

import { supabase } from '../lib/supabase'
import {
  fetchPendingInvitations,
  sendInvitation,
  signUpPatientFromInvitation,
  validateInvitationToken,
} from './invitationService'

function makeChain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
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

describe('invitationService.fetchPendingInvitations', () => {
  it('retourne les invitations non acceptées et non expirées triées desc', async () => {
    const rows = [{ id: 'i-1', patient_email: 'a@b.fr', patient_first_name: null, patient_last_name: null, expires_at: '2099', created_at: '2026' }]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchPendingInvitations('p-1')

    expect(result).toEqual(rows)
  })

  it('retourne [] si data null', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchPendingInvitations('p-1')

    expect(result).toEqual([])
  })
})

describe('invitationService.sendInvitation', () => {
  const draft = {
    practitionerId: 'p-1',
    email: '  Pat@T.fr ',
    firstName: ' Jean ',
    lastName: '',
    birthDate: '2000-01-01',
    sex: 'M',
    teenMode: true,
    modules: [],
  }

  it('appelle send-invitation avec un email lowercased et trim, firstName trim, modules', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true }, error: null } as never)

    await sendInvitation(draft)

    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-invitation', {
      body: expect.objectContaining({
        patient_email: 'pat@t.fr',
        first_name: 'Jean',
        last_name: null,
        birth_date: '2000-01-01',
        sex: 'M',
        teen_mode: true,
        modules: [],
      }),
    })
  })

  it("propage le code d'erreur connu (patient_already_registered)", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { context: { json: async () => ({ error: 'patient_already_registered' }) } },
    } as never)

    const result = await sendInvitation(draft)

    expect(result).toEqual({ ok: false, errorCode: 'patient_already_registered', errorMessage: 'patient_already_registered' })
  })

  it("expose un errorMessage brut pour les erreurs inconnues", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { context: { json: async () => ({ error: 'random_error' }) } },
    } as never)

    const result = await sendInvitation(draft)

    expect(result).toEqual({ ok: false, errorCode: null, errorMessage: 'random_error' })
  })

  it("retourne ok: false si data.success absent (sans erreur Supabase)", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false, error: 'oops' },
      error: null,
    } as never)

    const result = await sendInvitation(draft)

    expect(result).toEqual({ ok: false, errorCode: null, errorMessage: 'oops' })
  })
})

describe('invitationService.validateInvitationToken', () => {
  it('renvoie valid: false si pas de token', async () => {
    const result = await validateInvitationToken('')
    expect(result).toEqual({ valid: false })
  })

  it('renvoie valid: true et email si OK', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { patient_email: 'p@t.fr', expires_at: '2099-01-01', accepted_at: null }, error: null }) as never
    )

    const result = await validateInvitationToken('tok')

    expect(result).toEqual({ valid: true, email: 'p@t.fr' })
  })

  it('renvoie valid: false si déjà accepté', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { patient_email: 'p@t.fr', expires_at: '2099-01-01', accepted_at: '2026-01-01' }, error: null }) as never
    )

    const result = await validateInvitationToken('tok')

    expect(result).toEqual({ valid: false })
  })

  it('renvoie valid: false si expiré', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { patient_email: 'p@t.fr', expires_at: '2000-01-01', accepted_at: null }, error: null }) as never
    )

    const result = await validateInvitationToken('tok')

    expect(result).toEqual({ valid: false })
  })
})

describe('invitationService.signUpPatientFromInvitation', () => {
  it('appelle auth.signUp avec metadata role=patient + invitation_token', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: {}, error: null } as never)

    const result = await signUpPatientFromInvitation('p@t.fr', 'pwd', 'tok')

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'p@t.fr',
      password: 'pwd',
      options: { data: { role: 'patient', invitation_token: 'tok' } },
    })
    expect(result).toEqual({ ok: true })
  })

  it("propage le message d'erreur Supabase", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: {}, error: { message: 'taken' } } as never)

    const result = await signUpPatientFromInvitation('p@t.fr', 'pwd', 'tok')

    expect(result).toEqual({ ok: false, message: 'taken' })
  })
})
