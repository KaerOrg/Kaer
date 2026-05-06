import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import i18next, { initialLanguage } from '../i18n'
import { logger } from '@psytool/shared'

interface Patient {
  id: string
  email: string
  avatar_url: string | null
}

interface AuthState {
  patient: Patient | null
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
      logger.log('[loadSession] getSession...')
      const {
        data: { session },
      } = await supabase.auth.getSession()
      logger.log('[loadSession] getSession result', session ? 'session found' : 'no session')

      if (session?.user) {
        const { data: profile } = await supabase
          .from('patients')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single()

        set({
          patient: {
            id: session.user.id,
            email: session.user.email!,
            avatar_url: profile?.avatar_url ?? null,
          },
          loading: false,
        })
        // Charger le mode ado après la restauration de session
        await get().fetchTeenMode()
      } else {
        set({ patient: null, loading: false })
      }
    } catch {
      set({ patient: null, loading: false })
    } finally {
      clearTimeout(timeout)
    }

    // Écoute les changements d'authentification (connexion / déconnexion)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        set((state) => ({
          patient: {
            id: session.user!.id,
            email: session.user!.email!,
            avatar_url: state.patient?.avatar_url ?? null,
          },
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

  // Récupère le flag teen_mode et les couleurs des modules depuis la BDD
  fetchTeenMode: async () => {
    const { patient } = get()
    if (!patient) return
    const [{ data: ppData }, { data: modulesData }] = await Promise.all([
      supabase.from('practitioner_patients').select('teen_mode').eq('patient_id', patient.id).single(),
      supabase.from('modules').select('id, color'),
    ])
    const moduleColors: Record<string, string> = {}
    for (const m of modulesData ?? []) {
      if (m.color) moduleColors[m.id] = m.color
    }
    set({ teenMode: ppData?.teen_mode ?? false, moduleColors })
  },

  login: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  },

  // Inscription via code d'invitation fourni par le praticien
  // L'email est récupéré automatiquement depuis le token — le patient n'a pas à le saisir
  register: async (token: string, password: string) => {
    // 1. Vérifie que le token existe et n'est pas expiré, et récupère l'email
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invError || !invitation) {
      throw new Error(
        "Code d'invitation invalide ou expiré. Vérifiez le code saisi."
      )
    }

    const email = invitation.patient_email

    // 2. Crée le compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Erreur lors de la création du compte')

    // 3. Crée le profil patient dans la base de données
    const { error: profileError } = await supabase
      .from('patients')
      .insert({ id: authData.user.id, email, avatar_url: null })
    if (profileError) throw new Error(profileError.message)

    // 4. Marque l'invitation comme acceptée
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)
  },

  logout: async () => {
    await supabase.auth.signOut()
  },

  updateAvatar: (avatarUrl: string) => {
    set((state) => ({
      patient: state.patient ? { ...state.patient, avatar_url: avatarUrl } : null,
    }))
  },
}))
