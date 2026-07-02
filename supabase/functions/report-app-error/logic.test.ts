// #96 — Tests de la logique pure de `report-app-error`.
//
// Couvre validation du payload (dont la troncature de `stack`), calcul de
// signature, et orchestration `runReport` (déduplication, cooldown, coupe-
// circuit, tolérance aux pannes) via un faux `AppErrorStore` et un faux
// `Mailer` enregistreurs — sans Postgres ni Resend.
//
// Exécution : `deno test supabase/functions/report-app-error/` (job CI « Edge — Tests »).

import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@1'
import {
  type AppErrorLogRow,
  type AppErrorPayload,
  type AppErrorStore,
  computeSignature,
  cooldownElapsed,
  escapeHtml,
  type InsertRow,
  type Mailer,
  runReport,
  STACK_MAX_LENGTH,
  validatePayload,
} from './logic.ts'

const BASE: AppErrorPayload = {
  platform: 'mobile',
  app_version: '1.0.0',
  kind: 'crash',
  message: 'Cannot read property foo of undefined',
  route: 'ModuleContentScreen',
  stack: 'TypeError: ...\n  at render (App.tsx:1:1)',
  reason: null,
}

const HOUR = 60 * 60 * 1000
const OPTS = { now: new Date('2026-06-29T12:00:00Z'), cooldownMs: 24 * HOUR, circuitMax: 20, circuitWindowMs: HOUR }

// --- Faux store / mailer ----------------------------------------------------

interface FakeStoreOptions {
  existing?: AppErrorLogRow | null
  emailsInWindow?: number
  findError?: string
  insertError?: string
  bumpError?: string
  countError?: string
}

interface RecordingStore extends AppErrorStore {
  inserts: InsertRow[]
  bumps: Array<{ signature: string; lastSeenAt: string; occurrenceCount: number; emailSentAt: string | null }>
}

function makeStore(opts: FakeStoreOptions = {}): RecordingStore {
  const inserts: InsertRow[] = []
  const bumps: RecordingStore['bumps'] = []
  return {
    inserts,
    bumps,
    findBySignature: () =>
      Promise.resolve(
        opts.findError
          ? { data: null, error: { message: opts.findError } }
          : { data: opts.existing ?? null, error: null },
      ),
    insert: (row) => {
      inserts.push(row)
      return Promise.resolve({ error: opts.insertError ? { message: opts.insertError } : null })
    },
    bump: (signature, lastSeenAt, occurrenceCount, emailSentAt) => {
      bumps.push({ signature, lastSeenAt, occurrenceCount, emailSentAt })
      return Promise.resolve({ error: opts.bumpError ? { message: opts.bumpError } : null })
    },
    countEmailsSince: () =>
      Promise.resolve(
        opts.countError
          ? { data: 0, error: { message: opts.countError } }
          : { data: opts.emailsInWindow ?? 0, error: null },
      ),
  }
}

function makeMailer(fail = false): Mailer & { sent: number } {
  const m = {
    sent: 0,
    send: () => {
      m.sent++
      if (fail) return Promise.reject(new Error('resend down'))
      return Promise.resolve()
    },
  }
  return m
}

// --- validatePayload --------------------------------------------------------

Deno.test('validatePayload accepte un payload valide et conserve le contexte', () => {
  const p = validatePayload({ ...BASE, extra: 'patient secret' })
  assert(p)
  assertEquals(p.message, BASE.message)
  // Tout champ inattendu (ex. donnée patient envoyée par erreur) est ignoré.
  assertFalse('extra' in p)
})

Deno.test('validatePayload rejette une plateforme inconnue', () => {
  assertEquals(validatePayload({ ...BASE, platform: 'desktop' }), null)
})

Deno.test('validatePayload rejette un kind inconnu', () => {
  assertEquals(validatePayload({ ...BASE, kind: 'whatever' }), null)
})

Deno.test('validatePayload rejette un message vide ou absent', () => {
  assertEquals(validatePayload({ ...BASE, message: '' }), null)
  assertEquals(validatePayload({ ...BASE, message: undefined }), null)
})

Deno.test('validatePayload rejette une entrée non-objet', () => {
  assertEquals(validatePayload('nope'), null)
  assertEquals(validatePayload(null), null)
})

Deno.test('validatePayload défaut app_version=unknown si absent', () => {
  const p = validatePayload({ ...BASE, app_version: undefined })
  assertEquals(p?.app_version, 'unknown')
})

Deno.test('validatePayload tronque une trace d\'appel trop longue', () => {
  const longStack = 'x'.repeat(STACK_MAX_LENGTH + 500)
  const p = validatePayload({ ...BASE, stack: longStack })
  assertEquals(p?.stack?.length, STACK_MAX_LENGTH)
})

// --- escapeHtml --------------------------------------------------------------

Deno.test('escapeHtml neutralise les métacaractères HTML', () => {
  assertEquals(
    escapeHtml(`<img src=x onerror=alert(1)> & "quoted" & 'single'`),
    '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quoted&quot; &amp; &#39;single&#39;',
  )
})

Deno.test('escapeHtml laisse intact un texte sans métacaractère', () => {
  assertEquals(escapeHtml('Cannot read property foo of undefined'), 'Cannot read property foo of undefined')
})

// --- computeSignature -------------------------------------------------------

Deno.test('computeSignature ignore stack et app_version', () => {
  const a = computeSignature({ ...BASE, stack: 'trace A', app_version: '1.0.0' })
  const b = computeSignature({ ...BASE, stack: 'trace B', app_version: '2.0.0' })
  assertEquals(a, b)
})

Deno.test('computeSignature distingue deux messages/routes différents', () => {
  assert(computeSignature(BASE) !== computeSignature({ ...BASE, message: 'autre erreur' }))
  assert(computeSignature(BASE) !== computeSignature({ ...BASE, route: 'AutreEcran' }))
})

// --- cooldownElapsed --------------------------------------------------------

Deno.test('cooldownElapsed vrai si jamais envoyé', () => {
  assert(cooldownElapsed(null, OPTS.now, OPTS.cooldownMs))
})

Deno.test('cooldownElapsed faux dans la fenêtre, vrai au-delà', () => {
  const recent = new Date(OPTS.now.getTime() - 1 * HOUR).toISOString()
  const old = new Date(OPTS.now.getTime() - 25 * HOUR).toISOString()
  assertFalse(cooldownElapsed(recent, OPTS.now, OPTS.cooldownMs))
  assert(cooldownElapsed(old, OPTS.now, OPTS.cooldownMs))
})

// --- runReport : 1ʳᵉ occurrence ---------------------------------------------

Deno.test('runReport — nouvelle signature : insert (email_sent_at=null) puis bump de confirmation après envoi', async () => {
  const store = makeStore()
  const mailer = makeMailer()
  const r = await runReport(store, mailer, BASE, OPTS)

  assert(r.ok)
  assert(r.created)
  assert(r.emailed)
  assertEquals(r.occurrenceCount, 1)
  assertEquals(store.inserts.length, 1)
  assertEquals(store.inserts[0].occurrence_count, 1)
  // L'insert ne marque JAMAIS l'email comme envoyé de façon optimiste.
  assertEquals(store.inserts[0].email_sent_at, null)
  // La confirmation d'envoi passe par un bump dédié, après coup.
  assertEquals(store.bumps.length, 1)
  assert(store.bumps[0].emailSentAt)
  assertEquals(mailer.sent, 1)
})

// --- runReport : déduplication ----------------------------------------------

Deno.test('runReport — signature connue, cooldown NON dépassé : bump sans email', async () => {
  const recent = new Date(OPTS.now.getTime() - 1 * HOUR).toISOString()
  const store = makeStore({ existing: { signature: 's', occurrence_count: 49, email_sent_at: recent } })
  const mailer = makeMailer()
  const r = await runReport(store, mailer, BASE, OPTS)

  assert(r.ok)
  assertFalse(r.created)
  assertFalse(r.emailed)
  assertEquals(r.occurrenceCount, 50)
  assertEquals(store.bumps.length, 1)
  assertEquals(store.bumps[0].occurrenceCount, 50)
  // Pas de nouvel email → email_sent_at non touché.
  assertEquals(store.bumps[0].emailSentAt, null)
  assertEquals(mailer.sent, 0)
})

Deno.test('runReport — signature connue, cooldown dépassé : bump puis bump de confirmation après envoi', async () => {
  const old = new Date(OPTS.now.getTime() - 25 * HOUR).toISOString()
  const store = makeStore({ existing: { signature: 's', occurrence_count: 3, email_sent_at: old } })
  const mailer = makeMailer()
  const r = await runReport(store, mailer, BASE, OPTS)

  assert(r.emailed)
  // Premier bump : occurrence_count/last_seen_at, SANS marquer l'email.
  assertEquals(store.bumps.length, 2)
  assertEquals(store.bumps[0].occurrenceCount, 4)
  assertEquals(store.bumps[0].emailSentAt, null)
  // Second bump : confirmation d'envoi, après coup.
  assertEquals(store.bumps[1].occurrenceCount, 4)
  assert(store.bumps[1].emailSentAt)
  assertEquals(mailer.sent, 1)
})

// --- runReport : coupe-circuit ----------------------------------------------

Deno.test('runReport — coupe-circuit : plafond atteint → persiste mais pas d\'email', async () => {
  const store = makeStore({ emailsInWindow: 20 })
  const mailer = makeMailer()
  const r = await runReport(store, mailer, BASE, OPTS)

  assert(r.ok)
  assert(r.created)
  assertFalse(r.emailed)
  // La ligne est tout de même créée (la table enregistre tout), sans email_sent_at.
  assertEquals(store.inserts.length, 1)
  assertEquals(store.inserts[0].email_sent_at, null)
  // Coupe-circuit → on ne tente même pas l'envoi, donc aucun bump de confirmation.
  assertEquals(store.bumps.length, 0)
  assertEquals(mailer.sent, 0)
})

// --- runReport : robustesse -------------------------------------------------

Deno.test('runReport — erreur de lecture remonte sans rien écrire', async () => {
  const store = makeStore({ findError: 'db down' })
  const mailer = makeMailer()
  const r = await runReport(store, mailer, BASE, OPTS)

  assertFalse(r.ok)
  assertEquals(r.error, 'db down')
  assertEquals(store.inserts.length, 0)
  assertEquals(mailer.sent, 0)
})

Deno.test('runReport — panne Resend tolérée : persistance OK, emailed=false, cooldown PAS posé', async () => {
  const store = makeStore()
  const mailer = makeMailer(true)
  const r = await runReport(store, mailer, BASE, OPTS)

  assert(r.ok)
  assert(r.created)
  assertFalse(r.emailed)
  assertEquals(store.inserts.length, 1)
  assertEquals(store.inserts[0].email_sent_at, null)
  // Envoi jamais confirmé → aucun bump de confirmation (le cooldown ne se
  // fige pas sur un email qui n'a jamais existé).
  assertEquals(store.bumps.length, 0)
})
