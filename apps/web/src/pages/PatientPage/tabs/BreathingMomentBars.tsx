import { useTranslation } from 'react-i18next'
import { DAY_MOMENTS, type DayMoment } from '@kaer/shared'

interface Props {
  counts: Record<DayMoment, number>
  /** Rappel du réglage patient, déjà formaté. `null` = aucun rappel créé. */
  reminderSummary: string | null
}

/**
 * Répartition des sessions dans la journée : trois effectifs bruts, sur un découpage
 * horaire **fixe et déclaré** (matin 5h-12h, journée 12h-19h, soir 19h-5h).
 *
 * MDR 2017/745 : le découpage ne se déduit pas des données du patient, et rien ici ne
 * qualifie un moment de meilleur qu'un autre. Les trois barres portent la même teinte.
 */
export function BreathingMomentBars({ counts, reminderSummary }: Props) {
  const { t } = useTranslation()
  const max = Math.max(1, ...DAY_MOMENTS.map(moment => counts[moment]))

  return (
    <div className="breathing-moments">
      {DAY_MOMENTS.map(moment => (
        <div key={moment} className="breathing-moment" data-testid={`breathing-moment-${moment}`}>
          <span className="breathing-moment__label">{t(`patient.breathing_moment_${moment}`)}</span>
          <span className="breathing-moment__track">
            <span
              className="breathing-moment__fill"
              style={{ width: `${(counts[moment] / max) * 100}%` }}
            />
          </span>
          <span className="breathing-moment__value">{counts[moment]}</span>
        </div>
      ))}

      <p className="breathing-moments__reminder">
        {reminderSummary ?? t('patient.breathing_reminder_none')}
      </p>
    </div>
  )
}
