import { supabase } from '../lib/supabase'
import { setLanguage, type SupportedLang } from '../i18n'
import type { Practitioner } from '../lib/database.types'

async function applyLanguagePreference(practitioner: Practitioner | null): Promise<void> {
  if (practitioner?.language_preference) {
    setLanguage(practitioner.language_preference as SupportedLang)
  }
}

export async function fetchSessionPractitioner(): Promise<Practitioner | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase
    .from('practitioners')
    .select('*')
    .eq('id', session.user.id)
    .single()
  await applyLanguagePreference(data)
  return data ?? null
}

export type LoginResult =
  | { ok: true; practitioner: Practitioner | null }
  | { ok: false; message: string }

export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, message: 'Email ou mot de passe incorrect.' }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: true, practitioner: null }

  const { data } = await supabase
    .from('practitioners')
    .select('*')
    .eq('id', user.id)
    .single()
  await applyLanguagePreference(data)
  return { ok: true, practitioner: data ?? null }
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
