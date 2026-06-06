import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { selectTopAction } from '../../../lib/caseloadLogic'
import { describeDue } from './caseloadFormat'
import type { CaseloadAction } from '../../../lib/caseload.types'

export interface ActionsSummaryCellProps {
  actions: readonly CaseloadAction[]
  today: string
  expanded: boolean
  onToggle: () => void
}

/**
 * Cellule « Actions » repliée : porte le chevron de dépliage de la ligne et
 * résume l'action ouverte la plus urgente (libellé + échéance + compteur).
 */
function ActionsSummaryCellComponent({ actions, today, expanded, onToggle }: ActionsSummaryCellProps) {
  const { t } = useTranslation()

  const topAction = selectTopAction(actions, today)
  const openCount = actions.reduce((n, a) => (a.is_done ? n : n + 1), 0)
  const extraCount = topAction ? openCount - 1 : 0
  const topDue = describeDue(topAction?.due_date ?? null, today)
  const topDueLabel =
    topDue.kind === 'none'
      ? ''
      : t(`file_active.due.${topDue.kind}`, {
          count: topDue.kind === 'today' ? undefined : (topDue as { days: number }).days,
        })
  const topTime = topAction?.due_time ? topAction.due_time.slice(0, 5) : ''

  return (
    <button type="button" className="actions-summary" onClick={onToggle} aria-expanded={expanded}>
      <span className="actions-summary__chevron">
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </span>
      {topAction ? (
        <span className="actions-summary__top">
          <span className="actions-summary__label">{topAction.label}</span>
          {topDueLabel ? (
            <span className={`actions-summary__due actions-summary__due--${topDue.kind}`}>
              {topDueLabel}{topTime ? ` ${topTime}` : ''}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="actions-summary__empty">{t('file_active.action.none')}</span>
      )}
      {extraCount > 0 ? <span className="actions-summary__more">+{extraCount}</span> : null}
    </button>
  )
}

export const ActionsSummaryCell = memo(ActionsSummaryCellComponent)
