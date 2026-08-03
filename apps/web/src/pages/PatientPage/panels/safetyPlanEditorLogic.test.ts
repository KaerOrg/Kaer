import { describe, it, expect } from 'vitest'
import {
  groupBySection,
  buildStepSummaries,
  nextSortOrder,
  isReachable,
} from './safetyPlanEditorLogic'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

function item(over: Partial<SafetyPlanItem>): SafetyPlanItem {
  return {
    id: over.id ?? 'i1',
    section_id: over.section_id ?? 'step_1',
    text: over.text ?? 'x',
    kind: null, role: null, note: null,
    phone: over.phone ?? null,
    sort_order: over.sort_order ?? 0,
    authored_by: 'patient',
    created_at: '', updated_at: '',
  }
}

const SIX = [1, 2, 3, 4, 5, 6].map(n => ({ sectionId: `step_${n}`, label: `Étape ${n}` }))

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

  it('rend une map vide quand le plan est vide', () => {
    expect(groupBySection([]).size).toBe(0)
  })
})

describe('buildStepSummaries', () => {
  // Une étape vide doit apparaître À SA PLACE : c'est précisément ce qu'on veut voir.
  it('garde les six étapes dans l\'ordre, y compris les vides', () => {
    const summaries = buildStepSummaries(SIX, [item({ section_id: 'step_3' })])
    expect(summaries.map(s => s.sectionId)).toEqual(SIX.map(s => s.sectionId))
    expect(summaries.find(s => s.sectionId === 'step_3')?.isEmpty).toBe(false)
    expect(summaries.find(s => s.sectionId === 'step_1')?.isEmpty).toBe(true)
  })

  it('compte les items de chaque étape', () => {
    const summaries = buildStepSummaries(SIX, [
      item({ id: 'a', section_id: 'step_2' }),
      item({ id: 'b', section_id: 'step_2', sort_order: 1 }),
    ])
    expect(summaries.find(s => s.sectionId === 'step_2')?.count).toBe(2)
  })

  it('marque les six étapes comme vides sur un plan neuf', () => {
    const summaries = buildStepSummaries(SIX, [])
    expect(summaries.every(s => s.isEmpty)).toBe(true)
    expect(summaries.every(s => s.count === 0)).toBe(true)
  })

  // « 3 étapes remplies sur 6 » est un décompte ; « plan complété à 50 % » serait une
  // évaluation. Le résumé ne porte donc aucun taux.
  it('n\'expose aucun taux de complétion', () => {
    const summary = buildStepSummaries(SIX, [item({})])[0]
    expect(Object.keys(summary).sort()).toEqual(['count', 'isEmpty', 'label', 'sectionId'])
  })
})

describe('nextSortOrder', () => {
  it('place le prochain item à la suite', () => {
    expect(nextSortOrder([item({ sort_order: 0 }), item({ id: 'b', sort_order: 3 })])).toBe(4)
  })

  it('démarre à zéro sur une étape vide', () => {
    expect(nextSortOrder([])).toBe(0)
  })
})

describe('isReachable', () => {
  it('reconnaît un item joignable', () => {
    expect(isReachable({ phone: '0102030405' })).toBe(true)
  })

  // Un item sans numéro n'est PAS une erreur : c'est peut-être un lieu, ou une personne
  // qu'on va voir. Aucune validation bloquante, aucun rouge.
  it('traite l\'absence de numéro comme un état normal', () => {
    expect(isReachable({ phone: null })).toBe(false)
    expect(isReachable({ phone: '   ' })).toBe(false)
  })
})
