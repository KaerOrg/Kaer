import { create } from 'zustand'
import i18next, { initialLanguage } from '../i18n'
import { logger } from '@kaer/shared'
import {
  fetchPatientProfile,
  fetchTeenContext,
  getCurrentSessionPatient,
  onAuthChange,
  registerWithInvitation,
  setShareConsent as persistShareConsent,
  signInWithPassword,
  signOut,
  type PatientProfile,
} from '@services/authService'
import { loadStoredLanguage, persistLanguage } from '@services/languageService'
import { updatePatientProfile, type PatientProfileUpdate } from '@services/patientProfileService'
import { registerPushTokenIfGranted } from '@services/notificationService'
import { RemoteSyncService } from '@services/sync'

interface AuthState {
  patient: PatientProfile | null
  teenMode: boolean
  moduleColors: Record<string, string>
  shareConsent: boolean
  language: string
  loading: boolean
  loadSession: () => Promise<void>
  fetchTeenMode: () => Promise<void>
  setShareConsent: (enabled: boolean) => Promise<boolean>
  restoreLanguage: () => Promise<void>
  setLanguage: (lng: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (token: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateAvatar: (avatarUrl: string) => void
  updateProfile: (data: PatientProfileUpdate) => Promise<{ ok: boolean; error?: string }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  patient: null,
  teenMode: false,
  moduleColors: {},
  shareConsent: true,
  language: initialLanguage,
  loading: true,

  loadSession: async () => {
    logger.log('[loadSession] start')
    const timeout = setTimeout(() => {
      logger.warn('[loadSession] timeout fired — forcing loading=false')
      set((state) => (state.loading ? { patient: null, loading: false } : state))
    }, 6000)

    try {
      const patient = await getCurrentSessionPatient()
      logger.log('[loadSession] result', patient ? 'session found' : 'no session')
      set({ patient, loading: false })
      // fetchTeenMode résout aussi le consentement de sync depuis patients.share_consent.
      if (patient) await get().fetchTeenMode()
    } catch {
      set({ patient: null, loading: false })
    } finally {
      clearTimeout(timeout)
    }

    onAuthChange(async (incoming) => {
      if (incoming) {
        // Même utilisateur que celui déjà chargé (TOKEN_REFRESHED, INITIAL_SESSION…) :
        // le profil en mémoire est à jour et fait autorité. Le réécrire depuis
        // l'événement de session viderait nom/prénom/téléphone, absents de la session.
        const current = get().patient
        if (current?.id === incoming.id) return
        const patient = await fetchPatientProfile(incoming.id, incoming.email)
        set({ patient })
        if (patient) await get().fetchTeenMode()
      } else {
        RemoteSyncService.getInstance().setConsentEnabled(false)
        set({ patient: null, teenMode: false, moduleColors: {}, shareConsent: true })
      }
    })
  },

  // Applique au boot la langue choisie lors d'une session précédente. Sans choix
  // mémorisé, on garde `initialLanguage` (langue de l'appareil).
  restoreLanguage: async () => {
    const stored = await loadStoredLanguage()
    if (!stored || stored === get().language) return
    await i18next.changeLanguage(stored)
    set({ language: stored })
  },

  setLanguage: async (lng: string) => {
    await i18next.changeLanguage(lng)
    set({ language: lng })
    await persistLanguage(lng)
  },

  fetchTeenMode: async () => {
    const { patient } = get()
    if (!patient) return
    const { teenMode, moduleColors, shareConsent } = await fetchTeenContext(patient.id)
    set({ teenMode, moduleColors, shareConsent })
    // Le flag patient pilote la synchronisation des saisies vers patient_entries.
    RemoteSyncService.getInstance().setConsentEnabled(shareConsent)
    // Rafraîchit le token push si la permission est déjà accordée — non bloquant.
    // La demande initiale de permission est gérée par NotificationPermissionScreen.
    void registerPushTokenIfGranted(patient.id)
  },

  setShareConsent: async (enabled: boolean) => {
    const { patient } = get()
    if (!patient) return false
    const ok = await persistShareConsent(patient.id, enabled)
    if (!ok) return false
    set({ shareConsent: enabled })
    RemoteSyncService.getInstance().setConsentEnabled(enabled)
    return true
  },

  login: async (email, password) => {
    await signInWithPassword(email, password)
  },

  register: async (token, password) => {
    await registerWithInvitation(token, password)
  },

  logout: async () => {
    await signOut()
  },

  updateAvatar: (avatarUrl) => {
    set((state) => ({
      patient: state.patient ? { ...state.patient, avatar_url: avatarUrl } : null,
    }))
  },

  updateProfile: async (data) => {
    const { patient } = get()
    if (!patient) return { ok: false, error: 'not_logged_in' }
    const result = await updatePatientProfile(patient.id, data)
    if (result.ok) {
      set((state) => ({
        patient: state.patient
          ? { ...state.patient, first_name: data.first_name, last_name: data.last_name, phone: data.phone }
          : null,
      }))
    }
    return result
  },
}))
