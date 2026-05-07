import { create } from 'zustand'
import i18next, { initialLanguage } from '../i18n'
import { logger } from '@psytool/shared'
import {
  fetchTeenContext,
  getCurrentSessionPatient,
  onAuthChange,
  registerWithInvitation,
  signInWithPassword,
  signOut,
  type PatientProfile,
} from '../services/authService'

interface AuthState {
  patient: PatientProfile | null
  teenMode: boolean
  moduleColors: Record<string, string>
  language: string
  loading: boolean
  loadSession: () => Promise<void>
  fetchTeenMode: () => Promise<void>
  setLanguage: (lng: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (token: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateAvatar: (avatarUrl: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  patient: null,
  teenMode: false,
  moduleColors: {},
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
      if (patient) await get().fetchTeenMode()
    } catch {
      set({ patient: null, loading: false })
    } finally {
      clearTimeout(timeout)
    }

    onAuthChange(async (incoming) => {
      if (incoming) {
        set((state) => ({
          patient: { ...incoming, avatar_url: state.patient?.avatar_url ?? null },
        }))
        await get().fetchTeenMode()
      } else {
        set({ patient: null, teenMode: false, moduleColors: {} })
      }
    })
  },

  setLanguage: async (lng: string) => {
    await i18next.changeLanguage(lng)
    set({ language: lng })
  },

  fetchTeenMode: async () => {
    const { patient } = get()
    if (!patient) return
    const { teenMode, moduleColors } = await fetchTeenContext(patient.id)
    set({ teenMode, moduleColors })
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
}))
