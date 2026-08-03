// ─── Plan de sécurité : le document partagé et son cache local (PW-1, #320) ──
//
// Le plan n'est pas une saisie, c'est un DOCUMENT CO-ÉDITÉ. Il vit dans la table
// Supabase `safety_plan_items`, écrite des deux côtés, et non plus dans
// `patient_entries` : ce journal est drainé par une outbox strictement montante, donc
// un item ajouté par le praticien depuis le web n'atteignait jamais le téléphone.
//
// ── Pourquoi ce service est SÉPARÉ de `planItemService` ─────────────────────
//
// Deux raisons, et aucune n'est cosmétique :
//
//  1. **La garantie hors ligne de la Séquence.** `planItemService.getPlanItems` doit
//     rester strictement SQLite : les moments où un plan de sécurité est le plus
//     nécessaire sont ceux où le réseau est le plus défaillant. Un test statique de
//     `planItemService` échoue si un client réseau y apparaît. Le réseau vit donc ici,
//     hors du chemin de lecture de la Séquence.
//  2. **`plan_items` n'est pas propre au plan de sécurité.** Le module Balance
//     décisionnelle (`decisional_balance`) y stocke ses arguments et les synchronise
//     par `entry_kind: 'plan_item'`. Router tous les items vers la nouvelle table
//     casserait ce module. Seul `crisis_plan` passe par ici.
//
// ── Le cache ────────────────────────────────────────────────────────────────
//
// La table SQLite `plan_items` reste le cache local qui sert la Séquence. Ce service
// la RAFRAÎCHIT depuis le serveur (à l'ouverture du module, jamais dans le parcours
// de crise) et la maintient à jour à chaque écriture patient.
//
// Conformité MDR 2017/745 : `authored_by` est descriptif, jamais interprété. Aucune
// règle de priorité, aucun verrou d'édition : chacun peut modifier ce que l'autre a
// écrit, c'est un document commun.

import { supabase } from '../lib/supabase'
import {
  savePlanItem as dbSavePlanItem,
  deletePlanItem as dbDeletePlanItem,
  getAllPlanItemsForModule as dbGetAllPlanItemsForModule,
  type PlanItem,
  type PlanItemKind,
} from '../lib/database'

/** Le seul module servi par ce service. Les autres restent sur `planItemService`. */
export const SAFETY_PLAN_MODULE_ID = 'crisis_plan'

const TABLE = 'safety_plan_items'

/** Une ligne de `safety_plan_items`, telle que le serveur la rend. */
export interface SafetyPlanRow {
  id: string
  section_id: string
  text: string
  kind: string | null
  role: string | null
  note: string | null
  phone: string | null
  sort_order: number
  authored_by: string
  created_at: string
}

const SELECT_COLUMNS = 'id, section_id, text, kind, role, note, phone, sort_order, authored_by, created_at'

/** Projection d'une ligne serveur vers le cache SQLite local. */
function toLocal(row: SafetyPlanRow): Omit<PlanItem, 'created_at'> {
  return {
    id: row.id,
    module_id: SAFETY_PLAN_MODULE_ID,
    section_id: row.section_id,
    text: row.text,
    sort_order: row.sort_order,
    // `weight` et `contact_source` n'existent pas côté serveur : ce sont des notions
    // locales d'autres modules. Le plan de sécurité ne les utilise pas.
    weight: null,
    phone: row.phone,
    contact_source: null,
    kind: toKind(row.kind),
    role: row.role,
    note: row.note,
  }
}

/**
 * `kind` serveur vers l'union fermée locale.
 *
 * Une valeur inconnue retombe sur `null`, jamais sur une valeur par défaut : un item
 * dont on ne sait pas la nature n'est ni une personne ni un lieu, et **rien ne doit
 * être déduit de son texte** (P-14). Le rendu se dégrade en item simple, ce qui est
 * exact, plutôt que d'inventer.
 */
function toKind(value: string | null): PlanItemKind | null {
  return value === 'person' || value === 'place' ? value : null
}

/**
 * Rafraîchit le cache local depuis le serveur.
 *
 * À appeler à l'OUVERTURE DU MODULE, jamais depuis la Séquence : celle-ci lit le
 * cache et doit fonctionner sans réseau.
 *
 * Renvoie `false` si la lecture a échoué (hors ligne, RLS) : le cache reste alors
 * intact, avec les items connus. Perdre le réseau ne doit jamais vider un plan de
 * sécurité — c'est le cas d'usage où ce serait le plus grave.
 */
export async function refreshSafetyPlan(patientId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq('patient_id', patientId)
    .order('section_id', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error || data == null) return false

  const rows = data as SafetyPlanRow[]
  const remoteIds = new Set(rows.map(r => r.id))

  // Les items supprimés côté serveur (par le patient sur un autre appareil, ou par le
  // praticien) doivent disparaître du cache : sans ça, le plan ne ferait que grossir.
  const local = await dbGetAllPlanItemsForModule(SAFETY_PLAN_MODULE_ID)
  for (const item of local) {
    if (!remoteIds.has(item.id)) await dbDeletePlanItem(item.id)
  }

  for (const row of rows) await dbSavePlanItem(toLocal(row))
  return true
}

/** Champs modifiables d'un item, côté patient. */
export interface SafetyPlanItemInput {
  id: string
  section_id: string
  text: string
  sort_order: number
  phone?: string | null
  /** Nature de l'item (P-14). Jamais déduite du texte : renseignée, ou absente. */
  kind?: PlanItemKind | null
  /** Lien au patient ou fonction, deux ou trois mots. */
  role?: string | null
  /** Une ligne libre. */
  note?: string | null
}

/**
 * Écrit un item : serveur d'abord, puis cache local.
 *
 * L'ordre compte. Si le serveur refuse (hors ligne, RLS), on n'écrit pas localement :
 * mieux vaut que le patient voie que sa saisie n'a pas été prise que de lui montrer un
 * item qui n'existe que sur son téléphone et disparaîtra au prochain rafraîchissement.
 */
export async function saveSafetyPlanItem(patientId: string, item: SafetyPlanItemInput): Promise<boolean> {
  const { error } = await supabase.from(TABLE).upsert({
    id: item.id,
    patient_id: patientId,
    section_id: item.section_id,
    text: item.text,
    sort_order: item.sort_order,
    phone: item.phone ?? null,
    kind: item.kind ?? null,
    role: item.role ?? null,
    note: item.note ?? null,
    authored_by: 'patient',
    updated_at: new Date().toISOString(),
  })
  if (error) return false

  await dbSavePlanItem({
    id: item.id,
    module_id: SAFETY_PLAN_MODULE_ID,
    section_id: item.section_id,
    text: item.text,
    sort_order: item.sort_order,
    weight: null,
    phone: item.phone ?? null,
    contact_source: null,
    kind: item.kind ?? null,
    role: item.role ?? null,
    note: item.note ?? null,
  })
  return true
}

/** Supprime un item : serveur d'abord, puis cache local. Même raisonnement d'ordre. */
export async function deleteSafetyPlanItem(patientId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('patient_id', patientId)
  if (error) return false
  await dbDeletePlanItem(id)
  return true
}
