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

import { useAuthStore } from './authStore'
import { supabase } from '../lib/supabase'

function mockFrom(data: unknown, error: unknown = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error }),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
  }
  jest.mocked(supabase.from).mockReturnValue(chain as ReturnType<typeof supabase.from>)
  return chain
}

beforeEach(() => {
  jest.clearAllMocks()
  useAuthStore.setState({ patient: null, loading: true })
})

describe('authStore — loadSession', () => {
  it('charge le patient depuis la session existante', async () => {
    jest.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'pat-1', email: 'patient@example.com' } } },
      error: null,
    } as never)

    // loadSession fetches avatar_url from the patients table after getting the session
    mockFrom({ avatar_url: null })

    await useAuthStore.getState().loadSession()

    const state = useAuthStore.getState()
    expect(state.patient).toEqual({ id: 'pat-1', email: 'patient@example.com', avatar_url: null })
    expect(state.loading).toBe(false)
  })

  it('met patient à null si pas de session', async () => {
    jest.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)

    await useAuthStore.getState().loadSession()

    expect(useAuthStore.getState().patient).toBeNull()
    expect(useAuthStore.getState().loading).toBe(false)
  })
})

describe('authStore — login', () => {
  it('se connecte sans erreur', async () => {
    jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {},
      error: null,
    } as never)

    await expect(
      useAuthStore.getState().login('patient@example.com', 'pass123')
    ).resolves.not.toThrow()
  })

  it('lève une erreur si les identifiants sont invalides', async () => {
    jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    } as never)

    await expect(
      useAuthStore.getState().login('bad@example.com', 'wrong')
    ).rejects.toThrow('Invalid login credentials')
  })
})

describe('authStore — register', () => {
  it('crée un compte via invitation valide', async () => {
    const invitation = { id: 'inv-1', patient_email: 'patient@example.com', token: 'tok-abc' }

    // First call: invitations check
    const invChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      single: jest.fn().mockResolvedValue({ data: invitation, error: null }),
    }

    const patientsChain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }
    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }

    jest.mocked(supabase.from)
      .mockReturnValueOnce(invChain as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(patientsChain as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(updateChain as ReturnType<typeof supabase.from>)

    jest.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: 'pat-1' } },
      error: null,
    } as never)

    await expect(
      useAuthStore.getState().register('patient@example.com', 'pass123', 'tok-abc')
    ).resolves.not.toThrow()
  })

  it('lève une erreur si le token est invalide', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    }
    jest.mocked(supabase.from).mockReturnValue(chain as ReturnType<typeof supabase.from>)

    await expect(
      useAuthStore.getState().register('patient@example.com', 'pass', 'bad-token')
    ).rejects.toThrow("Code d'invitation invalide ou expiré")
  })
})

describe('authStore — logout', () => {
  it('appelle supabase signOut', async () => {
    jest.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)

    await useAuthStore.getState().logout()

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
