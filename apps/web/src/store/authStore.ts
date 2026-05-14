import { create } from 'zustand'
import type { SupportedLang } from '../i18n'
import type { Practitioner } from '../lib/database.types'
import {
  fetchSessionPractitioner,
  loginWithPassword,
  registerPractitioner,
  signOut,
  updateLanguagePreference,
  updatePractitionerProfile,
} from '../services/authService'

interface AuthState {
  practitioner: Practitioner | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, title: string) => Promise<void>
  updateProfile: (name: string, title: string, address: string, phone: string) => Promise<string | null>
  updateLanguagePreference: (lang: SupportedLang) => Promise<void>
  updateAvatar: (avatarUrl: string) => void
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
    const practitioner = await fetchSessionPractitioner()
    set({ practitioner, loading: false })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    const result = await loginWithPassword(email, password)
    if (!result.ok) {
      set({ error: result.message, loading: false })
      return
    }
    set({ practitioner: result.practitioner, loading: false })
  },

  register: async (email, password, name, title) => {
    set({ loading: true, error: null })
    const result = await registerPractitioner(email, password, name, title)
    if (!result.ok) {
      set({ error: result.message, loading: false })
      return
    }
    set({ practitioner: result.practitioner, loading: false })
  },

  updateLanguagePreference: async (lang) => {
    await updateLanguagePreference(lang)
    set((state) => ({
      practitioner: state.practitioner ? { ...state.practitioner, language_preference: lang } : null,
    }))
  },

  updateProfile: async (name, title, address, phone) => {
    const { practitioner, error } = await updatePractitionerProfile(name, title, address, phone)
    if (error) return error
    if (practitioner) set({ practitioner })
    return null
  },

  updateAvatar: (avatarUrl) => {
    set((state) => ({
      practitioner: state.practitioner ? { ...state.practitioner, avatar_url: avatarUrl } : null,
    }))
  },

  logout: async () => {
    await signOut()
    set({ practitioner: null })
  },

  clearError: () => set({ error: null }),
}))
