import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Practitioner } from '../lib/database.types'

interface AuthState {
  practitioner: Practitioner | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, title: string) => Promise<void>
  logout: () => Promise<void>
  loadSession: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  practitioner: null,
  loading: true,
  error: null,

  loadSession: async () => {
    set({ loading: true })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      set({ loading: false, practitioner: null })
      return
    }
    const { data } = await supabase
      .from('practitioners')
      .select('*')
      .eq('id', session.user.id)
      .single()
    set({ practitioner: data ?? null, loading: false })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: 'Email ou mot de passe incorrect.', loading: false })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }
    const { data } = await supabase
      .from('practitioners')
      .select('*')
      .eq('id', user.id)
      .single()
    set({ practitioner: data ?? null, loading: false })
  },

  register: async (email, password, name, title) => {
    set({ loading: true, error: null })
    const { data: { user }, error } = await supabase.auth.signUp({ email, password })
    if (error || !user) {
      set({ error: error?.message ?? 'Erreur lors de la création du compte.', loading: false })
      return
    }
    const { error: profileError } = await supabase.from('practitioners').insert({
      id: user.id,
      email,
      name,
      professional_title: title || null,
    })
    if (profileError) {
      set({ error: 'Compte créé mais profil non enregistré. Contactez le support.', loading: false })
      return
    }
    const { data } = await supabase.from('practitioners').select('*').eq('id', user.id).single()
    set({ practitioner: data ?? null, loading: false })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ practitioner: null })
  },

  clearError: () => set({ error: null }),
}))
