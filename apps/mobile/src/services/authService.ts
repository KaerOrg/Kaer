import { supabase } from '../lib/supabase'

export interface PatientProfile {
  id: string
  email: string
  avatar_url: string | null
}

export interface TeenContext {
  teenMode: boolean
  moduleColors: Record<string, string>
}

export async function getCurrentSessionPatient(): Promise<PatientProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: profile } = await supabase
    .from('patients')
    .select('avatar_url')
    .eq('id', session.user.id)
    .single()

  return {
    id: session.user.id,
    email: session.user.email!,
    avatar_url: profile?.avatar_url ?? null,
  }
}

export function onAuthChange(
  cb: (patient: PatientProfile | null) => void | Promise<void>
): { unsubscribe: () => void } {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      void cb(null)
      return
    }
    void cb({
      id: session.user.id,
      email: session.user.email!,
      avatar_url: null,
    })
  })
  return { unsubscribe: () => data.subscription.unsubscribe() }
}

export async function fetchTeenContext(patientId: string): Promise<TeenContext> {
  const [{ data: ppData }, { data: modulesData }] = await Promise.all([
    supabase
      .from('practitioner_patients')
      .select('teen_mode')
      .eq('patient_id', patientId)
      .single(),
    supabase.from('modules').select('id, color'),
  ])
  const moduleColors: Record<string, string> = {}
  for (const m of modulesData ?? []) {
    if (m.color) moduleColors[m.id] = m.color
  }
  return { teenMode: ppData?.teen_mode ?? false, moduleColors }
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

interface InvitationRow {
  id: string
  patient_email: string
}

/**
 * Inscription patient via code d'invitation.
 * 1. Vérifie token (non expiré, non accepté) et récupère l'email
 * 2. Crée le compte Supabase Auth
 * 3. Crée le profil patient
 * 4. Marque l'invitation comme acceptée
 */
export async function registerWithInvitation(token: string, password: string): Promise<void> {
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single<InvitationRow>()

  if (invError || !invitation) {
    throw new Error("Code d'invitation invalide ou expiré. Vérifiez le code saisi.")
  }

  const email = invitation.patient_email

  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error('Erreur lors de la création du compte')

  const { error: profileError } = await supabase
    .from('patients')
    .insert({ id: authData.user.id, email, avatar_url: null })
  if (profileError) throw new Error(profileError.message)

  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
