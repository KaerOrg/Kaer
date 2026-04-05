import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing the store
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}))

import { useAuthStore } from './authStore'
import { supabase } from '../lib/supabase'

const mockPractitioner = {
  id: 'p-1',
  email: 'dr@example.com',
  name: 'Dr Dupont',
  professional_title: 'IPA',
}

function mockFrom(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  vi.mocked(supabase.from).mockReturnValue(chain as ReturnType<typeof supabase.from>)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset store state
  useAuthStore.setState({ practitioner: null, loading: true, error: null })
})

describe('authStore — loadSession', () => {
  it('charge le praticien quand une session existe', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'p-1' } } },
      error: null,
    } as never)
    mockFrom(mockPractitioner)

    await useAuthStore.getState().loadSession()

    const state = useAuthStore.getState()
    expect(state.practitioner).toEqual(mockPractitioner)
    expect(state.loading).toBe(false)
  })

  it('met practitioner à null si pas de session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)

    await useAuthStore.getState().loadSession()

    const state = useAuthStore.getState()
    expect(state.practitioner).toBeNull()
    expect(state.loading).toBe(false)
  })
})

describe('authStore — login', () => {
  it('connecte le praticien avec succès', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {},
      error: null,
    } as never)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'p-1' } },
      error: null,
    } as never)
    mockFrom(mockPractitioner)

    await useAuthStore.getState().login('dr@example.com', 'password123')

    const state = useAuthStore.getState()
    expect(state.practitioner).toEqual(mockPractitioner)
    expect(state.error).toBeNull()
    expect(state.loading).toBe(false)
  })

  it("affiche une erreur si les identifiants sont incorrects", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {},
      error: { message: 'Invalid credentials' },
    } as never)

    await useAuthStore.getState().login('wrong@example.com', 'badpassword')

    const state = useAuthStore.getState()
    expect(state.error).toBe('Email ou mot de passe incorrect.')
    expect(state.practitioner).toBeNull()
    expect(state.loading).toBe(false)
  })
})

describe('authStore — register', () => {
  it('crée un compte praticien avec succès', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: 'p-1' } },
      error: null,
    } as never)
    mockFrom(mockPractitioner)

    await useAuthStore.getState().register('dr@example.com', 'pass123', 'Dr Dupont', 'IPA')

    const state = useAuthStore.getState()
    expect(state.practitioner).toEqual(mockPractitioner)
    expect(state.error).toBeNull()
  })

  it("affiche une erreur si signUp échoue", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null },
      error: { message: 'Email déjà utilisé.' },
    } as never)

    await useAuthStore.getState().register('taken@example.com', 'pass', 'Jean', 'IPA')

    const state = useAuthStore.getState()
    expect(state.error).toBe('Email déjà utilisé.')
    expect(state.practitioner).toBeNull()
  })
})

describe('authStore — logout', () => {
  it('efface le praticien après déconnexion', async () => {
    useAuthStore.setState({ practitioner: mockPractitioner })
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().practitioner).toBeNull()
  })
})

describe('authStore — clearError', () => {
  it('réinitialise le champ error', () => {
    useAuthStore.setState({ error: 'Une erreur' })
    useAuthStore.getState().clearError()
    expect(useAuthStore.getState().error).toBeNull()
  })
})

describe('authStore — updateProfile', () => {
  it('met à jour le profil et retourne null si succès', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'p-1' } },
      error: null,
    } as never)

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockPractitioner, name: 'Dr Martin' }, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as ReturnType<typeof supabase.from>)
    // First call: update (returns no error), second call: select
    chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })

    const result = await useAuthStore.getState().updateProfile('Dr Martin', 'IPA')
    expect(result).toBeNull()
  })

  it('retourne un message si non authentifié', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never)

    const result = await useAuthStore.getState().updateProfile('Jean', 'IPA')
    expect(result).toBe('Non authentifié.')
  })
})
