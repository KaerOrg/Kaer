import { useTranslation } from 'react-i18next'
import type { AnchorRegularity } from '../../../lib/anchorRegularity'
import './ChronoRegularityPanel.css'

interface Props {
  anchors: AnchorRegularity[]
  entryCount: number
}

/**
 * Panneau « Données » du module « Rythmes & régularité ». Restitue, pour le
 * praticien, l'écart-type des horaires par ancre — VALEUR BRUTE.
 * Conforme MDR 2017/745 : aucun seuil, aucun label clinique, aucune couleur de
 * gravité, aucune comparaison à une norme. Le praticien interprète.
 */
export function ChronoRegularityPanel({ anchors, entryCount }: Props) {
  const { t } = useTranslation()

  return (
    <div className="module-data-panel">
      <p className="chrono-regularity__title">{t('modules.chronobiology_tracker.regularity_title')}</p>
      <p className="chrono-regularity__note">{t('modules.chronobiology_tracker.regularity_note')}</p>
      <ul className="chrono-regularity__list">
        {anchors.map(a => (
          <li key={a.key} className="chrono-regularity__row">
            <span className="chrono-regularity__label">{t(`modules.chrono_bio.${a.key}`)}</span>
            <span className="chrono-regularity__value">
              ± {a.sdMinutes} {t('modules.chronobiology_tracker.regularity_min')}
            </span>
            <span className="chrono-regularity__count">
              {t(
                a.count > 1
                  ? 'modules.chronobiology_tracker.regularity_days_plural'
                  : 'modules.chronobiology_tracker.regularity_days',
                { count: a.count },
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="chrono-regularity__total">
        {t(
          entryCount > 1
            ? 'modules.chronobiology_tracker.regularity_total_plural'
            : 'modules.chronobiology_tracker.regularity_total',
          { count: entryCount },
        )}
      </p>
    </div>
  )
}
