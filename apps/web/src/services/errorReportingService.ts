import { supabase } from '../lib/supabase'
import type { AppError, AppErrorDescriptor } from '@kaer/shared'

// #96 — Alerte email sur erreur applicative (web praticien).
//
// Signale un crash (ErrorBoundary, promise rejection non gérée) ou une opération
// réseau/serveur échouée à l'edge function `report-app-error`. La dédup, le
// cooldown et le coupe-circuit vivent côté edge function (état INDÉPENDANT de
// celui du render-mismatch, #90) — ce service n'est qu'un émetteur
// **fire-and-forget** : il ne bloque jamais l'UI et n'échoue jamais bruyamment
// (un échec réseau est silencieusement ignoré).
//
// ⚠️ MDR / RGPD : on n'envoie QUE de la télémétrie technique, jamais de donnée patient.

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0'

const UUID_SEGMENT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

// Neutralise les segments dynamiques (id patient) d'un pathname avant de
// l'utiliser dans la signature de déduplication de l'edge function — sinon un
// crash systémique sur une route paramétrée (`/patient/:ref`) génère une
// signature PAR patient visité au lieu d'une seule, épuisant le coupe-circuit
// global (`APP_ERROR_CIRCUIT_MAX`) et masquant les alertes suivantes.
export function normalizeRoute(pathname: string): string {
  return pathname.replace(UUID_SEGMENT, ':id')
}

// Le contexte commun (plateforme + version) est ajouté ici : l'appelant
// (ErrorBoundary, handler global, wrapper fetch) ne fournit que la nature de l'erreur.
export function reportAppError(input: AppErrorDescriptor): void {
  const body: AppError = { ...input, platform: 'web', app_version: APP_VERSION }
  // Fire-and-forget : on ne `await` pas et on avale toute erreur (réseau, edge down).
  void supabase.functions.invoke('report-app-error', { body }).catch(() => {})
}

// Point d'extension pour signaler explicitement un échec de service jugé
// anormal (ex. un 4xx qui ne correspond à aucun flux utilisateur attendu).
// Le wrapper fetch du client Supabase (`lib/supabase.ts`) ne couvre QUE les
// 5xx et les échecs réseau — un 4xx légitime (mot de passe faux, token
// d'invitation invalide) ne doit pas déclencher d'alerte automatique. Cette
// fonction n'est câblée dans aucun service à ce jour (#96) : c'est le point
// d'entrée recommandé le jour où un service veut signaler un 4xx anormal.
export function reportFailedOperation(route: string | null, message: string, reason: string | null): void {
  reportAppError({ kind: 'failed_operation', message, route, stack: null, reason })
}

// Installe les handlers globaux (promise rejection non gérée) — appelé une
// seule fois au bootstrap (`main.tsx`). Les crashs de rendu sont couverts par
// `ErrorBoundary`, pas par ce handler.
export function installGlobalErrorHandlers(): void {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const err = event.reason
    reportAppError({
      kind: 'crash',
      message: err instanceof Error ? err.message : String(err),
      route: normalizeRoute(window.location.pathname),
      stack: err instanceof Error ? (err.stack ?? null) : null,
      reason: 'unhandled_rejection',
    })
  })
}
