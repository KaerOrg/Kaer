import { ChevronRight, Heart, Info, PlayCircle, Shield } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

// Aperçu fidèle au mobile : reproduit l'écran intro d'un guided_exercise —
// titre, paragraphes d'intro, aperçu numéroté des étapes, bouton de
// démarrage, section consignes de sécurité. Source mobile :
// GuidedExerciseLayout (FieldRenderer.tsx).
export function GuidedExerciseLayout({ fields, t }: Props) {
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }

  const title = ft('exercise_title')
  const intros = fields.filter(f => f.field_type === 'exercise_intro')
  const startBtn = ft('exercise_start_btn')
  const safetyTitle = ft('exercise_safety_title')
  const safetyItems = fields.filter(f => f.field_type === 'exercise_safety')

  // Étapes : récupérées par section_id (chaque section = 1 étape)
  const stepTitles = fields
    .filter(f => f.field_type === 'step_title')
    .sort((a, b) => a.sort_order - b.sort_order)
  const hintsBySection = new Map<string, ContentField>()
  for (const f of fields) {
    if (f.field_type === 'step_hint' && f.section_id) hintsBySection.set(f.section_id, f)
  }

  return (
    <div className="ge">
      {/* Header intro avec icône cœur ─────────────────────────────────── */}
      <div className="ge-hero">
        <span className="ge-hero__icon">
          <Heart size={36} />
        </span>
        {title && <h1 className="ge-hero__title">{title}</h1>}
      </div>

      {intros.length > 0 && (
        <section className="ge-intro">
          {intros.map(f => (
            <p key={f.id} className="ge-intro__text">{f.text_code ? t(f.text_code) : ''}</p>
          ))}
        </section>
      )}

      {stepTitles.length > 0 && (
        <section className="ge-section">
          <span className="ge-section__title">Aperçu des étapes</span>
          <ol className="ge-steps">
            {stepTitles.map((s, i) => {
              const color = s.props['color'] ?? '#6366F1'
              const stepNum = s.props['step_number'] ?? String(i + 1)
              const hintField = s.section_id ? hintsBySection.get(s.section_id) : undefined
              return (
                <li key={s.id} className="ge-step">
                  <span className="ge-step__num" style={{ background: color }}>{stepNum}</span>
                  <div className="ge-step__body">
                    <FieldText field={s} t={t} />
                    {hintField && <FieldText field={hintField} t={t} />}
                  </div>
                  <ChevronRight size={14} className="ge-step__chevron" />
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {startBtn && (
        <button type="button" className="ge-start-btn" disabled>
          <PlayCircle size={18} />
          {startBtn}
        </button>
      )}

      {safetyTitle && (
        <section className="ge-safety">
          <span className="ge-safety__title">
            <Shield size={14} />
            {safetyTitle}
          </span>
          <ul className="ge-safety__items">
            {safetyItems.map(f => (
              <li key={f.id} className="ge-safety__item">
                <Info size={11} />
                <span>{f.text_code ? t(f.text_code) : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
