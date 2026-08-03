// ─── Plan de sécurité : nature d'un item, et colonnes d'une étape ────────────
//
// Une seule source pour les deux apps. Le mobile (P-14) et le web (PW-3) portent les
// mêmes trois champs `kind` / `role` / `note` sur un item du plan : les déclarer deux
// fois, c'est se garantir qu'ils divergeront.
//
// ── Conformité MDR 2017/745 ─────────────────────────────────────────────────
//
// **Aucune valeur n'est déduite du contenu.** `kind` n'est jamais inféré du texte de
// l'item : « Yasmine » ne devient pas une personne, « le parc » ne devient pas un lieu.
// Il est rempli en consultation, ou il reste vide. Une déduction serait une lecture du
// contenu patient, et l'ouverture d'une porte que l'Epic #315 ferme partout ailleurs.

/**
 * Nature d'un item du plan : une personne qu'on joint, ou un lieu où l'on va.
 *
 * Union fermée, jamais un `string` libre : un `kind` inattendu doit être une erreur de
 * compilation, pas un rendu silencieusement faux.
 */
export type PlanItemKind = 'person' | 'place'

/** Les valeurs admises, dans l'ordre d'affichage. Source des options du sélecteur. */
export const PLAN_ITEM_KINDS: readonly PlanItemKind[] = ['person', 'place']

/**
 * Lit un `kind` venu du serveur ou de SQLite, où la colonne est un `text` libre.
 *
 * Retourne `null` pour toute valeur inconnue, y compris une chaîne vide. C'est ce qui
 * permet de typer `kind` en union **sans `as`** : la conversion se fait par une
 * vérification à l'exécution, jamais par une assertion qui ment au compilateur.
 *
 * Un item enregistré avant P-14 n'a pas de `kind` : il se lit ici comme `null` et
 * s'édite sans rien casser.
 */
export function parsePlanItemKind(value: string | null | undefined): PlanItemKind | null {
  return value === 'person' || value === 'place' ? value : null
}

/**
 * Les colonnes qu'une étape affiche dans l'éditeur praticien.
 *
 * `text` n'y figure pas : il est toujours là, c'est l'item lui-même. Les autres sont
 * des précisions, jamais des conditions : le formulaire n'exige que le texte.
 */
export interface StepColumns {
  readonly kind: boolean
  readonly role: boolean
  readonly phone: boolean
  readonly note: boolean
}

const NO_COLUMNS: StepColumns = { kind: false, role: false, phone: false, note: false }

/**
 * Colonnes d'une étape, **déduites de sa configuration** et jamais d'un numéro d'étape
 * en dur : un plan reconfiguré en base doit changer de colonnes sans toucher au code.
 *
 * - `contactable` (défaut d'étape, déjà porté par le `step_title` des étapes 4 et 5) →
 *   lien ou fonction, téléphone, et une ligne libre.
 * - `mixed_kind` → l'étape mélange des personnes et des lieux, donc la colonne `kind`
 *   s'ajoute. C'est le cas de l'étape 3 (« Où aller, qui voir »), que le seul drapeau
 *   `contactable` ne savait pas décrire : `kind` surcharge le défaut d'étape au niveau
 *   de l'item.
 * - `measure_editor` (étape 6) → aucune colonne : l'étape a son propre éditeur (PW-4).
 */
export function readStepColumns(props: Readonly<Record<string, string>>): StepColumns {
  if (props['measure_editor'] === 'true') return NO_COLUMNS

  const contactable = props['contactable'] === 'true'
  const mixedKind = props['mixed_kind'] === 'true'
  if (!contactable && !mixedKind) return NO_COLUMNS

  return { kind: mixedKind, role: true, phone: true, note: true }
}
