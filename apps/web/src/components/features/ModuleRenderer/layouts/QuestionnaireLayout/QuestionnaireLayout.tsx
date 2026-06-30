import { Info } from 'lucide-react'
import type { ContentField } from '@services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Aperçu fidèle au mobile : intro + warning éventuel, légende des options puis
// chaque question dans sa carte avec les pills de réponse Likert sous la question
// (cf. apps/mobile/src/components/ModuleRenderer/fields/widgets/LikertWidget).
export function QuestionnaireLayout({ fields, footer, t }: Props) {
  const warning = fields.find(f => f.field_type === 'scale_warning')
  const instructions = fields.filter(f => f.field_type === 'scale_instruction')
  const options = fields
    .filter(f => f.field_type === 'scale_option' || f.field_type === 'scale_legend_item')
    .sort((a, b) => a.sort_order - b.sort_order)
  const questions = fields
    .filter(f => f.field_type === 'scale_question')
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="preview-questionnaire">
      {warning && (
        <p className="preview-questionnaire__warning">{t(warning.text_code ?? '')}</p>
      )}
      {instructions.map(f => (
        <p key={f.id} className="preview-questionnaire__instruction">{t(f.text_code ?? '')}</p>
      ))}
      {options.length > 0 && (
        <div className="preview-questionnaire__legend">
          {options.map(f => (
            <span key={f.id} className="preview-questionnaire__legend-item">
              <span className="preview-questionnaire__legend-val">{f.props['value']}</span>
              <span className="preview-questionnaire__legend-label">{t(f.text_code ?? '')}</span>
            </span>
          ))}
        </div>
      )}
      <ol className="preview-questionnaire__questions">
        {questions.map((f, i) => (
          <li key={f.id} className="preview-questionnaire__item">
            <span className="preview-questionnaire__question">
              <span className="preview-questionnaire__num">{i + 1}.</span>
              {t(f.text_code ?? '')}
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
        ))}
      </ol>
      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}
    </div>
  )
}
