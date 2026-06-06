import { useTranslation } from 'react-i18next'
import { StatusBadge } from '../../ui/StatusBadge/StatusBadge'
import { alertVariant } from './caseloadFormat'
import type { AlertLevel } from '../../../lib/caseload.types'

export interface AlertPillProps {
  level: AlertLevel
  /** Délai parlant affiché à côté du libellé (ex. « 3 j », « retard 2 j »). */
  detail?: string
}

/**
 * Pastille d'alerte d'un dossier. MDR : toujours une couleur ET un mot
 * (jamais la couleur seule — lisible en cas de daltonisme), aucune interprétation.
 * Le `detail` rend l'alerte auto-explicative (« À venir · 3 j »).
 */
export function AlertPill({ level, detail }: AlertPillProps) {
  const { t } = useTranslation()
  return <StatusBadge variant={alertVariant(level)} label={t(`file_active.alert.${level}`)} value={detail} />
}
