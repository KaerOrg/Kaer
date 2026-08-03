import { describe, it, expect } from 'vitest'
import {
  groupBySection,
  buildStepSummaries,
  countFilledSteps,
  nextSortOrder,
  isReachable,
  reorderItems,
  stepColumnsOf,
  type PlanStep,
} from './safetyPlanEditorLogic'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

function item(over: Partial<SafetyPlanItem>): SafetyPlanItem {
  return {
    id: over.id ?? 'i1',
    section_id: over.section_id ?? 'step_1',
    text: over.text ?? 'x',
    kind: over.kind ?? null,
    role: over.role ?? null,
    note: over.note ?? null,
    phone: over.phone ?? null,
    sort_order: over.sort_order ?? 0,
    authored_by: 'patient',
    created_at: '', updated_at: '',
  }
}

const SIX: PlanStep[] = [1, 2, 3, 4, 5, 6].map(n => ({
  sectionId: `step_${n}`,
  label: `Étape ${n}`,
  props: {},
}))

describe('groupBySection', () => {
  it('regroupe les items par étape, chacun dans son ordre d\'affichage', () => {
    const grouped = groupBySection([
      item({ id: 'b', section_id: 'step_1', sort_order: 1 }),
      item({ id: 'a', section_id: 'step_1', sort_order: 0 }),
      item({ id: 'c', section_id: 'step_4', sort_order: 0 }),
    ])
    expect(grouped.get('step_1')?.map(i => i.id)).toEqual(['a', 'b'])
    expect(grouped.get('step_4')?.map(i => i.id)).toEqual(['c'])
  })

  it('ne crée aucune entrée pour une étape sans item', () => {
    expect(groupBySection([item({ section_id: 'step_1' })]).has('step_2')).toBe(false)
  })

  it('accepte une liste vide : un plan vide est un état normal', () => {
    expect(groupBySection([]).size).toBe(0)
  })
})

describe('buildStepSummaries', () => {
  it('garde l\'ordre de la configuration, étapes vides comprises', () => {
    const summaries = buildStepSummaries(SIX, [item({ section_id: 'step_4' })])
    expect(summaries.map(s => s.sectionId)).toEqual(
      ['step_1', 'step_2', 'step_3', 'step_4', 'step_5', 'step_6'],
    )
  })

  it('marque « vide » les étapes sans item, et compte les autres', () => {
    const summaries = buildStepSummaries(SIX, [
      item({ id: 'a', section_id: 'step_4' }),
      item({ id: 'b', section_id: 'step_4', sort_order: 1 }),
    ])
    expect(summaries.find(s => s.sectionId === 'step_4')).toMatchObject({ count: 2, isEmpty: false })
    expect(summaries.find(s => s.sectionId === 'step_5')).toMatchObject({ count: 0, isEmpty: true })
  })

  it('rend une liste vide quand la configuration ne déclare aucune étape', () => {
    expect(buildStepSummaries([], [item({})])).toEqual([])
  })
})

describe('countFilledSteps', () => {
  it('rend deux nombres bruts, jamais leur rapport', () => {
    const summaries = buildStepSummaries(SIX, [item({ section_id: 'step_4' })])
    expect(countFilledSteps(summaries)).toEqual({ filled: 1, total: 6 })
  })

  // MDR 2017/745 : un décompte n'est pas une évaluation. Un ratio exposé ici serait à un
  // `Math.round(× 100)` d'afficher « plan complété à 17 % ».
  it('n\'expose ni ratio, ni pourcentage, ni score', () => {
    const result: Record<string, unknown> = countFilledSteps(buildStepSummaries(SIX, []))
    expect(Object.keys(result).sort()).toEqual(['filled', 'total'])
    for (const value of Object.values(result)) expect(Number.isInteger(value)).toBe(true)
  })
})

describe('nextSortOrder', () => {
  it('place le prochain item à la suite', () => {
    expect(nextSortOrder([item({ sort_order: 0 }), item({ sort_order: 3 })])).toBe(4)
  })

  it('démarre à 0 sur une étape vide', () => {
    expect(nextSortOrder([])).toBe(0)
  })
})

describe('isReachable', () => {
  it('un numéro renseigné rend l\'item joignable', () => {
    expect(isReachable({ phone: '0600000000' })).toBe(true)
  })

  it('absence, chaîne vide et espaces se lisent tous « pas de numéro »', () => {
    expect(isReachable({ phone: null })).toBe(false)
    expect(isReachable({ phone: '' })).toBe(false)
    expect(isReachable({ phone: '   ' })).toBe(false)
  })
})

describe('stepColumnsOf', () => {
  it('lit les colonnes dans la configuration de l\'étape', () => {
    expect(stepColumnsOf({ sectionId: 'step_4', label: '', props: { contactable: 'true' } }))
      .toEqual({ kind: false, role: true, phone: true, note: true })
  })

  it('étape absente : aucune colonne, plutôt qu\'une erreur', () => {
    expect(stepColumnsOf(undefined)).toEqual({ kind: false, role: false, phone: false, note: false })
  })
})

describe('reorderItems', () => {
  const three = [
    item({ id: 'a', sort_order: 0 }),
    item({ id: 'b', sort_order: 1 }),
    item({ id: 'c', sort_order: 2 }),
  ]

  it('monter un item échange son rang avec celui du dessus', () => {
    expect(reorderItems(three, 'b', 'up')).toEqual([
      { id: 'b', sort_order: 0 },
      { id: 'a', sort_order: 1 },
    ])
  })

  it('descendre un item échange son rang avec celui du dessous', () => {
    expect(reorderItems(three, 'b', 'down')).toEqual([
      { id: 'c', sort_order: 1 },
      { id: 'b', sort_order: 2 },
    ])
  })

  it('ne renvoie rien aux bornes : le premier ne monte pas, le dernier ne descend pas', () => {
    expect(reorderItems(three, 'a', 'up')).toEqual([])
    expect(reorderItems(three, 'c', 'down')).toEqual([])
  })

  it('ne renvoie rien pour un item absent', () => {
    expect(reorderItems(three, 'zzz', 'up')).toEqual([])
  })

  // Les items repris de `patient_entries` partagent tous `sort_order = 0` : un simple
  // échange de valeurs identiques ne déplacerait rien.
  it('renumérote d\'après la position quand plusieurs items partagent un rang', () => {
    const flat = [
      item({ id: 'a', sort_order: 0 }),
      item({ id: 'b', sort_order: 0 }),
      item({ id: 'c', sort_order: 0 }),
    ]
    expect(reorderItems(flat, 'c', 'up')).toEqual([
      { id: 'c', sort_order: 1 },
      { id: 'b', sort_order: 2 },
    ])
  })

  it('un item seul ne bouge dans aucun sens', () => {
    const single = [item({ id: 'a', section_id: 'step_3', sort_order: 0 })]
    expect(reorderItems(single, 'a', 'up')).toEqual([])
    expect(reorderItems(single, 'a', 'down')).toEqual([])
  })
})
