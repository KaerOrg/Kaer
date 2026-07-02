import { createClient } from '@supabase/supabase-js'
import type { AppError } from '@kaer/shared'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes dans le fichier .env')
}

// #96 — Chokepoint unique des opérations réseau échouées : cette fonction `fetch`
// personnalisée voit CHAQUE appel du client Supabase (REST + edge functions), sans
// modifier un seul fichier de service existant. N'alerte que sur les 5xx et les
// échecs réseau (toujours anormaux) — jamais sur un 4xx, qui recouvre autant de
// bugs que de flux attendus (mot de passe faux, token d'invitation invalide…) et
// créerait un bruit d'alerte massif s'il déclenchait un email automatique. Un 4xx
// jugé anormal par un service se signale explicitement via `reportFailedOperation`
// (`services/errorReportingService.ts`).
const REPORT_APP_ERROR_URL = `${supabaseUrl}/functions/v1/report-app-error`

// Endpoint en échec, SANS sa query string : la query PostgREST porte souvent un
// identifiant dynamique (`?id=eq.<uuid>`) — l'inclure ferait exploser le nombre
// de signatures (une par id distinct) au lieu d'une par endpoint cassé.
function endpointRoute(input: RequestInfo | URL): string {
  return String(input).split('?')[0]
}

// Envoi en `fetch` brut (pas `supabase.functions.invoke`) pour éviter un cycle
// d'import avec `services/errorReportingService.ts`, qui importe `supabase` d'ici.
//
// `route` porte l'endpoint en échec (pas la page courante) : c'est ce qui
// distingue deux échecs distincts dans la signature de déduplication
// (`platform+kind+route+message`) — si `route` valait la page courante, deux
// endpoints différents cassés sur la même page collapseraient sur une seule
// signature et se masqueraient mutuellement.
function reportFailedOperation(message: string, failingUrl: string): void {
  const body: AppError = { kind: 'failed_operation', message, route: endpointRoute(failingUrl), stack: null, reason: null, platform: 'web', app_version: APP_VERSION }
  void fetch(REPORT_APP_ERROR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
    body: JSON.stringify(body),
  }).catch(() => {})
}

// Exportée pour test uniquement — le reste de l'app ne connaît que `supabase`.
export function reportingFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Un envoi vers l'edge function `report-app-error` elle-même ne doit jamais se
  // re-signaler lui-même : sans cette garde, une panne de cette edge function
  // déclencherait une boucle de rapports (chaque `reportAppError` → invoke →
  // 5xx → reportFailedOperation → invoke → 5xx → …) qui épuise le coupe-circuit
  // partagé au moment précis où les vraies alertes en ont le plus besoin.
  const isReportEndpoint = String(input) === REPORT_APP_ERROR_URL
  return fetch(input, init).then(
    (res) => {
      if (res.status >= 500 && !isReportEndpoint) reportFailedOperation(`HTTP ${res.status}`, String(input))
      return res
    },
    (err: unknown) => {
      if (!isReportEndpoint) reportFailedOperation('network_error', String(input))
      throw err
    },
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: { fetch: reportingFetch },
})
