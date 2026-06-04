import { supabase } from '../lib/supabase'
import { setLanguage, type SupportedLang } from '../i18n'
import type { Practitioner, ProfessionalTitle } from '../lib/database.types'

async function applyLanguagePreference(practitioner: Practitioner | null): Promise<void> {
  if (practitioner?.language_preference) {
    setLanguage(practitioner.language_preference as SupportedLang)
  }
}

/** Charge le profil praticien de la session courante (et applique sa langue). */
async function loadCurrentPractitioner(): Promise<Practitioner | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('practitioners').select('*').eq('id', user.id).single()
  await applyLanguagePreference(data)
  return data ?? null
}

/**
 * Détermine si un challenge MFA est requis pour la session courante.
 * Une session fraîchement créée par mot de passe pour un compte ayant un facteur
 * TOTP vérifié est au niveau `aal1` alors que `nextLevel` vaut `aal2` : tant que le
 * code n'est pas saisi, le praticien NE doit PAS être considéré comme connecté.
 */
async function getMfaChallenge(): Promise<{ required: boolean; factorId: string | null }> {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (!aal || aal.nextLevel !== 'aal2' || aal.currentLevel === 'aal2') {
    return { required: false, factorId: null }
  }
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const verified = factors?.totp.find(f => f.status === 'verified') ?? null
  return { required: verified !== null, factorId: verified?.id ?? null }
}

export async function fetchSessionPractitioner(): Promise<Practitioner | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null
  // Session présente mais MFA non franchi (aal1 → aal2) : pas encore authentifié.
  const mfa = await getMfaChallenge()
  if (mfa.required) return null
  return loadCurrentPractitioner()
}

export type LoginResult =
  | { status: 'success'; practitioner: Practitioner | null }
  | { status: 'mfa_required'; factorId: string }
  | { status: 'error'; message: string }

export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { status: 'error', message: 'Email ou mot de passe incorrect.' }

  const mfa = await getMfaChallenge()
  if (mfa.required && mfa.factorId) {
    return { status: 'mfa_required', factorId: mfa.factorId }
  }
  return { status: 'success', practitioner: await loadCurrentPractitioner() }
}

/**
 * Finalise une connexion en attente de MFA : vérifie le code TOTP (promotion en
 * aal2) puis charge le praticien. Appelé après `loginWithPassword` → `mfa_required`.
 */
export async function completeMfaLogin(factorId: string, code: string): Promise<LoginResult> {
  const result = await verifyMfaCode(factorId, code)
  if (!result.ok) return { status: 'error', message: result.message ?? 'code_invalid' }
  return { status: 'success', practitioner: await loadCurrentPractitioner() }
}

// ============================================================
// MFA (TOTP) — authentification forte praticien
// ============================================================

export interface MfaStatus {
  enabled: boolean
  factorId: string | null
}

export type MfaEnrollResult =
  | { ok: true; factorId: string; qrCode: string; secret: string }
  | { ok: false; message: string }

/** Démarre l'enrôlement d'un facteur TOTP : renvoie le QR code et le secret à afficher. */
export async function enrollMfaTotp(): Promise<MfaEnrollResult> {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
  if (error || !data) return { ok: false, message: error?.message ?? 'enroll_failed' }
  return { ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }
}

/**
 * Vérifie un code TOTP pour un facteur donné (challenge + verify).
 * Sert à la fois à valider l'enrôlement et à franchir le challenge au login.
 */
export async function verifyMfaCode(
  factorId: string,
  code: string
): Promise<{ ok: boolean; message?: string }> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
  if (challengeError || !challenge) return { ok: false, message: challengeError?.message }
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  })
  if (verifyError) return { ok: false, message: verifyError.message }
  return { ok: true }
}

/** État MFA du praticien courant (facteur TOTP vérifié ou non). */
export async function getMfaStatus(): Promise<MfaStatus> {
  const { data } = await supabase.auth.mfa.listFactors()
  const verified = data?.totp.find(f => f.status === 'verified') ?? null
  return { enabled: verified !== null, factorId: verified?.id ?? null }
}

/** Désenrôle un facteur (désactivation MFA, ou nettoyage d'un enrôlement annulé). */
export async function unenrollMfa(factorId: string): Promise<{ ok: boolean; message?: string }> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  return error ? { ok: false, message: error.message } : { ok: true }
}

export type RegisterResult =
  | { ok: true; practitioner: Practitioner | null }
  | { ok: false; message: string }

export async function registerPractitioner(
  email: string,
  password: string,
  name: string,
  title: string
): Promise<RegisterResult> {
  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'practitioner', name, professional_title: title || null } },
  })
  if (error || !user) {
    return { ok: false, message: error?.message ?? 'Erreur lors de la création du compte.' }
  }
  // Le trigger handle_new_user crée le profil automatiquement via les métadonnées.
  const { data } = await supabase.from('practitioners').select('*').eq('id', user.id).single()
  return { ok: true, practitioner: data ?? null }
}

export async function updateLanguagePreference(lang: SupportedLang): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  setLanguage(lang)
  await supabase
    .from('practitioners')
    .update({ language_preference: lang } as never)
    .eq('id', user.id)
}

export async function updatePractitionerProfile(
  name: string,
  title: string,
  address: string,
  phone: string
): Promise<{ practitioner: Practitioner | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { practitioner: null, error: 'Non authentifié.' }
  const { error } = await supabase
    .from('practitioners')
    .update({
      name,
      professional_title: title || null,
      address: address || null,
      phone: phone || null,
    } as never)
    .eq('id', user.id)
  if (error) return { practitioner: null, error: 'Erreur lors de la mise à jour.' }
  const { data } = await supabase
    .from('practitioners')
    .select('*')
    .eq('id', user.id)
    .single()
  return { practitioner: data ?? null, error: null }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function fetchProfessionalTitles(): Promise<ProfessionalTitle[]> {
  const { data } = await supabase
    .from('professional_titles')
    .select('code, label_fr, label_en, sort_order')
    .order('sort_order')
  return (data ?? []) as ProfessionalTitle[]
}
