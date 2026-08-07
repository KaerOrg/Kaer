import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { Banner } from '@ui/Banner'
import { Button } from '@ui/Button'
import type { ModuleType } from '../../../lib/database.types'
import './OverdueScalesReminder.css'

export interface OverdueScaleItem {
  readonly moduleType: ModuleType
  /** Nom de l'échelle (déjà traduit). */
  readonly label: string
  /** Jours de retard (fait administratif, dérivé de la date d'échéance). */
  readonly overdueDays: number
}

interface OverdueScalesReminderProps {
  readonly items: readonly OverdueScaleItem[]
  /** Ouvre la fiche de l'échelle (onglet Programmation). */
  readonly onOpen: (moduleType: ModuleType) => void
}

/**
 * Bandeau fiche patient (K-7) : rappel des **auto-questionnaires en retard uniquement**
 * (jamais les passations « en séance »). Constat purement administratif — une échéance de
 * calendrier est dépassée — en teinte ambre neutre, jamais un signal clinique ni un état
 * dérivé d'un score (MDR 2017/745). Rien si aucune échelle en retard.
 */
export function OverdueScalesReminder({ items, onOpen }: OverdueScalesReminderProps) {
  const { t } = useTranslation()

  const handleOpen = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = e.currentTarget.dataset.module
      if (id) onOpen(id as ModuleType)
    },
    [onOpen],
  )

  if (items.length === 0) return null

  return (
    <Banner variant="warning" icon={<Clock size={16} />} className="overdue-reminder">
      <p className="overdue-reminder__title">{t('scales.programmed.banner_title', { count: items.length })}</p>
      <div className="overdue-reminder__list">
        {items.map(item => (
          <Button
            key={item.moduleType}
            variant="ghost"
            size="sm"
            data-module={item.moduleType}
            onClick={handleOpen}
          >
            {t('scales.programmed.banner_item', { scale: item.label, days: item.overdueDays })}
          </Button>
        ))}
      </div>
    </Banner>
  )
}
