import { memo, useCallback } from 'react'
import { Chip } from '../../../components/ui/Chip'

export interface DefusionSessionRowProps {
  rowKey: string
  dateLabel: string
  techniqueName: string
  dotColor: string
  durationLabel: string
  /** « 8 · 5 » (avant · après), point médian, jamais « → » (MDR). */
  discomfortCell: string
  beliefCell: string
  word: string
  revealed: boolean
  revealLabel: string
  onReveal: (key: string) => void
}

/**
 * Une ligne de séance du tableau Données (mémoïsée). Le mot est masqué par défaut :
 * une chip « ••• Afficher » le révèle ligne par ligne (l'écran praticien peut être
 * projeté en staff). Le callback de révélation est stabilisé ici (règle listes).
 */
export const DefusionSessionRow = memo(function DefusionSessionRow({
  rowKey, dateLabel, techniqueName, dotColor, durationLabel,
  discomfortCell, beliefCell, word, revealed, revealLabel, onReveal,
}: DefusionSessionRowProps) {
  const handleReveal = useCallback(() => onReveal(rowKey), [onReveal, rowKey])

  return (
    <tr className="defusion-table__row">
      <td>{dateLabel}</td>
      <td>
        <span className="defusion-table__technique">
          <span className="defusion-table__dot" style={{ backgroundColor: dotColor }} />
          {techniqueName}
        </span>
      </td>
      <td className="defusion-table__num">{durationLabel}</td>
      <td className="defusion-table__num">{discomfortCell}</td>
      <td className="defusion-table__num">{beliefCell}</td>
      <td>
        {revealed ? (
          <span className="defusion-table__word">{word}</span>
        ) : (
          <Chip label={revealLabel} onClick={handleReveal} />
        )}
      </td>
    </tr>
  )
})
