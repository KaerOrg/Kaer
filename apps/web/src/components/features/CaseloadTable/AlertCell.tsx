import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { computeEntryAlert, selectTopAction } from '../../../lib/caseloadLogic'
import { describeDue } from './caseloadFormat'
import { AlertPill } from './AlertPill'
import type { CaseloadAction } from '../../../lib/caseload.types'

export interface AlertCellProps {
  actions: readonly CaseloadAction[]
  today: string
}

/**
 * Pastille d'alerte d'un dossier, rendue auto-explicative : le niveau est dérivé
 * de l'action la plus urgente, et le `detail` reprend son délai parlant
 * (« retard 2 j », « 3 j »). MDR : tri/calcul mécanique sur des dates saisies,
 * aucune interprétation clinique.
 */
function AlertCellComponent({ actions, today }: AlertCellProps) {
  const { t } = useTranslation()
  const level = computeEntryAlert(actions, today)

  // Aucune échéance urgente ni proche → colonne vide (pas de pastille « OK » parasite).
  if (level === 'ok') return null

  const due = describeDue(selectTopAction(actions, today)?.due_date ?? null, today)

  const detail =
    due.kind === 'overdue'
      ? t('file_active.alert_detail.overdue', { count: due.days })
      : due.kind === 'today'
        ? t('file_active.alert_detail.today')
        : due.kind === 'upcoming'
          ? t('file_active.alert_detail.upcoming', { count: due.days })
          : undefined

  return <AlertPill level={level} detail={detail} />
}

export const AlertCell = memo(AlertCellComponent)
