import { create } from 'zustand'
import type { SupportedLang } from '../i18n'
import type { Practitioner } from '../lib/database.types'
import {
  completeMfaLogin,
  dismissMfaReminder as dismissMfaReminderService,
  fetchSessionPractitioner,
  getMfaStatus,
  loginWithPassword,
  registerPractitioner,
  signOut,
  updateLanguagePreference,
  updatePractitionerProfile,
  type MfaStatus,
} from '@services/authService'

interface AuthState {
  practitioner: Practitioner | null
  loading: boolean
  error: string | null
  /** Connexion en attente d'un code MFA (login mot de passe OK, aal2 requis). */
  mfaRequired: boolean
  mfaFactorId: string | null
  /** Statut MFA du praticien connecté (null = pas encore chargé). Source partagée carte ↔ bandeau. */
  mfaStatus: MfaStatus | null
  login: (email: string, password: string) => Promise<void>
  /** Vérifie le code TOTP du challenge de login. Renvoie true si la connexion aboutit. */
  verifyMfa: (code: string) => Promise<boolean>
  /** Annule un challenge MFA en cours (déconnecte la demi-session aal1). */
  cancelMfa: () => Promise<void>
  /** Recharge le statut MFA (après enrôlement/désactivation) — rend le bandeau réactif. */
  refreshMfaStatus: () => Promise<void>
  register: (email: string, password: string, name: string, title: string) => Promise<void>
  updateProfile: (name: string, title: string, address: string, phone: string) => Promise<string | null>
  updateLanguagePreference: (lang: SupportedLang) => Promise<void>
  updateAvatar: (avatarUrl: string) => void
  /** Masque définitivement le bandeau de rappel d'activation du MFA. */
  dismissMfaReminder: () => Promise<void>
  logout: () => Promise<void>
  loadSession: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  practitioner: null,
  loading: true,
  error: null,
  mfaRequired: false,
  mfaFactorId: null,
  mfaStatus: null,

  loadSession: async () => {
    set({ loading: true })
    const practitioner = await fetchSessionPractitioner()
    set({ practitioner, loading: false })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    const result = await loginWithPassword(email, password)
    if (result.status === 'error') {
      set({ error: result.message, loading: false })
      return
    }
    if (result.status === 'mfa_required') {
      set({ mfaRequired: true, mfaFactorId: result.factorId, loading: false })
      return
    }
    set({ practitioner: result.practitioner, loading: false })
  },

  verifyMfa: async (code) => {
    const factorId = get().mfaFactorId
    if (!factorId) return false
    set({ loading: true, error: null })
    const result = await completeMfaLogin(factorId, code)
    if (result.status !== 'success') {
      set({ loading: false })
      return false
    }
    set({ practitioner: result.practitioner, mfaRequired: false, mfaFactorId: null, loading: false })
    return true
  },

  cancelMfa: async () => {
    await signOut()
    set({ mfaRequired: false, mfaFactorId: null, practitioner: null, error: null })
  },

  refreshMfaStatus: async () => {
    const status = await getMfaStatus()
    set({ mfaStatus: status })
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

  dismissMfaReminder: async () => {
    set((state) => ({
      practitioner: state.practitioner
        ? { ...state.practitioner, mfa_reminder_dismissed: true }
        : null,
    }))
    await dismissMfaReminderService()
  },

  logout: async () => {
    await signOut()
    set({ practitioner: null, mfaStatus: null })
  },

  clearError: () => set({ error: null }),
}))
