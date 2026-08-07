import type { ContentField } from '@services/moduleService'
import type { ScalePassation } from '@services/engagementService'
import { buildPassationRows } from '../../../components/features/ScalePassationDetail'
import type { EvolutionEntry } from '../../../components/features/ScaleEvolutionChart'

/**
 * Adaptation des passations à la vue Évolution (#420, QW-3). Pur, testé à part.
 *
 * Les items suivis en bande viennent d'une **clé de configuration**
 * (`field_props.track_in_evolution`), jamais d'un rang codé dans l'écran : la vue est
 * partagée par toutes les échelles, et y écrire « le 9ᵉ item du PHQ-9 » serait le
 * `if (moduleId === 'phq9')` que l'Epic interdit.
 */

/** Un item suivi en bande, tel que la configuration le déclare. */
export interface TrackedItem {
  readonly fieldId: string
  /** Rang de l'item dans le questionnaire, à partir de 1. */
  readonly position: number
  /** L'item entre-t-il dans le total ? Change l'intitulé de la bande, pas son rendu. */
  readonly scored: boolean
}

const QUESTION_TYPES = ['scale_question', 'scale_slider_question']

/**
 * Items que l'échelle demande de suivre en bande, dans l'ordre du questionnaire.
 *
 * Aucun item marqué = aucune bande, et la vue se réduit à la courbe. C'est le cas
 * nominal des échelles qui n'ont rien de particulier à suivre item par item.
 */
export function readTrackedItems(fields: readonly ContentField[]): TrackedItem[] {
  const questions = fields
    .filter(f => QUESTION_TYPES.includes(f.field_type))
    .sort((a, b) => a.sort_order - b.sort_order)

  const tracked: TrackedItem[] = []
  questions.forEach((question, index) => {
    if (question.props['track_in_evolution'] !== 'true') return
    tracked.push({
      fieldId: question.id,
      position: index + 1,
      scored: question.props['scored'] !== 'false',
    })
  })
  return tracked
}

/**
 * Convertit les passations en entrées de la vue Évolution.
 *
 * La résolution « réponse → modalité » réutilise `buildPassationRows`, celle du détail
 * d'une passation (#418) : deux implémentations divergeraient au premier item qui porte
 * ses propres modalités, et le praticien lirait deux libellés différents pour la même
 * réponse selon l'écran.
 *
 * Une passation antérieure à l'arrivée d'un item suivi porte `null` à sa place : la
 * bande a un trou, et la colonne reste à son abscisse.
 */
export function toEvolutionEntries(
  passations: readonly ScalePassation[],
  fields: readonly ContentField[],
  tracked: readonly TrackedItem[],
): EvolutionEntry[] {
  return passations.map(passation => {
    const { scored, unscored } = buildPassationRows(fields, passation.answers)
    const byFieldId = new Map([...scored, ...unscored].map(row => [row.fieldId, row]))
    return {
      id: passation.id,
      date: passation.date,
      score: passation.totalScore,
      bandCodes: tracked.map(item => byFieldId.get(item.fieldId)?.optionCode ?? null),
    }
  })
}
