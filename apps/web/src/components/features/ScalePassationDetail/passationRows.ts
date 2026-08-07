import type { ContentField } from '@services/moduleService'

/**
 * Mise en correspondance d'une passation avec la configuration du questionnaire (#418).
 *
 * Tout est **pur** ici, et testé à part du rendu : c'est la seule partie qui peut se
 * tromper silencieusement. Une réponse alignée sur le mauvais item donnerait un écran
 * parfaitement crédible et entièrement faux, ce que personne ne verrait à la relecture.
 */

/**
 * Valeur absente à l'écran : trait d'union simple, jamais un tiret long. Vaut pour la
 * colonne de points d'un item hors score comme pour un total introuvable.
 */
export const NO_VALUE = '-'

/** Une ligne du détail : l'item posé, et ce que le patient a répondu. */
export interface PassationRow {
  readonly fieldId: string
  /** Rang de l'item dans le questionnaire, à partir de 1. */
  readonly position: number
  /** Clé i18n du libellé de l'item. */
  readonly labelCode: string
  /** Clé i18n de la modalité choisie, `null` si aucune ne correspond à la valeur. */
  readonly optionCode: string | null
  /** Valeur brute choisie, `null` si l'item est resté sans réponse. */
  readonly value: number | null
}

export interface PassationLayout {
  /** Items qui entrent dans le total, dans l'ordre du questionnaire. */
  readonly scored: readonly PassationRow[]
  /**
   * Items posés hors score (`scored='false'`), typiquement le retentissement
   * fonctionnel. Séparés parce qu'ils se lisent autrement, pas parce qu'ils comptent
   * moins.
   */
  readonly unscored: readonly PassationRow[]
  /**
   * Total maximal atteignable par les items cotés, ou `null` s'il n'est pas dérivable
   * de la configuration. On ne devine pas : afficher « / 27 » en dur reviendrait à
   * coder un instrument dans un composant partagé par neuf échelles.
   */
  readonly maxScore: number | null
}

const QUESTION_TYPES = ['scale_question', 'scale_slider_question']

function isQuestion(field: ContentField): boolean {
  return QUESTION_TYPES.includes(field.field_type)
}

function toValue(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Modalités applicables à un item : les siennes si elle en porte, sinon celles du
 * questionnaire. Même règle que le moteur de saisie, qui préfère les options d'un item
 * à celles du questionnaire quand il en trouve (item 10 du PHQ-9, #410).
 */
function optionsFor(
  question: ContentField,
  sharedOptions: readonly ContentField[],
): readonly ContentField[] {
  const own = question.children
    .filter(c => c.field_type === 'scale_option')
    .sort((a, b) => a.sort_order - b.sort_order)
  return own.length > 0 ? own : sharedOptions
}

/** Valeur la plus haute qu'un item peut prendre, ou `null` si indéterminable. */
function maxValueOf(
  question: ContentField,
  sharedOptions: readonly ContentField[],
): number | null {
  const options = optionsFor(question, sharedOptions)
  if (options.length > 0) {
    let max: number | null = null
    for (const option of options) {
      const value = toValue(option.props['value'])
      if (value != null && (max == null || value > max)) max = value
    }
    return max
  }
  // Question à curseur : pas de modalités, la borne est portée par le field.
  return toValue(question.props['max'])
}

/**
 * Construit les lignes du détail à partir des fields du module et des réponses reçues.
 *
 * ⚠️ L'index d'une réponse est son rang dans le questionnaire **au moment de la
 * saisie**. Une passation antérieure à l'arrivée d'un item en porte moins : les rangs
 * absents ne produisent AUCUNE ligne, pour ne pas afficher un item vide que le patient
 * n'a jamais vu. Une réponse `null` à l'intérieur du tableau est autre chose : l'item a
 * été posé et laissé sans réponse, la ligne existe.
 */
export function buildPassationRows(
  fields: readonly ContentField[],
  answers: readonly (number | null)[],
): PassationLayout {
  const questions = fields.filter(isQuestion).sort((a, b) => a.sort_order - b.sort_order)
  const sharedOptions = fields
    .filter(f => f.field_type === 'scale_option')
    .sort((a, b) => a.sort_order - b.sort_order)

  const scored: PassationRow[] = []
  const unscored: PassationRow[] = []
  let maxScore: number | null = 0

  questions.forEach((question, index) => {
    const isScored = question.props['scored'] !== 'false'

    if (isScored && maxScore != null) {
      const itemMax = maxValueOf(question, sharedOptions)
      maxScore = itemMax == null ? null : maxScore + itemMax
    }

    // Item posé après cette passation : aucune ligne, aucun tiret orphelin.
    if (index >= answers.length) return

    const value = answers[index] ?? null
    const chosen = value == null
      ? undefined
      : optionsFor(question, sharedOptions).find(o => toValue(o.props['value']) === value)

    const row: PassationRow = {
      fieldId: question.id,
      position: index + 1,
      labelCode: question.text_code ?? '',
      optionCode: chosen?.text_code ?? null,
      value,
    }
    if (isScored) scored.push(row)
    else unscored.push(row)
  })

  return { scored, unscored, maxScore }
}

/**
 * Plus petit changement individuel interprétable de l'instrument, en points, ou `null`
 * si l'échelle n'en déclare pas.
 *
 * C'est une propriété **de l'instrument**, affichée telle quelle au praticien. Elle
 * n'est jamais confrontée à l'écart du patient : conclure « cet écart est trop petit
 * pour être interprété » serait une conclusion tirée d'une donnée patient, donc hors
 * du statut non-dispositif médical.
 */
export function readMinInterpretableChange(fields: readonly ContentField[]): number | null {
  const meta = fields.find(f => f.field_type === 'scale_meta')
  return toValue(meta?.props['min_interpretable_change'])
}

/**
 * Notes que le questionnaire porte à l'attention du praticien, dans l'ordre du seed.
 *
 * Rendues **en permanence**, jamais en fonction d'une réponse : ce sont des notes de
 * l'instrument, pas des alertes.
 */
export function readPractitionerNotes(fields: readonly ContentField[]): readonly ContentField[] {
  return fields
    .filter(f => f.field_type === 'scale_practitioner_note')
    .sort((a, b) => a.sort_order - b.sort_order)
}
