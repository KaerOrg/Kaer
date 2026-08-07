import type { ContentField } from '@services/moduleService'
import type { LikertOption } from '../../../components/features/ModuleRenderer/fields/widgets/LikertWidget'
import type { StepperQuestion, Translate } from './StepperEntry'

/**
 * Mode de saisie d'une échelle.
 *
 * - `scrolling_list` : tous les items sur une page défilante. Défaut historique, et
 *   le seul tenable au-delà d'une vingtaine d'items (RCADS-47, NSI-22), où un item
 *   par écran devient punitif.
 * - `one_per_screen` : un item par écran, avance automatique, relecture avant envoi.
 *
 * C'est une CONFIGURATION, lue depuis `scale_meta`, jamais un test sur le module :
 * `ScaleEntryScreen` est partagé par les neuf modules d'échelle.
 */
export type EntryMode = 'scrolling_list' | 'one_per_screen'

const DEFAULT_ENTRY_MODE: EntryMode = 'scrolling_list'

/**
 * Lit `scale_meta.entry_mode`. Toute valeur absente ou inconnue retombe sur le mode
 * défilant : une configuration erronée dégrade vers le comportement historique, elle
 * ne casse pas la saisie.
 */
export function readEntryMode(fields: readonly ContentField[] | null): EntryMode {
  const raw = fields?.find(f => f.field_type === 'scale_meta')?.props['entry_mode']
  return raw === 'one_per_screen' || raw === 'scrolling_list' ? raw : DEFAULT_ENTRY_MODE
}

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
