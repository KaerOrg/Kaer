// #90 — Logique pure de l'edge function `report-render-mismatch`.
//
// Sépare la part testable sans Postgres ni Resend (validation du payload, calcul de
// signature, décision d'envoi d'email : déduplication + cooldown + coupe-circuit) du
// câblage `index.ts` (Supabase service_role + Resend). Testée via un faux `MismatchStore`
// et un faux `Mailer` enregistreurs.
//
// ⚠️ MDR / RGPD : ce module ne manipule QUE de la config structurelle (preview_kind,
// field_type, widget_type, module_id…). Aucune donnée patient n'y transite.
//
// Exécution : `deno test supabase/functions/report-render-mismatch/` (job CI « Edge — Tests »).

export const MISMATCH_LEVELS = [
  'preview_kind',
  'field_type',
  'widget_type',
  'missing_text_code',
] as const
export type RenderMismatchLevel = (typeof MISMATCH_LEVELS)[number]

export const PLATFORMS = ['web', 'mobile'] as const
export type Platform = (typeof PLATFORMS)[number]

// Payload reçu des apps (web praticien / mobile patient). Tous les champs de contexte
// sont nullable : un non-match `preview_kind` n'a pas de `field_id`, etc.
export interface RenderMismatchPayload {
  platform: Platform
  app_version: string
  level: RenderMismatchLevel
  module_id: string | null
  preview_kind: string | null
  field_id: string | null
  field_type: string | null
  widget_type: string | null
  reason: string
}

// Ligne persistée pour une signature (sous-ensemble utile à la décision d'email).
export interface MismatchLogRow {
  signature: string
  occurrence_count: number
  email_sent_at: string | null
}

export interface DbResult<T> {
  data: T
  error: { message: string } | null
}

// Abstraction d'accès table — implémentée par Supabase en prod, par un faux en test.
export interface MismatchStore {
  findBySignature(signature: string): Promise<DbResult<MismatchLogRow | null>>
  // Insère une nouvelle signature. `email_sent_at` non-null ⟺ un email vient de partir.
  insert(row: InsertRow): Promise<{ error: { message: string } | null }>
  // Met à jour une signature existante (occurrence_count + last_seen_at, et
  // email_sent_at si un nouvel email vient de partir après cooldown dépassé).
  bump(
    signature: string,
    lastSeenAt: string,
    occurrenceCount: number,
    emailSentAt: string | null,
  ): Promise<{ error: { message: string } | null }>
  // Nombre de signatures ayant envoyé un email depuis `sinceIso` — alimente le coupe-circuit.
  countEmailsSince(sinceIso: string): Promise<DbResult<number>>
}

export interface InsertRow extends RenderMismatchPayload {
  occurred_at: string
  last_seen_at: string
  signature: string
  occurrence_count: number
  email_sent_at: string | null
}

export interface Mailer {
  send(payload: RenderMismatchPayload, signature: string, occurrenceCount: number): Promise<void>
}

export interface ReportOptions {
  now: Date
  cooldownMs: number
  circuitMax: number
  circuitWindowMs: number
}

export interface ReportResult {
  ok: boolean
  created: boolean
  emailed: boolean
  occurrenceCount: number
  error?: string
}

// ─── Validation ──────────────────────────────────────────────────────────────
// Reconstruit un payload propre depuis un JSON arbitraire. Tout champ inattendu est
// ignoré (aucune donnée patient ne peut donc transiter, même envoyée par erreur).

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

export function validatePayload(raw: unknown): RenderMismatchPayload | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>

  const platform = r.platform
  if (platform !== 'web' && platform !== 'mobile') return null

  const level = r.level
  if (!MISMATCH_LEVELS.includes(level as RenderMismatchLevel)) return null

  return {
    platform,
    app_version: asString(r.app_version) ?? 'unknown',
    level: level as RenderMismatchLevel,
    module_id: asString(r.module_id),
    preview_kind: asString(r.preview_kind),
    field_id: asString(r.field_id),
    field_type: asString(r.field_type),
    widget_type: asString(r.widget_type),
    reason: asString(r.reason) ?? '',
  }
}

// ─── Signature de déduplication ───────────────────────────────────────────────
// Un problème distinct = une signature. Volontairement SANS field_id (un même
// field_type cassé sur N fields ne génère pas N alertes) ni app_version (une montée
// de version ne re-spamme pas un problème déjà connu).

export function computeSignature(p: RenderMismatchPayload): string {
  return [
    p.platform,
    p.module_id ?? '',
    p.preview_kind ?? '',
    p.field_type ?? '',
    p.widget_type ?? '',
    p.reason,
  ].join('|')
}

// ─── Décision d'envoi ─────────────────────────────────────────────────────────
// Coupe-circuit d'abord (plafond global emails/fenêtre), puis cooldown par signature.

export function cooldownElapsed(emailSentAt: string | null, now: Date, cooldownMs: number): boolean {
  if (!emailSentAt) return true
  return now.getTime() - new Date(emailSentAt).getTime() >= cooldownMs
}

// ─── Orchestration ────────────────────────────────────────────────────────────

export async function runReport(
  store: MismatchStore,
  mailer: Mailer,
  payload: RenderMismatchPayload,
  opts: ReportOptions,
): Promise<ReportResult> {
  const signature = computeSignature(payload)
  const nowIso = opts.now.toISOString()

  const found = await store.findBySignature(signature)
  if (found.error) return { ok: false, created: false, emailed: false, occurrenceCount: 0, error: found.error.message }

  const existing = found.data
  const wantsEmail = existing
    ? cooldownElapsed(existing.email_sent_at, opts.now, opts.cooldownMs)
    : true

  // Coupe-circuit global : ne consulter le compteur que si on envisage un email.
  let emailAllowed = wantsEmail
  if (wantsEmail) {
    const sinceIso = new Date(opts.now.getTime() - opts.circuitWindowMs).toISOString()
    const counted = await store.countEmailsSince(sinceIso)
    if (counted.error) return { ok: false, created: false, emailed: false, occurrenceCount: 0, error: counted.error.message }
    emailAllowed = counted.data < opts.circuitMax
  }

  const occurrenceCount = (existing?.occurrence_count ?? 0) + 1
  const emailSentAt = emailAllowed ? nowIso : null

  if (!existing) {
    const ins = await store.insert({
      ...payload,
      occurred_at: nowIso,
      last_seen_at: nowIso,
      signature,
      occurrence_count: 1,
      email_sent_at: emailSentAt,
    })
    if (ins.error) return { ok: false, created: true, emailed: false, occurrenceCount, error: ins.error.message }
  } else {
    const upd = await store.bump(signature, nowIso, occurrenceCount, emailSentAt)
    if (upd.error) return { ok: false, created: false, emailed: false, occurrenceCount, error: upd.error.message }
  }

  // Email best-effort : une panne Resend ne doit pas faire échouer la persistance.
  if (emailAllowed) {
    try {
      await mailer.send(payload, signature, occurrenceCount)
    } catch (_err) {
      return { ok: true, created: !existing, emailed: false, occurrenceCount }
    }
  }

  return { ok: true, created: !existing, emailed: emailAllowed, occurrenceCount }
}
