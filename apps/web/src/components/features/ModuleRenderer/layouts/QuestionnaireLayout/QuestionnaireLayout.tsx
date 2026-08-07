import { useMemo } from 'react'
import { Info } from 'lucide-react'
import {
  readScaleSource, readEntryMode, sharedOptionsOf, optionsForQuestion, isScoredQuestion,
  QUESTION_FIELD_TYPES,
} from '@kaer/shared'
import type { ContentField } from '@services/moduleService'
import { FieldText } from '../../fields'
import { SourceCitation } from '../../../SourceCitation'
import { QuestionnaireItem } from './QuestionnaireItem'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string, options?: Record<string, string | number>) => string
}

/**
 * Aperçu praticien d'un questionnaire clinique.
 *
 * **Le mode de saisie vient de la configuration**, jamais d'un test sur le module : ce
 * layout sert les neuf échelles, et `scale_meta.entry_mode` décide. Un aperçu figé sur
 * un seul des deux modes retomberait dans le défaut que Q-5 interdit.
 *
 * En `one_per_screen`, l'aperçu prend la forme d'un **storyboard** : un écran par item,
 * dans l'ordre, avec la progression que le patient voit. C'est la seule façon de montrer
 * à la fois la FORME réelle de la saisie et l'intégralité des items, dont l'item hors
 * score (#410) que le praticien doit pouvoir lire.
 *
 * L'écran affiche les dix libellés de l'instrument : c'est un lieu de diffusion au sens
 * de la licence, il porte donc la citation des auteurs (#417).
 */
export function QuestionnaireLayout({ fields, footer, t }: Props) {
  const warning = fields.find(f => f.field_type === 'scale_warning')
  const instructions = fields.filter(f => f.field_type === 'scale_instruction')
  const legend = fields
    .filter(f => f.field_type === 'scale_legend_item')
    .sort((a, b) => a.sort_order - b.sort_order)
  const source = readScaleSource(fields)
  const entryMode = readEntryMode(fields)

  const shared = useMemo(() => sharedOptionsOf(fields), [fields])
  const questions = useMemo(
    () => fields
      .filter(f => QUESTION_FIELD_TYPES.includes(f.field_type))
      .sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  )

  const stepper = entryMode === 'one_per_screen'

  // Légende commune : n'a de sens qu'en liste défilante, où les modalités sont
  // annoncées une fois en tête. En un item par écran, chaque item porte les siennes.
  const showLegend = !stepper && (shared.length > 0 || legend.length > 0)

  return (
    <div className={`preview-questionnaire${stepper ? ' preview-questionnaire--stepper' : ''}`}>
      {warning && (
        <p className="preview-questionnaire__warning">{t(warning.text_code ?? '')}</p>
      )}
      {instructions.map(f => (
        <p key={f.id} className="preview-questionnaire__instruction">{t(f.text_code ?? '')}</p>
      ))}

      {stepper && (
        <p className="preview-questionnaire__mode">{t('scales.preview.one_per_screen_note')}</p>
      )}

      {showLegend && (
        <div className="preview-questionnaire__legend">
          {[...shared, ...legend].map(f => (
            <span key={f.id} className="preview-questionnaire__legend-item">
              <span className="preview-questionnaire__legend-val">{f.props['value']}</span>
              <span className="preview-questionnaire__legend-label">{t(f.text_code ?? '')}</span>
            </span>
          ))}
        </div>
      )}

      <ol className="preview-questionnaire__questions">
        {questions.map((f, i) => (
          <li key={f.id} className="preview-questionnaire__screen">
            {stepper && (
              <span className="preview-questionnaire__progress">
                {t('scales.preview.step_progress', { index: i + 1, total: questions.length })}
              </span>
            )}
            <ol className="preview-questionnaire__screen-item">
              <QuestionnaireItem
                question={f}
                options={optionsForQuestion(f, shared)}
                position={i + 1}
                scored={isScoredQuestion(f)}
                t={t}
              />
            </ol>
          </li>
        ))}
      </ol>

      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}
      <SourceCitation
        citation={source.citation}
        translationAttribution={source.translationAttribution}
      />
    </div>
  )
}
