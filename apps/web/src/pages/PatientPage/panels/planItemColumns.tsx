// ─── Colonnes du tableau d'items, selon l'étape ouverte (PW-3) ──────────────
//
// Les colonnes varient d'une étape à l'autre parce qu'on n'y pose pas la même question :
// une étape simple ne demande que le texte, une étape de contacts demande le lien, le
// numéro et ce qu'on peut lui dire, une étape mixte ajoute la nature de l'item.
//
// **Le jeu de colonnes vient de la configuration de l'étape**, jamais d'un numéro
// d'étape en dur : `readStepColumns` lit les `field_props` du `step_title`. Un plan
// reconfiguré en base change de colonnes sans qu'on touche au code.
//
// **Les en-têtes sont la question posée en consultation**, pas le nom technique :
// « dans ses mots », « lien ou fonction », « ce qu'il peut lui dire ». Tous traduits par
// l'appelant, à partir de clés dérivées du `module_id` courant.

import type { StepColumns } from '@kaer/shared'
import type { DataTableColumn } from '@ui/DataTable'
import type { SegmentOption } from '@ui/SegmentedControl'
import type { PlanItemKind, SafetyPlanItem } from '@services/safetyPlanItemsService'
import { PlanItemTextCell } from './PlanItemTextCell'
import { PlanItemKindCell } from './PlanItemKindCell'
import { PlanItemActionsCell } from './PlanItemActionsCell'
import { isReachable } from './safetyPlanEditorLogic'
import type { PlanItemPatch } from './planItemPatch'

/** Tous les libellés du tableau, déjà traduits : aucune clé i18n n'entre ici. */
export interface PlanItemColumnLabels {
  text: string
  kind: string
  role: string
  phone: string
  note: string
  actions: string
  noPhone: string
  moveUp: string
  moveDown: string
  delete: string
}

interface Params {
  columns: StepColumns
  labels: PlanItemColumnLabels
  kindOptions: readonly SegmentOption<PlanItemKind>[]
  /** Items de l'étape, dans leur ordre d'affichage : borne les déplacements. */
  ordered: readonly SafetyPlanItem[]
  onPatch: (item: SafetyPlanItem, patch: PlanItemPatch) => void
  onMove: (item: SafetyPlanItem, direction: 'up' | 'down') => void
  onDelete: (item: SafetyPlanItem) => void
}

export function buildPlanItemColumns({
  columns, labels, kindOptions, ordered, onPatch, onMove, onDelete,
}: Params): DataTableColumn<SafetyPlanItem>[] {
  const built: DataTableColumn<SafetyPlanItem>[] = [
    {
      id: 'text',
      header: labels.text,
      cell: item => <PlanItemTextCell item={item} field="text" ariaLabel={labels.text} onPatch={onPatch} />,
    },
  ]

  if (columns.kind) {
    built.push({
      id: 'kind',
      header: labels.kind,
      cell: item => <PlanItemKindCell item={item} options={kindOptions} ariaLabel={labels.kind} onPatch={onPatch} />,
    })
  }

  if (columns.role) {
    built.push({
      id: 'role',
      header: labels.role,
      cell: item => <PlanItemTextCell item={item} field="role" ariaLabel={labels.role} onPatch={onPatch} />,
    })
  }

  if (columns.phone) {
    built.push({
      id: 'phone',
      header: labels.phone,
      cell: item => (
        <>
          <PlanItemTextCell item={item} field="phone" ariaLabel={labels.phone} onPatch={onPatch} />
          {/* Un item sans numéro n'est PAS une erreur : mention neutre, jamais de rouge,
              et elle dit la conséquence côté patient plutôt que de reprocher l'absence. */}
          {isReachable(item) ? null : <span className="plan-editor__item-note">{labels.noPhone}</span>}
        </>
      ),
    })
  }

  if (columns.note) {
    built.push({
      id: 'note',
      header: labels.note,
      cell: item => <PlanItemTextCell item={item} field="note" ariaLabel={labels.note} onPatch={onPatch} />,
    })
  }

  built.push({
    id: 'actions',
    header: labels.actions,
    headerClassName: 'plan-editor__actions-col',
    cell: item => {
      const index = ordered.findIndex(other => other.id === item.id)
      return (
        <PlanItemActionsCell
          item={item}
          canMoveUp={index > 0}
          canMoveDown={index !== -1 && index < ordered.length - 1}
          labels={labels}
          onMove={onMove}
          onDelete={onDelete}
        />
      )
    },
  })

  return built
}
