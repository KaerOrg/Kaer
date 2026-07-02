import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { createClient } from '@supabase/supabase-js'
import type { AppError } from '@kaer/shared'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'
const REPORT_APP_ERROR_URL = `${supabaseUrl}/functions/v1/report-app-error`

// #96 — Chokepoint unique des opérations réseau échouées : cette fonction `fetch`
// personnalisée voit CHAQUE appel du client Supabase (REST + edge functions), sans
// modifier un seul fichier de service existant. N'alerte que sur les 5xx et les
// échecs réseau (toujours anormaux) — jamais sur un 4xx, qui recouvre autant de
// bugs que de flux attendus (token d'invitation invalide…) et créerait un bruit
// d'alerte massif s'il déclenchait un email automatique. Un 4xx jugé anormal par
// un service se signale explicitement via `reportFailedOperation`
// (`services/errorReportingService.ts`).
//
// Envoi en `fetch` brut (pas `supabase.functions.invoke`) pour éviter un cycle
// d'import avec `services/errorReportingService.ts`, qui importe `supabase` d'ici.
// Best-effort direct : contrairement au service, ce chokepoint n'a pas accès à
// la file SQLite offline (elle dépend elle-même de `getDb()` → cycle) — un échec
// réseau au moment du signalement est silencieusement ignoré, sans conséquence
// patient (télémétrie technique, jamais bloquante).
//
// Endpoint en échec, SANS sa query string : la query PostgREST porte souvent un
// identifiant dynamique (`?id=eq.<uuid>`) — l'inclure ferait exploser le nombre
// de signatures (une par id distinct) au lieu d'une par endpoint cassé.
function endpointRoute(failingUrl: string): string {
  return failingUrl.split('?')[0]
}

// `route` porte l'URL de l'endpoint en échec (pas un écran, indisponible à ce
// niveau côté mobile) : c'est l'information qui distingue deux échecs distincts
// dans la signature de déduplication (`platform+kind+route+message`) — sans
// elle, deux endpoints différents renvoyant le même statut HTTP collapseraient
// sur une seule signature et se masqueraient mutuellement.
function reportFailedOperation(message: string, failingUrl: string): void {
  const body: AppError = { kind: 'failed_operation', message, route: endpointRoute(failingUrl), stack: null, reason: null, platform: 'mobile', app_version: APP_VERSION }
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
  // déclencherait une boucle de rapports qui épuise le coupe-circuit partagé au
  // moment précis où les vraies alertes en ont le plus besoin.
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
  },
  global: { fetch: reportingFetch },
})
