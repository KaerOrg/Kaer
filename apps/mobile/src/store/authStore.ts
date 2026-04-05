import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface Patient {
  id: string
  email: string
  avatar_url: string | null
}

interface AuthState {
  patient: Patient | null
  loading: boolean
  loadSession: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, token: string) => Promise<void>
  logout: () => Promise<void>
  updateAvatar: (avatarUrl: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  patient: null,
  loading: true,

  // Appelé au démarrage de l'app pour restaurer la session existante
  loadSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

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
    } else {
      set({ patient: null, loading: false })
    }

    // Écoute les changements d'authentification (connexion / déconnexion)
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set((state) => ({
          patient: {
            id: session.user!.id,
            email: session.user!.email!,
            avatar_url: state.patient?.avatar_url ?? null,
          },
        }))
      } else {
        set({ patient: null })
      }
    })
  },

  login: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  },

  // Inscription via code d'invitation fourni par le praticien
  register: async (email: string, password: string, token: string) => {
    // 1. Vérifie que le token existe, correspond à cet email et n'est pas expiré
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('patient_email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invError || !invitation) {
      throw new Error(
        "Code d'invitation invalide ou expiré. Vérifiez le code et l'email utilisés."
      )
    }

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
