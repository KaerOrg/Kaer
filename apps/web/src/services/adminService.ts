import { supabase } from '../lib/supabase'

// Gestion des utilisateurs — réservé aux praticiens admin. Toute opération passe par
// un RPC re-gardé `fn_is_admin()` côté base : ce service ne fait QUE relayer l'appel,
// la barrière d'accès n'est jamais côté client.

/** Discrimine les deux populations d'utilisateurs gérées par l'admin. */
export type AdminUserKind = 'patient' | 'practitioner'

/** Identité minimale d'un utilisateur (patient OU médecin) pour la table admin. */
export interface AdminUser {
  readonly user_id: string
  readonly kind: AdminUserKind
  readonly email: string
  /** Nom affichable déjà résolu côté base (prénom+nom ou name, sinon email). */
  readonly display_name: string
  readonly created_at: string
  /** Médecins liés (patients) ; vide pour un médecin. */
  readonly practitioner_names: readonly string[]
  /** Rôle admin (médecins) ; toujours false pour un patient. */
  readonly is_admin: boolean
}

export type AdminUsersResult =
  | { readonly ok: true; readonly users: readonly AdminUser[] }
  | { readonly ok: false; readonly message: string }

/**
 * Liste TOUS les utilisateurs — patients ET médecins — via le RPC admin-only
 * `admin_list_users`. Un appelant non admin reçoit une erreur côté base — restituée
 * ici en `ok:false`. Chaque appel est tracé dans le journal d'audit RGPD par le RPC.
 */
export async function fetchAllUsers(): Promise<AdminUsersResult> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) {
    return { ok: false, message: error.message }
  }
  return { ok: true, users: data ?? [] }
}
