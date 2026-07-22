import { supabase } from '../lib/supabase'
import { logger } from '@kaer/shared'
import { purgeAllLocalData } from '../lib/database'

export interface PatientProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
}

/**
 * Utilisateur porté par la session Supabase Auth. Volontairement distinct de
 * `PatientProfile` : la session ne contient QUE l'identité d'authentification
 * (id + email), jamais l'identité civile (nom, prénom, téléphone, avatar) qui vit
 * dans la table `patients`. Les confondre revient à propager un profil vide.
 */
export interface AuthSessionUser {
  id: string
  email: string
}

export interface TeenContext {
  teenMode: boolean
  moduleColors: Record<string, string>
  shareConsent: boolean
}

/**
 * Lecture pure du profil patient (table `patients`). Retourne `null` si la ligne
 * n'existe pas — la décision de purger/déconnecter appartient à l'appelant.
 */
export async function fetchPatientProfile(
  userId: string,
  email: string
): Promise<PatientProfile | null> {
  const { data: profile } = await supabase
    .from('patients')
    .select('first_name, last_name, phone, avatar_url')
    .eq('id', userId)
    .single()

  if (!profile) return null

  return {
    id: userId,
    email,
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    phone: profile.phone ?? null,
    avatar_url: profile.avatar_url ?? null,
  }
}

export async function getCurrentSessionPatient(): Promise<PatientProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return null

  const profile = await fetchPatientProfile(session.user.id, session.user.email!)

  if (!profile) {
    // Session présente mais profil absent → compte effacé côté serveur (RGPD art. 17,
    // ex. effacement déclenché par le praticien). On purge le stockage local résiduel
    // de l'appareil avant de fermer la session.
    await purgeAllLocalData()
    await supabase.auth.signOut()
    return null
  }

  return profile
}

/**
 * S'abonne aux changements de session Auth. Le callback ne reçoit QUE l'utilisateur
 * de session (id + email) : c'est tout ce que Supabase fournit ici. L'appelant est
 * responsable de charger le profil patient (`fetchPatientProfile`) — fabriquer un
 * `PatientProfile` aux champs vides depuis cet événement écraserait l'identité déjà
 * chargée à chaque `TOKEN_REFRESHED`.
 */
export function onAuthChange(
  cb: (user: AuthSessionUser | null) => void | Promise<void>
): { unsubscribe: () => void } {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    logger.log('[onAuthChange] event', _event, 'userId', session?.user?.id ?? 'null')
    if (!session?.user) {
      void cb(null)
      return
    }
    void cb({ id: session.user.id, email: session.user.email! })
  })
  return { unsubscribe: () => data.subscription.unsubscribe() }
}

export async function fetchTeenContext(patientId: string): Promise<TeenContext> {
  const [{ data: ppData }, { data: modulesData }, { data: patientData }] = await Promise.all([
    supabase
      .from('practitioner_patients')
      .select('teen_mode')
      .eq('patient_id', patientId)
      .single(),
    supabase.from('modules').select('id, color'),
    supabase.from('patients').select('share_consent').eq('id', patientId).single(),
  ])
  const moduleColors: Record<string, string> = {}
  for (const m of modulesData ?? []) {
    if (m.color) moduleColors[m.id] = m.color
  }
  return {
    teenMode: ppData?.teen_mode ?? false,
    moduleColors,
    shareConsent: patientData?.share_consent ?? true,
  }
}

/**
 * Met à jour le consentement de partage des saisies vers le praticien.
 * Écrit `patients.share_consent` ; le pilotage de la sync mobile
 * (`RemoteSyncService.setConsentEnabled`) reste à la charge de l'appelant (authStore).
 */
export async function setShareConsent(patientId: string, enabled: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('patients')
    .update({ share_consent: enabled })
    .eq('id', patientId)
  return !error
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  logger.log('[signIn] start', email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  logger.log('[signIn] supabase response', { userId: data?.user?.id, error: error?.message })
  if (error) throw new Error(error.message)

  const userId = data.user?.id
  if (!userId) throw new Error('Erreur lors de la connexion')

  logger.log('[signIn] checking patients table for', userId)
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', userId)
    .single()
  logger.log('[signIn] patients query result', { found: !!patient, error: patientError?.message })

  if (!patient) {
    await supabase.auth.signOut()
    throw new Error("Ce compte n'est pas un compte patient. Veuillez utiliser l'application web praticien.")
  }
  logger.log('[signIn] success')
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
