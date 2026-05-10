import { supabase } from '../lib/supabase'
import type { ModuleType } from '../lib/database.types'

export interface PendingInvitation {
  id: string
  patient_email: string
  patient_first_name: string | null
  patient_last_name: string | null
  expires_at: string
  created_at: string
}

export async function fetchPendingInvitations(practitionerId: string): Promise<PendingInvitation[]> {
  const { data } = await supabase
    .from('invitations')
    .select('id, patient_email, patient_first_name, patient_last_name, expires_at, created_at')
    .eq('practitioner_id', practitionerId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  return data ?? []
}

export interface InvitationDraft {
  practitionerId: string
  email: string
  firstName: string | null
  lastName: string | null
  birthDate: string | null
  sex: string | null
  teenMode: boolean
  modules: ModuleType[]
}

export type SendInvitationResult =
  | { ok: true }
  | { ok: false; errorCode: string | null; errorMessage: string | null }

interface FunctionError {
  context?: { json?: () => Promise<{ error?: string }> }
}

const KNOWN_INVITATION_ERROR_CODES = new Set([
  'patient_already_registered',
  'invitation_already_pending',
])

/** Appelle l'edge function send-invitation et expose un code d'erreur stable. */
export async function sendInvitation(draft: InvitationDraft): Promise<SendInvitationResult> {
  const { data, error } = await supabase.functions.invoke('send-invitation', {
    body: {
      practitioner_id: draft.practitionerId,
      patient_email: draft.email.toLowerCase().trim(),
      first_name: draft.firstName?.trim() || null,
      last_name: draft.lastName?.trim() || null,
      birth_date: draft.birthDate || null,
      sex: draft.sex || null,
      teen_mode: draft.teenMode,
      modules: draft.modules,
    },
  })

  if (error) {
    let errorCode: string | null = null
    let errorMessage: string | null = null
    try {
      const body = await (error as FunctionError).context?.json?.()
      if (body?.error) {
        errorMessage = body.error
        if (KNOWN_INVITATION_ERROR_CODES.has(body.error)) errorCode = body.error
      }
    } catch {
      // Body indisponible — on remonte un échec générique.
    }
    return { ok: false, errorCode, errorMessage }
  }

  if (!data?.success) {
    return { ok: false, errorCode: null, errorMessage: data?.error ?? null }
  }

  return { ok: true }
}

interface InvitationRow {
  patient_email: string
  expires_at: string
  accepted_at: string | null
}

export type ValidatedInvitation = { valid: true; email: string } | { valid: false }

export async function validateInvitationToken(token: string): Promise<ValidatedInvitation> {
  if (!token) return { valid: false }
  const { data } = await supabase
    .from('invitations')
    .select('patient_email, expires_at, accepted_at')
    .eq('token', token)
    .single() as { data: InvitationRow | null; error: unknown }

  if (!data || data.accepted_at || new Date(data.expires_at) < new Date()) {
    return { valid: false }
  }
  return { valid: true, email: data.patient_email }
}

export async function signUpPatientFromInvitation(
  email: string,
  password: string,
  invitationToken: string
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'patient', invitation_token: invitationToken } },
  })
  if (error) return { ok: false, message: error.message }
  return { ok: true }
}
