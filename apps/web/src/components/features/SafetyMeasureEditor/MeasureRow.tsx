// Une mesure décidée, rendue en phrase (PW-4).
//
// Composant à part pour que la ligne porte son propre identifiant et rappelle un
// callback stable du parent : une lambda par ligne serait recréée à chaque rendu.

import { useCallback } from 'react'
import { composeMeasureSentence } from '@kaer/shared'
import { Button } from '@ui/Button'

/** Une mesure telle qu'elle vit dans `safety_plan_items`. */
export interface ExistingMeasure {
  readonly id: string
  /** Verbe et objet, tels qu'ils ont été écrits. */
  readonly text: string
  /** Qui s'en occupe. Facultatif. */
  readonly role: string | null
  /** Échéance, date ou texte. Facultative. Affichée, jamais surveillée. */
  readonly note: string | null
}

interface Props {
  measure: ExistingMeasure
  deleteLabel: string
  onDelete: (id: string) => void
}

export function MeasureRow({ measure, deleteLabel, onDelete }: Props) {
  const handleDelete = useCallback(() => onDelete(measure.id), [onDelete, measure.id])

  // La phrase est composée AU RENDU, par la même fonction que le mobile : une seule
  // source, donc aucune dérive de formulation entre les deux écrans.
  const sentence = composeMeasureSentence({
    verb: measure.text,
    what: '',
    who: measure.role,
    until: measure.note,
  })

  return (
    <li className="measure-editor__item" data-testid={`measure-${measure.id}`}>
      <span className="measure-editor__sentence">{sentence}</span>
      <Button variant="ghost" size="xs" onClick={handleDelete} aria-label={`${deleteLabel} : ${measure.text}`}>
        {deleteLabel}
      </Button>
    </li>
  )
}
