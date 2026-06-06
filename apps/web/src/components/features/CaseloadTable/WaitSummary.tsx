import { Clock } from 'lucide-react'
import { Chip } from '../../ui/Chip'
import type { CaseloadWait } from '../../../lib/caseload.types'

/** Aperçu read-only des attentes de retour dans la colonne (gestion dans le panneau dépliable). */
export function WaitSummary({ waits }: { waits: readonly CaseloadWait[] }) {
  if (waits.length === 0) return <span className="wait-summary__empty">—</span>
  return (
    <div className="wait-summary">
      {waits.map(w => (
        <Chip
          key={w.id}
          tone="warning"
          icon={w.relance_date ? <Clock size={11} aria-hidden="true" /> : undefined}
          label={w.label}
        />
      ))}
    </div>
  )
}
