import { Clock } from 'lucide-react'
import type { CaseloadWait } from '../../../lib/caseload.types'

/** Aperçu read-only des attentes de retour dans la colonne (gestion dans le panneau dépliable). */
export function WaitSummary({ waits }: { waits: readonly CaseloadWait[] }) {
  if (waits.length === 0) return <span className="wait-summary__empty">—</span>
  return (
    <div className="wait-summary">
      {waits.map(w => (
        <span key={w.id} className="wait-chip">
          {w.relance_date ? <Clock size={11} className="wait-chip__icon" aria-hidden="true" /> : null}
          {w.label}
        </span>
      ))}
    </div>
  )
}
