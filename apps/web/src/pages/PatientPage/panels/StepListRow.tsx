// Une étape dans la colonne de gauche de l'éditeur du plan (PW-2).
//
// Elle porte son décompte et, si elle n'a rien, la marque « vide ». Un décompte et un
// état, jamais un pourcentage ni un jugement sur la qualité du plan.

import { useCallback } from 'react'
import { Button } from '@ui/Button'
import type { StepSummary } from './safetyPlanEditorLogic'

interface Props {
  summary: StepSummary
  open: boolean
  /** Marque des étapes sans item, déjà traduite. */
  emptyLabel: string
  onOpen: (sectionId: string) => void
}

export function StepListRow({ summary, open, emptyLabel, onOpen }: Props) {
  const handleOpen = useCallback(() => onOpen(summary.sectionId), [onOpen, summary.sectionId])

  return (
    <Button
      variant={open ? 'secondary' : 'ghost'}
      size="sm"
      fullWidth
      onClick={handleOpen}
      data-testid={`plan-step-${summary.sectionId}`}
    >
      {`${summary.label} · ${summary.isEmpty ? emptyLabel : summary.count}`}
    </Button>
  )
}
