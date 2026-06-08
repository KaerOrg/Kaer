import { Info, Plus, Check, ChevronRight } from 'lucide-react'
import type { PreviewStep } from './exposureMock'

interface Props {
  steps: readonly PreviewStep[]
  lbl: (key: string) => string
  onOpenStep: (id: string) => void
}

/** Échelle de la peur : marches classées (aperçu praticien, interactif). */
export function ExposureLadderView({ steps, lbl, onOpenStep }: Props) {
  return (
    <div className="ej" data-testid="ej-ladder">
      <div className="ej-disclaimer">
        <Info size={13} className="ej-disclaimer__icon" />
        <span>{lbl('disclaimer')}</span>
      </div>

      <ul className="ej-ladder">
        {steps.map(step => (
          <li key={step.id}>
            <button type="button" className="ej-ladder-row" onClick={() => onOpenStep(step.id)}>
              <span className={`ej-ladder-row__check${step.done ? ' ej-ladder-row__check--done' : ''}`}>
                {step.done ? <Check size={13} /> : null}
              </span>
              <span className="ej-ladder-row__body">
                <span className="ej-ladder-row__title">{lbl(step.labelKey)}</span>
                <span className="ej-ladder-row__meta">
                  <span className="ej-target-chip">
                    {lbl('step_target').replace('{{value}}', String(step.target))}
                  </span>
                  <span className="ej-ladder-row__count">
                    {lbl('step_sessions').replace('{{n}}', String(step.sessions.length))}
                  </span>
                </span>
              </span>
              <ChevronRight size={16} className="ej-ladder-row__chevron" />
            </button>
          </li>
        ))}
      </ul>

      <div className="ej-fab">
        <Plus size={16} />
        <span>{lbl('add_step')}</span>
      </div>
    </div>
  )
}
