import type { PreviewKind } from '@kaer/shared'

// ─── Bascule « config-first quand vide » à l'ouverture nue d'un module ──────────
//
// Certains layouts de consultation basculent vers leur layout de PARAMÉTRAGE tant que
// le patient n'a rien saisi : la configuration initiale doit se faire en consultation
// avec le praticien, donc la première ouverture (plan encore vide) arrive directement
// sur le paramétrage ; dès qu'au moins un élément est saisi, l'ouverture nominale
// revient à la vue de consultation.
//
// Déclaratif et générique : la règle est portée par le preview_kind, jamais par un
// module_id en dur. Aujourd'hui seul `safety_plan` (crisis_plan) l'utilise, basculant
// vers `editable_steps` tant que le plan de sécurité ne contient aucun `plan_item`.
//
// Conformité MDR 2017/745 : routage UX purement structurel (« des données existent-elles
// pour ce module ? »), aucune interprétation de donnée de santé.
//
// NB : les preview_kinds à setup-fallback sont des layouts basés sur `plan_items` ;
// c'est cette présence d'items que l'écran contrôle pour dériver `hasEntries`.
const SETUP_FALLBACK: Partial<Record<PreviewKind, PreviewKind>> = {
  safety_plan: 'editable_steps',
}

/** Ce preview_kind bascule-t-il vers un layout de paramétrage tant que ses données sont vides ? */
export function hasSetupFallback(previewKind: PreviewKind): boolean {
  return previewKind in SETUP_FALLBACK
}

/**
 * Layout effectif à l'ouverture nue (sans override) : le layout de paramétrage tant que
 * les données du module sont vides, sinon le layout de consultation nominal.
 */
export function resolveInitialPreviewKind(previewKind: PreviewKind, hasEntries: boolean): PreviewKind {
  const fallback = SETUP_FALLBACK[previewKind]
  return fallback != null && !hasEntries ? fallback : previewKind
}
