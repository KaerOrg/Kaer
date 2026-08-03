// Panneau de droite : l'étape ouverte (PW-2, PW-3).
//
// Un tableau d'items éditables, plus un formulaire d'ajout ancré en bas. Les colonnes
// varient selon l'étape, et viennent de sa configuration, jamais d'un numéro d'étape
// en dur (voir `planItemColumns`).
//
// L'étape 6 ne passe pas par ici : elle n'a pas d'items en colonnes mais des
// ARRANGEMENTS, qui se lisent en phrases. Le panneau parent l'oriente vers
// `SafetyMeasureEditor` (PW-4), d'après sa configuration et non d'après son numéro.

import { useMemo } from 'react'
import type { StepColumns } from '@kaer/shared'
import { DataTable } from '@ui/DataTable'
import type { SegmentOption } from '@ui/SegmentedControl'
import type { PlanItemKind, SafetyPlanItem } from '@services/safetyPlanItemsService'
import { buildPlanItemColumns, type PlanItemColumnLabels } from './planItemColumns'
import type { PlanItemPatch } from './planItemPatch'
import { AddPlanItemForm, type AddPlanItemFormLabels, type NewPlanItem } from './AddPlanItemForm'

interface Props {
  /** Libellé de l'étape ouverte, déjà traduit. */
  stepLabel: string
  columns: StepColumns
  /** Items de l'étape, dans leur ordre d'affichage. */
  items: readonly SafetyPlanItem[]
  kindOptions: readonly SegmentOption<PlanItemKind>[]
  columnLabels: PlanItemColumnLabels
  formLabels: AddPlanItemFormLabels
  /** État vide de l'étape, déjà traduit. Une étape vide est normale, pas une anomalie. */
  emptyLabel: string
  tableLabel: string
  onPatch: (item: SafetyPlanItem, patch: PlanItemPatch) => void
  onMove: (item: SafetyPlanItem, direction: 'up' | 'down') => void
  onDelete: (item: SafetyPlanItem) => void
  onAdd: (item: NewPlanItem) => void
}

export function StepDetailPanel({
  stepLabel, columns, items, kindOptions, columnLabels, formLabels,
  emptyLabel, tableLabel, onPatch, onMove, onDelete, onAdd,
}: Props) {
  const tableColumns = useMemo(
    () => buildPlanItemColumns({
      columns, labels: columnLabels, kindOptions, ordered: items, onPatch, onMove, onDelete,
    }),
    [columns, columnLabels, kindOptions, items, onPatch, onMove, onDelete],
  )

  return (
    <section className="plan-editor__detail">
      <h3 className="plan-editor__detail-title">{stepLabel}</h3>

      <DataTable
        columns={tableColumns}
        rows={items}
        getRowId={getItemId}
        ariaLabel={tableLabel}
        emptyState={<p className="plan-editor__empty">{emptyLabel}</p>}
      />

      <AddPlanItemForm columns={columns} labels={formLabels} onAdd={onAdd} />
    </section>
  )
}

function getItemId(item: SafetyPlanItem): string {
  return item.id
}
