import { useTranslation } from 'react-i18next'
import { StatusBadge } from '../../ui/StatusBadge/StatusBadge'
import { alertVariant } from './caseloadFormat'
import type { AlertLevel } from '../../../lib/caseload.types'

/**
 * Pastille d'alerte d'un dossier. MDR : toujours une couleur ET un mot
 * (jamais la couleur seule — lisible en cas de daltonisme), aucune interprétation.
 */
export function AlertPill({ level }: { level: AlertLevel }) {
  const { t } = useTranslation()
  return <StatusBadge variant={alertVariant(level)} label={t(`file_active.alert.${level}`)} />
}
