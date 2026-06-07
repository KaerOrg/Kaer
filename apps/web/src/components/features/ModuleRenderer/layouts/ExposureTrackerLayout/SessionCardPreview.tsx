import { Pencil, Trash2 } from 'lucide-react'
import { dateDaysAgo, type PreviewSession } from './exposureMock'

interface Props {
  session: PreviewSession
  lbl: (key: string) => string
  strategyLabel?: string
}

interface BarSpec { label: string; value: number; color: string }

export function SessionCardPreview({ session, lbl, strategyLabel }: Props) {
  const dateText = new Date(dateDaysAgo(session.daysAgo)).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const bars: BarSpec[] = [
    { label: lbl('suds_anticipated'), value: session.before, color: 'var(--color-danger)' },
    { label: lbl('suds_peak'), value: session.peak, color: 'var(--color-primary)' },
    { label: lbl('suds_final'), value: session.after, color: 'var(--color-success)' },
  ]
  return (
    <article className="ej-session-card">
      <header className="ej-session-card__head">
        <span className="ej-session-card__date">{dateText}</span>
        <span className="ej-session-card__actions">
          <Pencil size={13} />
          <Trash2 size={13} />
        </span>
      </header>
      {bars.map(b => (
        <div key={b.label} className="ej-suds-row">
          <span className="ej-suds__label">{b.label}</span>
          <span className="ej-suds__bar">
            <span className="ej-suds__fill" style={{ width: `${b.value}%`, background: b.color }} />
          </span>
          <span className="ej-suds__val" style={{ color: b.color }}>{b.value}</span>
        </div>
      ))}
      {strategyLabel ? (
        <div className="ej-session-card__chips">
          <span className="ej-chip ej-chip--static">{strategyLabel}</span>
        </div>
      ) : null}
    </article>
  )
}
