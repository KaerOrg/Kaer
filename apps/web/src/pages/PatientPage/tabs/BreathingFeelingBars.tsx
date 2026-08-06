import { useTranslation } from 'react-i18next'
import type { FeelingCounts } from '@kaer/shared'
import { FEELING_SEGMENTS } from './breathingDataConfig'
import { BreathingFeelingBar } from './BreathingFeelingBar'

interface Props {
  counts: FeelingCounts
  /** Nom traduit de la technique. */
  techniqueName: string
}

/**
 * Ressentis déclarés après les sessions d'une technique : une barre empilée et les
 * **effectifs bruts** écrits en toutes lettres.
 *
 * MDR 2017/745 : aucun score, aucune moyenne, aucune pondération. L'ordre des
 * segments est fixe, jamais trié par effectif, pour qu'aucune lecture de classement
 * ne s'installe. Les sessions sans ressenti sont comptées à part, pas ignorées :
 * passer est une réponse légitime.
 */
export function BreathingFeelingBars({ counts, techniqueName }: Props) {
  const { t } = useTranslation()

  return (
    <div className="breathing-feeling-row" data-testid={`breathing-feeling-${counts.techniqueKey}`}>
      <div className="breathing-feeling-row__head">
        <span className="breathing-feeling-row__name">{techniqueName}</span>
        <span className="breathing-feeling-row__total">
          {t('patient.breathing_feeling_sessions', { count: counts.total })}
        </span>
      </div>

      <BreathingFeelingBar tally={counts} />

      <div className="breathing-feeling-row__counts">
        {FEELING_SEGMENTS.map(segment => (
          <span key={segment.key} className="breathing-feeling-row__count">
            <span className="breathing-feeling-row__dot" style={{ background: segment.color }} />
            {t(`patient.breathing_feeling_${segment.key}`)} : <strong>{counts[segment.key]}</strong>
          </span>
        ))}
        <span className="breathing-feeling-row__count breathing-feeling-row__count--muted">
          {t('patient.breathing_feeling_unanswered', { count: counts.unanswered })}
        </span>
      </div>
    </div>
  )
}
