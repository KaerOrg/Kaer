import { supabase } from '../lib/supabase'
import type { RenderMismatch, RenderMismatchDescriptor } from '@kaer/shared'

// #90 — Diagnostics du moteur de rendu (web praticien).
//
// Signale à l'edge function `report-render-mismatch` qu'une config n'a pas pu être
// affichée (preview_kind / field_type / widget_type / text_code orphelin). La dédup,
// le cooldown et le coupe-circuit vivent côté edge function — ce service n'est qu'un
// émetteur **fire-and-forget** : il ne bloque jamais le rendu et n'échoue jamais
// bruyamment (un échec réseau est silencieusement ignoré).
//
// ⚠️ MDR / RGPD : on n'envoie QUE de la config structurelle, jamais de donnée patient.

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0'

// Le contexte commun (plateforme + version) est ajouté ici : l'appelant (le détecteur
// pur `collectRenderMismatches`) ne fournit que la nature du non-match.
export function reportRenderMismatch(input: RenderMismatchDescriptor): void {
  const body: RenderMismatch = { ...input, platform: 'web', app_version: APP_VERSION }
  // Fire-and-forget : on ne `await` pas et on avale toute erreur (réseau, edge down).
  void supabase.functions.invoke('report-render-mismatch', { body }).catch(() => {})
}
