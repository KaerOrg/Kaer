import Constants from 'expo-constants'
import type { RenderMismatch, RenderMismatchDescriptor } from '@kaer/shared'
import { supabase } from '../lib/supabase'
import { getDb } from '../lib/database'
import { getRenderMismatchOutboxStore } from '../lib/renderMismatchOutbox'

// #90 — Diagnostics du moteur de rendu (mobile patient).
//
// Signale un non-match (preview_kind / field_type / widget_type orphelin) à l'edge
// function `report-render-mismatch`. **Fire-and-forget** : ne bloque ni ne casse jamais
// le rendu. Offline-first : le non-match est d'abord persisté dans une file SQLite
// dédiée (`render_mismatch_outbox`), puis drainé au retour réseau (foreground).
//
// ⚠️ MDR / RGPD : télémétrie TECHNIQUE, zéro donnée patient. Cette file NE passe donc
// PAS par syncHelpers/patient_entries ni par la gate de consentement — exception
// légitime documentée (cf. sync-service.md § exceptions : pas de donnée patient).

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'

const outbox = () => getRenderMismatchOutboxStore(getDb())

export async function reportRenderMismatch(input: RenderMismatchDescriptor): Promise<void> {
  const payload: RenderMismatch = { ...input, platform: 'mobile', app_version: APP_VERSION }
  try {
    await outbox().enqueue(payload)
  } catch {
    // SQLite indisponible : on n'échoue jamais bruyamment, on tente l'envoi direct.
    void sendOne(payload)
    return
  }
  void flushRenderMismatchOutbox()
}

async function sendOne(payload: RenderMismatch): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('report-render-mismatch', { body: payload })
    return !error
  } catch {
    return false
  }
}

// Draine la file vers l'edge function. Au premier échec réseau, on s'arrête et on
// garde le reste pour le prochain flush (retour foreground). À appeler aussi au
// retour d'app au premier plan (cf. useSyncOnForeground).
export async function flushRenderMismatchOutbox(): Promise<void> {
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
