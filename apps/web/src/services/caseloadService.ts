import { supabase } from '../lib/supabase'
import type {
  CaseloadAction,
  CaseloadActionInput,
  CaseloadEntry,
  CaseloadEntryInput,
  CaseloadNote,
  CaseloadRowData,
  CaseloadStatus,
  CaseloadWait,
  CaseloadWaitInput,
} from '../lib/caseload.types'

// Fonctions pures ré-exportées depuis la couche logique (zéro dépendance Supabase).
export {
  daysBetween,
  computeAlertForDue,
  computeActionAlert,
  computeEntryAlert,
  selectTopAction,
  buildTodayList,
} from '../lib/caseloadLogic'

// ============================================================
// Accès aux données (Supabase). `practitioner_id` est garanti par RLS
// (auth.uid()), jamais transmis depuis le client pour la lecture.
// ============================================================

const ENTRY_COLUMNS =
  'id, practitioner_id, patient_id, display_name, status, is_important, wake_date, invited_email, care_pathways, last_reviewed_at, created_at, updated_at, archived_at'

const ACTION_COLUMNS =
  'id, entry_id, practitioner_id, label, due_date, due_time, is_urgent, is_done, done_at, recurrence_days, sort_order, created_at, updated_at'

const WAIT_COLUMNS = 'id, entry_id, practitioner_id, label, relance_date, created_at, updated_at'

const NOTE_COLUMNS = 'id, entry_id, practitioner_id, body, is_pinned, created_at'

function groupByEntry<T extends { entry_id: string }>(items: readonly T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(item.entry_id)
    if (list) list.push(item)
    else map.set(item.entry_id, [item])
  }
  return map
}

/** Récupère les dossiers d'un praticien avec leurs actions et attentes. Exclut les archivés par défaut. */
export async function fetchCaseload(
  practitionerId: string,
  options: { includeArchived?: boolean } = {}
): Promise<CaseloadRowData[]> {
  let entryQuery = supabase
    .from('caseload_entries')
    .select(ENTRY_COLUMNS)
    .eq('practitioner_id', practitionerId)
    .order('created_at', { ascending: true })
  if (!options.includeArchived) entryQuery = entryQuery.neq('status', 'archived')

  const [entriesRes, actionsRes, waitsRes] = await Promise.all([
    entryQuery,
    supabase
      .from('caseload_actions')
      .select(ACTION_COLUMNS)
      .eq('practitioner_id', practitionerId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('caseload_waits')
      .select(WAIT_COLUMNS)
      .eq('practitioner_id', practitionerId)
      .order('created_at', { ascending: true }),
  ])

  if (entriesRes.error || !entriesRes.data) return []

  const actionsByEntry = groupByEntry((actionsRes.data ?? []) as CaseloadAction[])
  const waitsByEntry = groupByEntry((waitsRes.data ?? []) as CaseloadWait[])

  return (entriesRes.data as CaseloadEntry[]).map(entry => ({
    entry,
    actions: actionsByEntry.get(entry.id) ?? [],
    waits: waitsByEntry.get(entry.id) ?? [],
  }))
}

/** Crée un dossier. `display_name` est obligatoire (validé en amont). */
export async function createCaseloadEntry(
  practitionerId: string,
  input: CaseloadEntryInput
): Promise<{ ok: boolean; entry?: CaseloadEntry }> {
  const displayName = input.display_name?.trim()
  if (!displayName) return { ok: false }

  const { data, error } = await supabase
    .from('caseload_entries')
    .insert({ ...input, display_name: displayName, practitioner_id: practitionerId })
    .select(ENTRY_COLUMNS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, entry: data as CaseloadEntry }
}

interface ExistingEntryRef {
  id: string
  patient_id: string | null
  invited_email: string | null
}

/**
 * Synchronise la file active avec les patients de l'app — idempotent :
 * - chaque patient **inscrit** sans dossier lié → dossier lié créé ;
 * - une **invitation en attente** sans dossier → dossier « libre » créé (`invited_email`) ;
 * - un patient qui s'inscrit alors qu'un dossier libre existait à son email → ce dossier
 *   est **converti** en dossier lié (pas de doublon).
 * Déduplication sur tous statuts (pour ne pas ressusciter un dossier archivé).
 */
export async function syncCaseloadWithPatients(
  practitionerId: string,
  registered: readonly { id: string; name: string; email: string }[],
  pending: readonly { email: string; name: string }[]
): Promise<{ created: number; linked: number }> {
  if (registered.length === 0 && pending.length === 0) return { created: 0, linked: 0 }

  const { data } = await supabase
    .from('caseload_entries')
    .select('id, patient_id, invited_email')
    .eq('practitioner_id', practitionerId)
  const entries = (data ?? []) as ExistingEntryRef[]

  const linkedPatientIds = new Set(entries.filter(e => e.patient_id).map(e => e.patient_id))
  const coveredInvitedEmails = new Set<string>()
  const freeByEmail = new Map<string, string>()
  for (const e of entries) {
    if (!e.invited_email) continue
    const email = e.invited_email.toLowerCase()
    coveredInvitedEmails.add(email)
    if (!e.patient_id) freeByEmail.set(email, e.id)
  }

  const inserts: { practitioner_id: string; display_name: string; patient_id?: string; invited_email?: string }[] = []
  const conversions: { id: string; patient_id: string }[] = []

  for (const p of registered) {
    if (linkedPatientIds.has(p.id)) continue
    const email = p.email?.toLowerCase()
    const freeId = email ? freeByEmail.get(email) : undefined
    if (freeId) {
      conversions.push({ id: freeId, patient_id: p.id })
      if (email) freeByEmail.delete(email)
    } else {
      inserts.push({ practitioner_id: practitionerId, patient_id: p.id, display_name: p.name })
    }
  }

  const registeredEmails = new Set(registered.map(p => p.email?.toLowerCase()).filter(Boolean))
  for (const inv of pending) {
    const email = inv.email.toLowerCase()
    if (registeredEmails.has(email) || coveredInvitedEmails.has(email)) continue
    inserts.push({ practitioner_id: practitionerId, invited_email: inv.email, display_name: inv.name || inv.email })
  }

  if (inserts.length > 0) await supabase.from('caseload_entries').insert(inserts)
  for (const c of conversions) {
    await supabase.from('caseload_entries').update({ patient_id: c.patient_id, invited_email: null }).eq('id', c.id)
  }

  return { created: inserts.length, linked: conversions.length }
}

/** Crée un dossier et, si fournie, sa première action — renvoie la ligne assemblée. */
export async function createEntryWithFirstAction(
  practitionerId: string,
  params: { displayName: string; actionLabel?: string; actionDue?: string | null }
): Promise<{ ok: boolean; row?: CaseloadRowData }> {
  const entryResult = await createCaseloadEntry(practitionerId, { display_name: params.displayName })
  if (!entryResult.ok || !entryResult.entry) return { ok: false }

  let actions: CaseloadAction[] = []
  const label = params.actionLabel?.trim()
  if (label) {
    const actionResult = await createCaseloadAction(practitionerId, entryResult.entry.id, {
      label,
      due_date: params.actionDue ?? null,
    })
    if (actionResult.ok && actionResult.action) actions = [actionResult.action]
  }

  return { ok: true, row: { entry: entryResult.entry, actions, waits: [] } }
}

/** Met à jour les champs éditables d'un dossier (édition inline). */
export async function updateCaseloadEntry(
  entryId: string,
  patch: CaseloadEntryInput
): Promise<{ ok: boolean; entry?: CaseloadEntry }> {
  const { data, error } = await supabase
    .from('caseload_entries')
    .update(patch)
    .eq('id', entryId)
    .select(ENTRY_COLUMNS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, entry: data as CaseloadEntry }
}

/** Change le statut d'un dossier et synchronise `archived_at` en conséquence. */
export async function setCaseloadStatus(
  entryId: string,
  status: CaseloadStatus
): Promise<{ ok: boolean; entry?: CaseloadEntry }> {
  const { data, error } = await supabase
    .from('caseload_entries')
    .update({ status, archived_at: status === 'archived' ? new Date().toISOString() : null })
    .eq('id', entryId)
    .select(ENTRY_COLUMNS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, entry: data as CaseloadEntry }
}

/** Ajoute une action à un dossier. `label` est obligatoire (validé en amont). */
export async function createCaseloadAction(
  practitionerId: string,
  entryId: string,
  input: CaseloadActionInput
): Promise<{ ok: boolean; action?: CaseloadAction }> {
  const label = input.label?.trim()
  if (!label) return { ok: false }

  const { data, error } = await supabase
    .from('caseload_actions')
    .insert({ ...input, label, entry_id: entryId, practitioner_id: practitionerId })
    .select(ACTION_COLUMNS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, action: data as CaseloadAction }
}

/** Met à jour une action (label, échéance, ordre…). */
export async function updateCaseloadAction(
  actionId: string,
  patch: CaseloadActionInput
): Promise<{ ok: boolean; action?: CaseloadAction }> {
  const { data, error } = await supabase
    .from('caseload_actions')
    .update(patch)
    .eq('id', actionId)
    .select(ACTION_COLUMNS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, action: data as CaseloadAction }
}

/** Coche / décoche une action et synchronise `done_at`. */
export async function setActionDone(
  actionId: string,
  isDone: boolean
): Promise<{ ok: boolean; action?: CaseloadAction }> {
  const { data, error } = await supabase
    .from('caseload_actions')
    .update({ is_done: isDone, done_at: isDone ? new Date().toISOString() : null })
    .eq('id', actionId)
    .select(ACTION_COLUMNS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, action: data as CaseloadAction }
}

/** Supprime une action. */
export async function deleteCaseloadAction(actionId: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.from('caseload_actions').delete().eq('id', actionId)
  return { ok: !error }
}

// ---- Attentes de retour (caseload_waits) ----

/** Ajoute une attente de retour à un dossier. `label` est obligatoire (validé en amont). */
export async function createCaseloadWait(
  practitionerId: string,
  entryId: string,
  input: CaseloadWaitInput
): Promise<{ ok: boolean; wait?: CaseloadWait }> {
  const label = input.label?.trim()
  if (!label) return { ok: false }

  const { data, error } = await supabase
    .from('caseload_waits')
    .insert({ ...input, label, entry_id: entryId, practitioner_id: practitionerId })
    .select(WAIT_COLUMNS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, wait: data as CaseloadWait }
}

/** Met à jour une attente (libellé, date de relance). */
export async function updateCaseloadWait(
  waitId: string,
  patch: CaseloadWaitInput
): Promise<{ ok: boolean; wait?: CaseloadWait }> {
  const { data, error } = await supabase
    .from('caseload_waits')
    .update(patch)
    .eq('id', waitId)
    .select(WAIT_COLUMNS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, wait: data as CaseloadWait }
}

/** Supprime une attente (le retour est arrivé). */
export async function deleteCaseloadWait(waitId: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.from('caseload_waits').delete().eq('id', waitId)
  return { ok: !error }
}

// ---- Observations (journal daté caseload_notes) ----

/** Historique des observations d'un dossier (la plus récente en premier). */
export async function fetchCaseloadNotes(entryId: string): Promise<CaseloadNote[]> {
  const { data, error } = await supabase
    .from('caseload_notes')
    .select(NOTE_COLUMNS)
    .eq('entry_id', entryId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as CaseloadNote[]
}

/** Ajoute une observation (la nouvelle devient l'actuelle, les anciennes restent dans l'historique). */
export async function createCaseloadNote(
  practitionerId: string,
  entryId: string,
  body: string
): Promise<{ ok: boolean; note?: CaseloadNote }> {
  const trimmed = body.trim()
  if (!trimmed) return { ok: false }

  const { data, error } = await supabase
    .from('caseload_notes')
    .insert({ entry_id: entryId, practitioner_id: practitionerId, body: trimmed })
    .select(NOTE_COLUMNS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, note: data as CaseloadNote }
}

/** Supprime une observation de l'historique. */
export async function deleteCaseloadNote(noteId: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.from('caseload_notes').delete().eq('id', noteId)
  return { ok: !error }
}
