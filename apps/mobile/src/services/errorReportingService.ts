import Constants from 'expo-constants'
import type { AppError, AppErrorDescriptor } from '@kaer/shared'
import { supabase } from '../lib/supabase'
import { getDb } from '../lib/database'
import { getAppErrorOutboxStore } from '../lib/appErrorOutbox'

// #96 — Alerte email sur erreur applicative (mobile patient).
//
// Signale un crash (ErrorBoundary, exception JS non gérée) ou une opération
// réseau/serveur échouée à l'edge function `report-app-error`. **Fire-and-forget** :
// ne bloque ni ne casse jamais le rendu. Offline-first : l'erreur est d'abord
// persistée dans une file SQLite dédiée (`app_error_outbox`), puis drainée au
// retour réseau (foreground) — sur le modèle exact de `renderDiagnosticsService`
// (#90). La dédup/cooldown/coupe-circuit vivent côté edge function (état
// INDÉPENDANT de celui du render-mismatch).
//
// ⚠️ MDR / RGPD : télémétrie TECHNIQUE, zéro donnée patient. Cette file NE passe
// donc PAS par syncHelpers/patient_entries ni par la gate de consentement —
// exception légitime documentée (cf. sync-service.md § exceptions : pas de
// donnée patient).

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'

const outbox = () => getAppErrorOutboxStore(getDb())

export async function reportAppError(input: AppErrorDescriptor): Promise<void> {
  const payload: AppError = { ...input, platform: 'mobile', app_version: APP_VERSION }
  try {
    await outbox().enqueue(payload)
  } catch {
    // SQLite indisponible : on n'échoue jamais bruyamment, on tente l'envoi direct.
    void sendOne(payload)
    return
  }
  void flushAppErrorOutbox()
}

// Point d'extension pour signaler explicitement un échec de service jugé
// anormal (ex. un 4xx qui ne correspond à aucun flux utilisateur attendu). Le
// wrapper fetch du client Supabase (`lib/supabase.ts`) ne couvre QUE les 5xx et
// les échecs réseau — un 4xx légitime (token d'invitation invalide) ne doit pas
// déclencher d'alerte automatique. Cette fonction n'est câblée dans aucun
// service à ce jour (#96) : c'est le point d'entrée recommandé le jour où un
// service veut signaler un 4xx anormal.
export function reportFailedOperation(route: string | null, message: string, reason: string | null): void {
  void reportAppError({ kind: 'failed_operation', message, route, stack: null, reason })
}

// Installe le handler global RN (exceptions JS non gérées, y compris la
// plupart des promise rejections non gérées remontées par Hermes) — appelé
// une seule fois au bootstrap (`App.tsx`). Les crashs de rendu sont couverts
// par `ErrorBoundary`, pas par ce handler.
export function installGlobalErrorHandlers(): void {
  const previousHandler = ErrorUtils.getGlobalHandler()
  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    // Sur une erreur FATALE, `previousHandler` peut terminer le process juste
    // après cet appel : on attend la persistance SQLite (rapide, locale, pas de
    // réseau) avant de le laisser s'exécuter, pour ne pas perdre le rapport du
    // crash même si le flush réseau qui suit reste, lui, best-effort.
    void reportAppError({
      kind: 'crash',
      message: error instanceof Error ? error.message : String(error),
      route: null,
      stack: error instanceof Error ? (error.stack ?? null) : null,
      reason: isFatal ? 'fatal' : 'non_fatal',
    }).finally(() => previousHandler(error, isFatal ?? false))
  })
}

async function sendOne(payload: AppError): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('report-app-error', { body: payload })
    return !error
  } catch {
    return false
  }
}

// Draine la file vers l'edge function. Au premier échec réseau, on s'arrête et
// on garde le reste pour le prochain flush (retour foreground). À appeler aussi
// au retour d'app au premier plan (cf. useSyncOnForeground).
export async function flushAppErrorOutbox(): Promise<void> {
  let rows
  try {
    rows = await outbox().getPending()
  } catch {
    return
  }
  for (const row of rows) {
    const ok = await sendOne(row.payload)
    if (!ok) return
    try {
      await outbox().markDone(row.id)
    } catch {
      return
    }
  }
}
