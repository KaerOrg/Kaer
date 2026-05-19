import { AlertTriangle, FileText, Info, Music, Shield } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  footer?: ContentField
  t: (key: string) => string
}

// Aperçu fidèle au mobile : reproduit le module rim (preview_kind
// 'patient_scenario') — disclaimer orange, scénario, étapes du protocole,
// sons d'ambiance, section sécurité. Read-only (lecture seule).
// Source mobile : PatientScenarioLayout (FieldRenderer.tsx).
export function PatientScenarioLayout({ fields, footer, t }: Props) {
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }

  const disclaimer = ft('rim_disclaimer')
  const steps = fields
    .filter(f => f.field_type === 'rim_step')
    .sort((a, b) => a.sort_order - b.sort_order)
  const sounds = fields.filter(f => f.field_type === 'ambient_sound')
  const safetyTitle = ft('exercise_safety_title')
  const safetyItems = fields.filter(f => f.field_type === 'exercise_safety')

  return (
    <div className="ps">
      {disclaimer && (
        <div className="ps-disclaimer">
          <AlertTriangle size={18} className="ps-disclaimer__icon" />
          <span className="ps-disclaimer__text">{disclaimer}</span>
        </div>
      )}

      {/* Section Scénario — placeholder neutre puisque le contenu vient
          de patient_modules.config (alternative_scenario). Affiche un
          bloc explicatif au praticien. */}
      <section className="ps-section">
        <div className="ps-section__head">
          <FileText size={16} className="ps-section__icon" />
          <span className="ps-section__title">Scénario</span>
        </div>
        <div className="ps-section__card">
          <span className="ps-placeholder">Le texte du scénario configuré pour le patient s'affiche ici.</span>
        </div>
      </section>

      {steps.length > 0 && (
        <section className="ps-section">
          <span className="ps-section__title-small">Protocole</span>
          <ol className="ps-steps">
            {steps.map((s, i) => {
              const stepNum = s.props['step_number'] ?? String(i + 1)
              return (
                <li key={s.id} className="ps-step">
                  <span className="ps-step__num">{stepNum}</span>
                  <span className="ps-step__text">{s.text_code ? t(s.text_code) : ''}</span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {sounds.length > 0 && (
        <section className="ps-section">
          <span className="ps-section__title-small">Sons d'ambiance</span>
          <div className="ps-sounds">
            {sounds.map(s => {
              const available = s.props['available'] !== 'false'
              return (
                <div key={s.id} className={`ps-sound${available ? '' : ' ps-sound--unavailable'}`}>
                  <Music size={14} />
                  <span>{s.text_code ? t(s.text_code) : ''}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {safetyTitle && (
        <section className="ps-safety">
          <span className="ps-safety__title">
            <Shield size={14} />
            {safetyTitle}
          </span>
          <ul className="ps-safety__items">
            {safetyItems.map(f => (
              <li key={f.id} className="ps-safety__item">
                <Info size={11} />
                <span>{f.text_code ? t(f.text_code) : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}
    </div>
  )
}
