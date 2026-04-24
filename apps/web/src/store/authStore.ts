import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { setLanguage, type SupportedLang } from '../i18n'
import type { Practitioner } from '../lib/database.types'

interface AuthState {
  practitioner: Practitioner | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, title: string) => Promise<void>
  updateProfile: (name: string, title: string) => Promise<string | null>
  updateLanguagePreference: (lang: SupportedLang) => Promise<void>
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
    if (data?.language_preference) setLanguage(data.language_preference as SupportedLang)
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
    if (data?.language_preference) setLanguage(data.language_preference as SupportedLang)
    set({ practitioner: data ?? null, loading: false })
  },

  register: async (email, password, name, title) => {
    set({ loading: true, error: null })
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'practitioner', name, professional_title: title || null },
      },
    })
    if (error || !user) {
      set({ error: error?.message ?? 'Erreur lors de la création du compte.', loading: false })
      return
    }
    // Le trigger handle_new_user crée le profil automatiquement via les métadonnées
    const { data } = await supabase.from('practitioners').select('*').eq('id', user.id).single()
    set({ practitioner: data ?? null, loading: false })
  },

  updateLanguagePreference: async (lang) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setLanguage(lang)
    await supabase
      .from('practitioners')
      .update({ language_preference: lang } as never)
      .eq('id', user.id)
    set(state => ({
      practitioner: state.practitioner ? { ...state.practitioner, language_preference: lang } : null,
    }))
  },

  updateProfile: async (name, title) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'Non authentifié.'
    const { error } = await supabase
      .from('practitioners')
      .update({ name, professional_title: title || null } as never)
      .eq('id', user.id)
    if (error) return 'Erreur lors de la mise à jour.'
    const { data } = await supabase.from('practitioners').select('*').eq('id', user.id).single()
    if (data) set({ practitioner: data })
    return null
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ practitioner: null })
  },

  clearError: () => set({ error: null }),
}))
