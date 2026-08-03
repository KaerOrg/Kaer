// L'étape 6, côté praticien : les arrangements de mise à distance (PW-2 × PW-4).
//
// Elle ne se lit pas en colonnes mais en phrases (« Ma sœur garde la boîte. · Jusqu'au
// 12 septembre. »). Ce panneau branche les items de l'étape sur `SafetyMeasureEditor`,
// le composant livré par PW-4 et tenu en parité avec l'éditeur patient (P-13).
//
// Correspondance avec `safety_plan_items` : `text` porte le verbe et l'objet, `role`
// porte qui s'en occupe, `note` porte l'échéance. Les mêmes trois champs que partout
// ailleurs, ce qui évite une table de plus pour six lignes.
//
// Conformité MDR 2017/745 : les propositions de verbe viennent de la configuration,
// dans SON ordre, et ne sont jamais réordonnées ni filtrées selon les saisies passées.
// L'échéance est affichée, jamais surveillée.

import { useMemo } from 'react'
import {
  SafetyMeasureEditor,
  type MeasureVerbOption,
  type NewMeasure,
  type SafetyMeasureEditorLabels,
} from '../../../components/features/SafetyMeasureEditor'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

interface Props {
  stepLabel: string
  items: readonly SafetyPlanItem[]
  /** Propositions de verbe, dans l'ordre de la configuration, libellés déjà traduits. */
  verbs: readonly MeasureVerbOption[]
  /** Code de la proposition « Autre », qui ouvre la saisie libre. */
  otherVerbCode: string
  labels: SafetyMeasureEditorLabels
  onAdd: (measure: NewMeasure) => void
  onDelete: (id: string) => void
}

export function MeasureStepPanel({
  stepLabel, items, verbs, otherVerbCode, labels, onAdd, onDelete,
}: Props) {
  const measures = useMemo(
    () => items.map(item => ({ id: item.id, text: item.text, role: item.role, note: item.note })),
    [items],
  )

  return (
    <section className="plan-editor__detail">
      <h3 className="plan-editor__detail-title">{stepLabel}</h3>
      <SafetyMeasureEditor
        measures={measures}
        verbs={verbs}
        otherVerbCode={otherVerbCode}
        labels={labels}
        onAdd={onAdd}
        onDelete={onDelete}
      />
    </section>
  )
}
