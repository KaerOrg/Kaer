// Colonne de gauche de l'éditeur du plan : les six étapes (PW-2).
//
// C'est le SEUL endroit d'où l'on voit d'un coup ce qui manque. D'où la marque « vide »
// sur les étapes sans item : un décompte et un état, jamais un pourcentage ni un
// jugement sur la qualité du plan.
//
// Les étapes ne se réordonnent pas : leur ordre est celui de l'instrument.

import type { StepSummary } from './safetyPlanEditorLogic'
import { StepListRow } from './StepListRow'

interface Props {
  summaries: readonly StepSummary[]
  openSection: string
  /** Libellé accessible de la colonne, déjà traduit. */
  label: string
  /** Marque des étapes sans item, déjà traduite. */
  emptyLabel: string
  onOpen: (sectionId: string) => void
}

export function StepList({ summaries, openSection, label, emptyLabel, onOpen }: Props) {
  return (
    <nav className="plan-editor__steps" aria-label={label}>
      {summaries.map(summary => (
        <StepListRow
          key={summary.sectionId}
          summary={summary}
          open={summary.sectionId === openSection}
          emptyLabel={emptyLabel}
          onOpen={onOpen}
        />
      ))}
    </nav>
  )
}
