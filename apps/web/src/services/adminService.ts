import { supabase } from '../lib/supabase'

// Gestion des utilisateurs — réservé aux praticiens admin. Toute opération passe par
// un RPC re-gardé `fn_is_admin()` côté base : ce service ne fait QUE relayer l'appel,
// la barrière d'accès n'est jamais côté client.

/** Discrimine les deux populations d'utilisateurs gérées par l'admin. */
export type AdminUserKind = 'patient' | 'practitioner'

/** Colonnes triables côté serveur (whitelistées par le RPC). */
export type AdminUserSortColumn =
  | 'display_name'
  | 'email'
  | 'kind'
  | 'practitioners'
  | 'created_at'

export type SortDirection = 'asc' | 'desc'

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

/** Paramètres de pagination + tri + filtres, tous appliqués côté serveur. */
export interface AdminUsersQuery {
  /** Type d'utilisateur, ou `null` pour tous. */
  readonly kind: AdminUserKind | null
  /** Nom d'un médecin → restreint aux patients qui lui sont rattachés. */
  readonly practitioner: string | null
  /** Recherche nom + email (ILIKE), ou `null`. */
  readonly search: string | null
  readonly sort: AdminUserSortColumn
  readonly dir: SortDirection
  readonly limit: number
  readonly offset: number
}

/** Une page de résultats + le total du jeu FILTRÉ (pour la pagination). */
export interface AdminUsersData {
  readonly users: readonly AdminUser[]
  readonly total: number
}

export type AdminUsersResult =
  | { readonly ok: true; readonly data: AdminUsersData }
  | { readonly ok: false; readonly message: string }

/**
 * Page d'utilisateurs via le RPC admin-only `admin_list_users` (tri/filtres/pagination
 * côté serveur). Chaque ligne porte `total_count` (total du jeu filtré avant
 * limit/offset) — on le lit une fois puis on le retire des lignes. Un appelant non
 * admin reçoit une erreur côté base, restituée ici en `ok:false`. L'appel est tracé
 * dans le journal d'audit RGPD par le RPC.
 */
export async function fetchUsers(query: AdminUsersQuery): Promise<AdminUsersResult> {
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_kind: query.kind,
    p_practitioner: query.practitioner,
    p_search: query.search,
    p_sort: query.sort,
    p_dir: query.dir,
    p_limit: query.limit,
    p_offset: query.offset,
  })
  if (error) {
    return { ok: false, message: error.message }
  }
  const rows = data ?? []
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0
  const users: AdminUser[] = rows.map(({ total_count: _total, ...user }) => user)
  return { ok: true, data: { users, total } }
}

/**
 * Noms des médecins pour le filtre « par praticien ». Le front ne disposant plus de
 * la liste complète des utilisateurs (pagination serveur), cette liste a sa propre
 * source. Dégradation gracieuse : un filtre indisponible ne casse pas la page.
 */
export async function fetchPractitionerNames(): Promise<readonly string[]> {
  const { data, error } = await supabase.rpc('admin_list_practitioner_names')
  if (error) {
    return []
  }
  return (data ?? []).map(row => row.name)
}
