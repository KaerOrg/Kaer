import { Bell, BellOff, X } from 'lucide-react'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { Tooltip } from '@ui/Tooltip'
import type { NotificationRoutine } from '../../../lib/database.types'

// ─── Une routine de rappel, telle que le praticien la relit ──────────────────
//
// Le panneau taisait ce que le patient avait changé, alors que le modèle le porte
// (`patient_time_override`, `patient_paused`). Un rappel en pause depuis un mois
// explique une absence de saisies mieux que n'importe quel graphique : sans cette
// ligne, le praticien conclut « le patient ne fait pas ses exercices » quand la
// bonne lecture est « le rappel est éteint ».
//
// Ce qui est affiché est un ÉTAT CONSTATÉ, jamais une promesse au futur ni une
// interprétation du comportement (MDR).

export interface RoutineRowProps {
  readonly routine: NotificationRoutine
  readonly onToggle: () => void
  readonly onDelete: () => void
  readonly t: (key: string, opts?: Record<string, unknown>) => string
  /** Locale de formatage de la date de pause. */
  readonly locale: string
}

const DAY_ISO_TO_KEY: Record<number, string> = {
  1: 'lun', 2: 'mar', 3: 'mer', 4: 'jeu', 5: 'ven', 6: 'sam', 7: 'dim',
}

/** « 12 juil. » : date courte, dans la langue de l'interface. */
function shortDate(iso: string, locale: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

export function RoutineRow({ routine, onToggle, onDelete, t, locale }: RoutineRowProps) {
  // Heure EFFECTIVE en valeur principale : c'est celle à laquelle le rappel part.
  const effectiveTime = routine.patient_time_override ?? routine.time_of_day
  const shifted = routine.patient_time_override != null
    && routine.patient_time_override !== routine.time_of_day
  const dayLabels = routine.days_of_week
    .map(d => t(`notifications.day_abbr_${DAY_ISO_TO_KEY[d] ?? ''}`))
    .join(', ')

  const pausedAt = routine.patient_paused && routine.patient_paused_at != null
    ? shortDate(routine.patient_paused_at, locale)
    : null

  const actions = (
    <div className="nr-row__actions">
      <Tooltip label={routine.is_active ? t('notifications.deactivate') : t('notifications.activate')}>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          icon={routine.is_active && !routine.patient_paused ? <Bell size={15} /> : <BellOff size={15} />}
          onClick={onToggle}
          aria-pressed={routine.is_active}
          aria-label={routine.is_active ? t('notifications.deactivate') : t('notifications.activate')}
        />
      </Tooltip>
      <Tooltip label={t('common.delete')}>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          category="danger"
          icon={<X size={15} />}
          onClick={onDelete}
          aria-label={t('common.delete')}
        />
      </Tooltip>
    </div>
  )

  const cardClass = [
    'nr-card',
    routine.is_active ? '' : 'nr-card--inactive',
    routine.patient_paused ? 'nr-card--paused' : '',
  ].filter(Boolean).join(' ')

  return (
    <Card
      variant="default"
      className={cardClass}
      header={{ title: effectiveTime, subtitle: dayLabels, right: actions }}
    >
      <div className="nr-card__meta">
        {/* Décalage : lisible SANS survol, la valeur posée reste consultable. */}
        {shifted ? (
          <span className="nr-row__shifted" data-testid="routine-shifted">
            {t('notifications.patient_shifted', { time: routine.time_of_day })}
          </span>
        ) : null}
        {routine.patient_paused ? (
          <span className="nr-row__paused" data-testid="routine-paused">
            {pausedAt != null
              ? t('notifications.patient_paused_on', { date: pausedAt })
              : t('notifications.patient_paused')}
          </span>
        ) : null}
        {routine.practitioner_note ? (
          <span className="nr-row__note">{routine.practitioner_note}</span>
        ) : null}
      </div>
    </Card>
  )
}
