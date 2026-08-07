import { memo } from 'react'
import { NO_VALUE, type PassationRow } from './passationRows'

interface Props {
  readonly row: PassationRow
  readonly t: (key: string) => string
}

/**
 * Une ligne du détail : rang, libellé de l'item, modalité choisie, valeur brute.
 *
 * **Aucun attribut de cette ligne ne dépend de sa valeur.** Même balisage, mêmes
 * classes, aucune couleur : une ligne à 3 se rend exactement comme une ligne à 0.
 * Teinter la ligne 9 parce que la réponse est non nulle reviendrait à faire porter au
 * logiciel un jugement de gravité (MDR 2017/745).
 */
function PassationRowLineBase({ row, t }: Props) {
  return (
    <li className="spd-row">
      <span className="spd-row__num">{row.position}</span>
      <span className="spd-row__label">{t(row.labelCode)}</span>
      <span className="spd-row__option">{row.optionCode != null ? t(row.optionCode) : ''}</span>
      <span className="spd-row__value">{row.value != null ? row.value : NO_VALUE}</span>
    </li>
  )
}

export const PassationRowLine = memo(PassationRowLineBase)
