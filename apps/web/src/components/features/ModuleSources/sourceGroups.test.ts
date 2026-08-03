import { describe, it, expect } from 'vitest'
import type { ModuleSource, ModuleSourceType } from '@kaer/shared'
import { groupSourcesByEvidence, EVIDENCE_GROUPS } from './sourceGroups'

function source(id: string, type: ModuleSourceType, sort = 0): ModuleSource {
  return {
    id, module_id: 'm', label: `label ${id}`, source_type: type,
    url: null, evidence_grade: null, description: null, sort_order: sort,
  }
}

describe('groupSourcesByEvidence', () => {
  it('classe du niveau de preuve le plus élevé au plus bas', () => {
    const groups = groupSourcesByEvidence([
      source('a', 'expert_opinion'),
      source('b', 'rct'),
      source('c', 'meta_analysis'),
    ])
    expect(groups.map(g => g.id)).toEqual(['reviews', 'trials', 'mechanism'])
  })

  it('omet les groupes vides', () => {
    const groups = groupSourcesByEvidence([source('a', 'rct')])
    expect(groups).toHaveLength(1)
    expect(groups[0].id).toBe('trials')
  })

  it('conserve l\'ordre de la base à l\'intérieur d\'un groupe', () => {
    const groups = groupSourcesByEvidence([
      source('first', 'rct', 1),
      source('second', 'cohort_study', 2),
    ])
    expect(groups[0].sources.map(s => s.id)).toEqual(['first', 'second'])
  })

  it('répartit les SIX valeurs de ModuleSourceType, sans en inventer une septième', () => {
    const all: ModuleSourceType[] = [
      'rct', 'cohort_study', 'meta_analysis', 'systematic_review', 'guideline', 'expert_opinion',
    ]
    const groups = groupSourcesByEvidence(all.map((type, i) => source(`s${i}`, type)))
    const placed = groups.flatMap(g => g.sources)
    expect(placed).toHaveLength(all.length)
    expect(groups.map(g => g.id).every(id => EVIDENCE_GROUPS.includes(id))).toBe(true)
  })

  it('rend une liste vide sans source', () => {
    expect(groupSourcesByEvidence([])).toEqual([])
  })
})
