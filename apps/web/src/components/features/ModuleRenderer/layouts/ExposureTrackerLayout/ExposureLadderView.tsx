import { Plus, ChevronRight } from 'lucide-react'
import type { PreviewStep } from './exposureMock'

interface Props {
  steps: readonly PreviewStep[]
  lbl: (key: string) => string
  onOpenStep: (id: string) => void
}

/**
 * Échelle de la peur : marches classées (aperçu praticien, interactif).
 * Parité stricte avec le mobile #183 : barre de difficulté proportionnelle,
 * pastille « Dernier pic » / « Pas encore essayée », aucune coche, aucune valence.
 */
export function ExposureLadderView({ steps, lbl, onOpenStep }: Props) {
  return (
    <div className="ej" data-testid="ej-ladder">
      <p className="ej-sort-hint">{lbl('ladder_sort_hint')}</p>

      <ul className="ej-ladder">
        {steps.map(step => {
          const lastPeak = step.sessions.length > 0 ? step.sessions[step.sessions.length - 1].peak : null
          const pct = Math.max(0, Math.min(100, step.target))
          return (
            <li key={step.id}>
              <button type="button" className="ej-ladder-row" onClick={() => onOpenStep(step.id)}>
                <span className="ej-ladder-row__top">
                  <span className="ej-ladder-row__title">{lbl(step.labelKey)}</span>
                  <ChevronRight size={16} className="ej-ladder-row__chevron" />
                </span>
                <span className="ej-diff-bar">
                  <span className="ej-diff-bar__fill" style={{ width: `${pct}%` }} />
                </span>
                <span className="ej-ladder-row__meta">
                  <span className="ej-diff-label">
                    {lbl('step_difficulty').replace('{{value}}', String(step.target))}
                  </span>
                  {lastPeak != null ? (
                    <span className="ej-last-peak">{lbl('step_last_peak').replace('{{value}}', String(lastPeak))}</span>
                  ) : (
                    <span className="ej-not-tried">{lbl('step_not_tried')}</span>
                  )}
                </span>
                <span className="ej-ladder-row__count">
                  {lbl('step_sessions').replace('{{n}}', String(step.sessions.length))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="ej-fab">
        <Plus size={16} />
        <span>{lbl('add_step')}</span>
      </div>
    </div>
  )
}
