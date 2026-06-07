import { ArrowLeft, Calendar, Check } from 'lucide-react'
import type { PreviewStep } from './exposureMock'
import { SudsPickerPreview } from './SudsPickerPreview'

interface Props {
  step: PreviewStep
  lbl: (key: string) => string
  /** Libellés des stratégies de coping (issus des fields). */
  strategies: string[]
  onBack: () => void
}

/**
 * Aperçu du formulaire d'exposition enrichi (modèle d'expérience) :
 * AVANT prédiction + stress anticipé → PENDANT pic → APRÈS stress final + résultat.
 * Valeurs figées (mock) — boutons inactifs.
 */
export function ExposureFormView({ step, lbl, strategies, onBack }: Props) {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="ej ej-form" data-testid="ej-form">
      <div className="ej-head">
        <button type="button" className="ej-back" onClick={onBack} aria-label="back">
          <ArrowLeft size={18} />
        </button>
        <span className="ej-head__title">{lbl(step.labelKey)}</span>
      </div>

      {/* DATE */}
      <section className="ej-section">
        <span className="ej-section__title">{lbl('exposure_date')}</span>
        <div className="ej-date-btn">
          <Calendar size={16} />
          <span className="ej-date-btn__value">{today}</span>
        </div>
      </section>

      {/* AVANT */}
      <section className="ej-section">
        <span className="ej-section__title">{lbl('exposure_section_before')}</span>
        <span className="ej-section__hint">{lbl('scale_hint')}</span>
        <div className="ej-card">
          <span className="ej-field-label">{lbl('expectation_label')}</span>
          <div className="ej-textarea" data-placeholder={lbl('preview_expectation')} />
        </div>
        <div className="ej-card">
          <span className="ej-field-label">{lbl('suds_anticipated')}</span>
          <SudsPickerPreview value={step.target} color="var(--color-danger)" />
        </div>
      </section>

      {/* PENDANT */}
      <section className="ej-section">
        <span className="ej-section__title">{lbl('exposure_section_during')}</span>
        <div className="ej-card">
          <span className="ej-field-label">{lbl('suds_peak')}</span>
          <span className="ej-section__hint">{lbl('suds_peak_hint')}</span>
          <SudsPickerPreview value={Math.min(100, step.target + 10)} color="var(--color-primary)" />
        </div>
      </section>

      {/* APRÈS */}
      <section className="ej-section">
        <span className="ej-section__title">{lbl('exposure_section_after')}</span>
        <div className="ej-card">
          <span className="ej-field-label">{lbl('suds_final')}</span>
          <SudsPickerPreview value={Math.max(0, step.target - 30)} color="var(--color-success)" />
        </div>
        <div className="ej-card">
          <span className="ej-field-label">{lbl('outcome_label')}</span>
          <div className="ej-textarea" data-placeholder={lbl('preview_outcome')} />
        </div>
      </section>

      {/* STRATÉGIES */}
      {strategies.length > 0 ? (
        <section className="ej-section">
          <span className="ej-section__title">{lbl('section_strategies')}</span>
          <span className="ej-section__hint">{lbl('strategies_hint')}</span>
          <div className="ej-chips">
            {strategies.map((s, i) => (
              <span key={s} className={`ej-chip${i < 2 ? ' ej-chip--on' : ''}`}>
                {i < 2 ? <Check size={11} /> : null}
                {s}
              </span>
            ))}
          </div>
          <div className="ej-text-input" data-placeholder={lbl('strategy_custom_placeholder')} />
        </section>
      ) : null}

      {/* NOTES */}
      <section className="ej-section">
        <span className="ej-section__title">{lbl('section_notes')}</span>
        <div className="ej-textarea" data-placeholder={lbl('notes_placeholder')} />
      </section>

      <button type="button" className="ej-save-btn" disabled>{lbl('save')}</button>
    </div>
  )
}
