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
// module_id en dur.
//
// Conformité MDR 2017/745 : routage UX purement structurel (« des données existent-elles
// pour ce module ? »), aucune interprétation de donnée de santé. Ce commentaire de
// doctrine est cité par la Séquence du plan de sécurité (P-7), qui applique le même
// raisonnement au saut des étapes vides : « existe-t-il quelque chose à afficher ? »
// est un routage, pas une lecture de donnée de santé.
//
// NB : les preview_kinds à setup-fallback sont des layouts basés sur `plan_items` ;
// c'est cette présence d'items que l'écran contrôle pour dériver `hasEntries`.
//
// ── Pourquoi la map est vide aujourd'hui (P-1, #316) ────────────────────────
//
// `safety_plan` y figurait : un plan vide ouvrait directement l'Édition, pour que la
// configuration initiale se fasse en consultation avec le praticien. Ce détour n'a
// plus lieu d'être depuis que le praticien écrit **directement** dans le plan depuis
// le web (PW-1, #320) : la bascule servait à contourner le fait qu'il ne pouvait pas.
//
// Elle avait aussi un effet de bord contraire à l'intention : un patient qui ouvrait
// « Mon plan de sécurité » un jour de vide tombait sur un formulaire, alors qu'il
// voulait relire. Le mécanisme est conservé, déclaratif et testé : il resservira au
// premier module qui aura une vraie configuration initiale à faire en séance.
const SETUP_FALLBACK: Partial<Record<PreviewKind, PreviewKind>> = {}

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
