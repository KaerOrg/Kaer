import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { selectTopAction } from '../../../lib/caseloadLogic'
import { describeDue } from './caseloadFormat'
import type { CaseloadAction } from '../../../lib/caseload.types'

export interface ActionsSummaryCellProps {
  actions: readonly CaseloadAction[]
  today: string
}

/**
 * Cellule « Actions » repliée : résume l'action ouverte la plus urgente
 * (libellé + échéance + compteur). Le dépliage de la ligne est porté par la
 * cellule « Patient » (chevron + clic sur le nom).
 */
function ActionsSummaryCellComponent({ actions, today }: ActionsSummaryCellProps) {
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

  return (
    <div className="actions-summary">
      {topAction ? (
        <span className="actions-summary__top">
          <span className="actions-summary__label">{topAction.label}</span>
          {topDueLabel ? (
            <span className={`actions-summary__due actions-summary__due--${topDue.kind}`}>
              {topDueLabel}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="actions-summary__empty">{t('file_active.action.none')}</span>
      )}
      {extraCount > 0 ? <span className="actions-summary__more">+{extraCount}</span> : null}
    </div>
  )
}

export const ActionsSummaryCell = memo(ActionsSummaryCellComponent)
