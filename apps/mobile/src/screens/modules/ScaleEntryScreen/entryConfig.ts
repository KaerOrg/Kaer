import type { ContentField } from '@services/moduleService'
import type { LikertOption } from '../../../components/features/ModuleRenderer/fields/widgets/LikertWidget'
import type { StepperQuestion, Translate } from './StepperEntry'

/**
 * Le mode de saisie est remonté dans `@kaer/shared` (#422) : le patient saisit dans ce
 * mode, et l'aperçu praticien doit montrer le MÊME. Deux lectures divergeraient au
 * premier changement de configuration, et l'aperçu montrerait une interface qui
 * n'existe plus. Ré-exporté ici pour que les appelants mobiles restent inchangés.
 */
export { readEntryMode } from '@kaer/shared'
export type { EntryMode } from '@kaer/shared'

/** Consignes du questionnaire, dans l'ordre, résolues en texte affichable. */
export function readInstructions(fields: readonly ContentField[], t: Translate): string[] {
  return fields
    .filter(f => f.field_type === 'scale_instruction')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => t(f.text_code ?? ''))
}

function toOptions(fields: readonly ContentField[], t: Translate): LikertOption[] {
  return fields
    .filter(f => f.field_type === 'scale_option')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => ({ value: parseInt(f.props['value'] ?? '0', 10), label: t(f.text_code ?? '') }))
}

/**
 * Construit les items du parcours un item par écran.
 *
 * L'ordre et l'indexation sont ceux de `ScaleEntryScreen.answers`, qui compte les
 * `scale_question` ET les `scale_slider_question` : un décalage ici écrirait les
 * réponses dans les mauvaises cases.
 *
 * Les modalités propres à un item (portées en enfants du field) priment sur les
 * modalités communes du questionnaire, comme dans le layout défilant.
 */
export function buildStepperQuestions(
  fields: readonly ContentField[],
  t: Translate,
): StepperQuestion[] {
  const shared = toOptions(fields, t)
  return fields
    .filter(f => f.field_type === 'scale_question' || f.field_type === 'scale_slider_question')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => {
      const own = toOptions(f.children, t)
      return {
        id: f.id,
        label: t(f.text_code ?? ''),
        options: own.length > 0 ? own : shared,
      }
    })
}
