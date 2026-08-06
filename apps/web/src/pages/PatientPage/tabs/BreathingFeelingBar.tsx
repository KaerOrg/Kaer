import type { FeelingTally } from '@kaer/shared'
import { FEELING_SEGMENTS, FEELING_UNANSWERED_COLOR } from './breathingDataConfig'

interface Props {
  tally: FeelingTally
}

/**
 * Barre empilée des ressentis déclarés : trois segments d'effectifs bruts, dans un
 * ordre fixe.
 *
 * MDR 2017/745 : les largeurs sont des proportions d'effectifs, jamais un score. Le
 * dénominateur est le nombre de ressentis **renseignés** : les sessions passées sans
 * réponse ne gonflent aucun segment, elles se comptent à côté. Sans aucune réponse,
 * la barre reste neutre plutôt que de disparaître, pour que l'absence se voie.
 */
export function BreathingFeelingBar({ tally }: Props) {
  const answered = tally.calmer + tally.same + tally.tenser

  return (
    <div className="breathing-feeling-row__bar">
      {answered === 0 ? (
        <span className="breathing-feeling-row__empty" style={{ background: FEELING_UNANSWERED_COLOR }} />
      ) : (
        FEELING_SEGMENTS.map(segment => {
          const value = tally[segment.key]
          if (value === 0) return null
          return (
            <span
              key={segment.key}
              className="breathing-feeling-row__segment"
              style={{ width: `${(value / answered) * 100}%`, background: segment.color }}
            />
          )
        })
      )}
    </div>
  )
}
