import { memo } from 'react'
import type { ContentField } from '@services/moduleService'

interface Props {
  readonly question: ContentField
  /** Modalités applicables à CET item (les siennes, ou celles du questionnaire). */
  readonly options: readonly ContentField[]
  /** Rang de l'item dans le questionnaire, à partir de 1. */
  readonly position: number
  /** L'item entre-t-il dans le total ? */
  readonly scored: boolean
  readonly t: (key: string, options?: Record<string, string | number>) => string
}

/**
 * Un item du questionnaire dans l'aperçu praticien : énoncé, modalités, et la mention
 * « hors score » quand l'item est posé sans compter dans le total (#410).
 *
 * Les modalités viennent de l'appelant, jamais des options du questionnaire par défaut :
 * un item qui porte les siennes doit s'afficher avec les siennes, sinon l'aperçu montre
 * des réponses que le patient n'a jamais vues.
 */
function QuestionnaireItemBase({ question, options, position, scored, t }: Props) {
  return (
    <li className="preview-questionnaire__item">
      <span className="preview-questionnaire__question">
        <span className="preview-questionnaire__num">{position}.</span>
        {t(question.text_code ?? '')}
        {scored ? null : (
          <span className="preview-questionnaire__unscored">{t('scales.preview.unscored')}</span>
        )}
      </span>
      {options.length > 0 && (
        <div className="preview-questionnaire__pills" role="radiogroup">
          {options.map(opt => (
            <span key={opt.id} className="preview-questionnaire__pill">
              <span>
                <span className="preview-questionnaire__pill-val">{opt.props['value']}</span>
                <span className="preview-questionnaire__pill-label">{t(opt.text_code ?? '')}</span>
              </span>
            </span>
          ))}
        </div>
      )}
    </li>
  )
}

export const QuestionnaireItem = memo(QuestionnaireItemBase)
