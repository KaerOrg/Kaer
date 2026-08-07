/**
 * Mode de saisie d'une échelle, et modalités applicables à un item (#409, #422).
 *
 * Partagé web ≡ mobile : le patient saisit dans ce mode, le praticien en voit l'aperçu.
 * Deux lectures séparées divergeraient au premier changement de configuration, et
 * l'aperçu montrerait une interface qui n'existe plus. **Un aperçu faux est pire qu'une
 * absence d'aperçu, parce qu'il est cru.**
 */

/** Champ de contenu tel que rendu par `fetchModuleFields`. Contrat minimal. */
interface EntryField {
  readonly field_type: string
  readonly sort_order: number
  readonly props: Record<string, string>
  readonly children: readonly EntryField[]
}

/**
 * Mode de saisie d'une échelle.
 *
 * - `scrolling_list` : tous les items sur une page défilante. Défaut historique, et le
 *   seul tenable au-delà d'une vingtaine d'items, où un item par écran devient punitif.
 * - `one_per_screen` : un item par écran, avance automatique, relecture avant envoi.
 *
 * C'est une CONFIGURATION lue depuis `scale_meta`, jamais un test sur le module : les
 * écrans d'échelle sont partagés par neuf modules.
 */
export type EntryMode = 'scrolling_list' | 'one_per_screen'

const DEFAULT_ENTRY_MODE: EntryMode = 'scrolling_list'

/**
 * Lit `scale_meta.entry_mode`. Toute valeur absente ou inconnue retombe sur le mode
 * défilant : une configuration erronée dégrade vers le comportement historique, elle ne
 * casse ni la saisie ni l'aperçu.
 */
export function readEntryMode(fields: readonly EntryField[] | null | undefined): EntryMode {
  const raw = fields?.find(f => f.field_type === 'scale_meta')?.props['entry_mode']
  return raw === 'one_per_screen' || raw === 'scrolling_list' ? raw : DEFAULT_ENTRY_MODE
}

/** Types de field qui posent une question au patient. */
export const QUESTION_FIELD_TYPES: readonly string[] = ['scale_question', 'scale_slider_question']

/** Options du questionnaire, communes à tous les items qui n'en portent pas. */
export function sharedOptionsOf<T extends EntryField>(fields: readonly T[]): T[] {
  return fields
    .filter(f => f.field_type === 'scale_option')
    .sort((a, b) => a.sort_order - b.sort_order)
}

/**
 * Modalités applicables à un item : **les siennes si elle en porte**, sinon celles du
 * questionnaire.
 *
 * Sans cette règle, l'item 10 du PHQ-9 (#410) se rendrait avec les modalités de
 * fréquence des items 1 à 9, alors qu'il porte des degrés de difficulté : le praticien
 * verrait dans l'aperçu quatre réponses que son patient n'a jamais vues.
 */
export function optionsForQuestion<T extends EntryField>(
  question: T,
  shared: readonly T[],
): readonly T[] {
  const own = question.children
    .filter(c => c.field_type === 'scale_option')
    .sort((a, b) => a.sort_order - b.sort_order) as T[]
  return own.length > 0 ? own : shared
}

/** L'item entre-t-il dans le total ? `scored='false'` marque un item posé hors score. */
export function isScoredQuestion(question: EntryField): boolean {
  return question.props['scored'] !== 'false'
}
