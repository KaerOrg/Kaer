// ─── Plan de sécurité : les items, côté praticien (PW-1, #320) ───────────────
//
// Le plan vit dans `safety_plan_items`, une table écrite des DEUX côtés. C'est ce qui
// permet au praticien d'écrire dans le plan pendant la consultation et au patient de
// le retrouver sur son téléphone. Avant, les items étaient des lignes de
// `patient_entries`, drainées par une outbox strictement montante : ce que le
// praticien écrivait ne descendait jamais.
//
// L'éditeur des six étapes (PW-2, #321) se construit sur ce service.
//
// Conformité MDR 2017/745 : `authored_by` est DESCRIPTIF. Il sert à l'affichage
// (« ajouté par le patient le 11 juin ») et au diff de PW-8. Aucune règle de priorité,
// aucun verrou : chacun peut modifier ce que l'autre a écrit, c'est un document
// commun. Ne jamais en dériver un droit d'édition ni une conclusion clinique.

import { supabase } from '../lib/supabase'

/** Un item du plan, tel que le serveur le rend. */
export interface SafetyPlanItem {
  readonly id: string
  readonly section_id: string
  readonly text: string
  readonly kind: string | null
  readonly role: string | null
  readonly note: string | null
  readonly phone: string | null
  readonly sort_order: number
  readonly authored_by: string
  readonly created_at: string
  readonly updated_at: string
}

/** Champs qu'un praticien peut écrire. `authored_by` n'en fait pas partie : il est posé ici. */
export interface SafetyPlanItemInput {
  id?: string
  section_id: string
  text: string
  kind?: string | null
  role?: string | null
  note?: string | null
  phone?: string | null
  sort_order?: number
}

const TABLE = 'safety_plan_items'
const COLUMNS = 'id, section_id, text, kind, role, note, phone, sort_order, authored_by, created_at, updated_at'

/**
 * Items du plan d'un patient, dans l'ordre d'affichage (étape, puis rang).
 * Renvoie une liste vide quand le plan n'existe pas encore : un plan vide est un
 * état normal, pas une erreur.
 */
export async function fetchSafetyPlanItems(patientId: string): Promise<SafetyPlanItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq('patient_id', patientId)
    .order('section_id', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as SafetyPlanItem[]
}

/**
 * Crée ou met à jour un item, marqué comme écrit par le praticien.
 *
 * `authored_by` n'est pas un droit : il n'empêche personne de modifier la ligne
 * ensuite. Il dit seulement qui l'a écrite en dernier lieu depuis cette surface.
 */
export async function saveSafetyPlanItem(
  patientId: string,
  item: SafetyPlanItemInput,
): Promise<void> {
  const { error } = await supabase.from(TABLE).upsert({
    ...(item.id ? { id: item.id } : {}),
    patient_id: patientId,
    section_id: item.section_id,
    text: item.text,
    kind: item.kind ?? null,
    role: item.role ?? null,
    note: item.note ?? null,
    phone: item.phone ?? null,
    sort_order: item.sort_order ?? 0,
    authored_by: 'practitioner',
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

/** Supprime un item du plan. Le patient le verra disparaître au rafraîchissement. */
export async function deleteSafetyPlanItem(patientId: string, id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('patient_id', patientId)
  if (error) throw error
}
