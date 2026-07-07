// #96 — Logique pure de l'edge function `report-app-error`.
//
// Généralisation de la logique `report-render-mismatch` (#90) à deux catégories
// d'erreur applicative : `crash` (exception de rendu / promise rejection non
// gérée) et `failed_operation` (échec réseau ou serveur). Sépare la part
// testable sans Postgres ni Resend (validation du payload, calcul de signature,
// décision d'envoi d'email : déduplication + cooldown + coupe-circuit) du
// câblage `index.ts` (Supabase service_role + Resend). Testée via un faux
// `AppErrorStore` et un faux `Mailer` enregistreurs.
//
// ⚠️ MDR / RGPD : ce module ne manipule QUE de la télémétrie technique (message,
// route, kind, trace d'appel tronquée). Aucune donnée patient n'y transite.
//
// Exécution : `deno test supabase/functions/report-app-error/` (job CI « Edge — Tests »).

export const APP_ERROR_KINDS = ['crash', 'failed_operation'] as const
export type AppErrorKind = (typeof APP_ERROR_KINDS)[number]

export const PLATFORMS = ['web', 'mobile'] as const
export type Platform = (typeof PLATFORMS)[number]

// Trace d'appel tronquée avant persistance / email — jamais de trace illimitée.
export const STACK_MAX_LENGTH = 2000

// Payload reçu des apps (web praticien / mobile patient).
export interface AppErrorPayload {
  platform: Platform
  app_version: string
  kind: AppErrorKind
  message: string
  route: string | null
  stack: string | null
  reason: string | null
}

// Ligne persistée pour une signature (sous-ensemble utile à la décision d'email).
export interface AppErrorLogRow {
  signature: string
  occurrence_count: number
  email_sent_at: string | null
}

export interface DbResult<T> {
  data: T
  error: { message: string } | null
}

// Abstraction d'accès table — implémentée par Supabase en prod, par un faux en test.
export interface AppErrorStore {
  findBySignature(signature: string): Promise<DbResult<AppErrorLogRow | null>>
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

export interface InsertRow extends AppErrorPayload {
  occurred_at: string
  last_seen_at: string
  signature: string
  occurrence_count: number
  email_sent_at: string | null
}

export interface Mailer {
  send(payload: AppErrorPayload, signature: string, occurrenceCount: number): Promise<void>
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
// Reconstruit un payload propre depuis un JSON arbitraire. Tout champ inattendu
// est ignoré (aucune donnée patient ne peut donc transiter, même envoyée par erreur).

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function truncateStack(v: string | null): string | null {
  return v === null ? null : v.slice(0, STACK_MAX_LENGTH)
}

export function validatePayload(raw: unknown): AppErrorPayload | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>

  const platform = r.platform
  if (platform !== 'web' && platform !== 'mobile') return null

  const kind = r.kind
  if (!APP_ERROR_KINDS.includes(kind as AppErrorKind)) return null

  const message = asString(r.message)
  if (!message) return null

  return {
    platform,
    app_version: asString(r.app_version) ?? 'unknown',
    kind: kind as AppErrorKind,
    message,
    route: asString(r.route),
    stack: truncateStack(asString(r.stack)),
    reason: asString(r.reason),
  }
}

// ─── Échappement HTML (email) ──────────────────────────────────────────────────
// Le contenu du rapport (message/route/reason/stack) vient de l'app cliente et
// n'est jamais garanti innocent (payload forgé) : échapper avant interpolation
// dans le HTML de l'email, sans quoi une balise injectée s'exécuterait dans le
// client mail du destinataire.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Signature de déduplication ───────────────────────────────────────────────
// Un problème distinct = une signature. Volontairement SANS `stack` (une même
// erreur produit des traces légèrement différentes selon le contexte d'appel,
// sans changer la nature du problème) ni `app_version` (une montée de version
// ne re-spamme pas un problème déjà connu).

export function computeSignature(p: AppErrorPayload): string {
  return [p.platform, p.kind, p.route ?? '', p.message].join('|')
}

// ─── Décision d'envoi ─────────────────────────────────────────────────────────
// Coupe-circuit d'abord (plafond global emails/fenêtre), puis cooldown par signature.

export function cooldownElapsed(emailSentAt: string | null, now: Date, cooldownMs: number): boolean {
  if (!emailSentAt) return true
  return now.getTime() - new Date(emailSentAt).getTime() >= cooldownMs
}

// ─── Orchestration ────────────────────────────────────────────────────────────

export async function runReport(
  store: AppErrorStore,
  mailer: Mailer,
  payload: AppErrorPayload,
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

  // Persistance SANS marquer l'email comme envoyé : `email_sent_at` n'est posé
  // qu'après un envoi RÉELLEMENT confirmé (plus bas). Le poser ici de façon
  // optimiste figerait le cooldown sur un email jamais délivré si Resend
  // échoue, rendant tout crash suivant silencieux pendant 24h alors qu'aucune
  // alerte n'a jamais atteint personne.
  if (!existing) {
    const ins = await store.insert({
      ...payload,
      occurred_at: nowIso,
      last_seen_at: nowIso,
      signature,
      occurrence_count: 1,
      email_sent_at: null,
    })
    if (ins.error) return { ok: false, created: true, emailed: false, occurrenceCount, error: ins.error.message }
  } else {
    const upd = await store.bump(signature, nowIso, occurrenceCount, null)
    if (upd.error) return { ok: false, created: false, emailed: false, occurrenceCount, error: upd.error.message }
  }

  if (!emailAllowed) {
    return { ok: true, created: !existing, emailed: false, occurrenceCount }
  }

  try {
    await mailer.send(payload, signature, occurrenceCount)
  } catch (_err) {
    // Panne Resend : ne pas marquer `email_sent_at` — la prochaine occurrence
    // retentera l'envoi immédiatement plutôt que d'attendre un cooldown de
    // 24h pour un email qui n'a jamais existé.
    return { ok: true, created: !existing, emailed: false, occurrenceCount }
  }

  // Email confirmé délivré : poser `email_sent_at` MAINTENANT (jamais avant).
  // Un échec de cette écriture reste bénin (au pire un email en double à la
  // prochaine occurrence), jamais un silence : le compromis inverse de la
  // pose optimiste ci-dessus.
  await store.bump(signature, nowIso, occurrenceCount, nowIso)

  return { ok: true, created: !existing, emailed: true, occurrenceCount }
}
