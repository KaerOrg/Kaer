import { describe, it, expect } from 'vitest'
import { partitionBySection } from './partitionBySection'
import type { ContentField } from '@services/moduleService'

function field(field_type: string, overrides: Partial<ContentField> = {}): ContentField {
  return {
    id: `${field_type}-${Math.random()}`,
    module_id: 'mod',
    section_id: null,
    parent_field_id: null,
    text_code: `${field_type}.text`,
    sort_order: 0,
    props: {},
    children: [],
    field_type,
    ...overrides,
  }
}

describe('partitionBySection', () => {
  it('regroupe les fields par section_id', () => {
    const a1 = field('step_title', { section_id: 'step-1' })
    const a2 = field('step_hint', { section_id: 'step-1' })
    const b1 = field('step_title', { section_id: 'step-2' })
    const { sections } = partitionBySection([a1, a2, b1])
    expect([...sections.keys()]).toEqual(['step-1', 'step-2'])
    expect(sections.get('step-1')).toEqual([a1, a2])
    expect(sections.get('step-2')).toEqual([b1])
  })

  it('place les fields sans section_id dans unsectioned', () => {
    const loose1 = field('footer_note')
    const loose2 = field('exercise_safety')
    const { sections, unsectioned } = partitionBySection([loose1, loose2])
    expect(sections.size).toBe(0)
    expect(unsectioned).toEqual([loose1, loose2])
  })

  it('sépare fields sectionnés et non sectionnés, en préservant l ordre', () => {
    const sectioned = field('step_title', { section_id: 'step-1' })
    const loose = field('footer_note')
    const { sections, unsectioned } = partitionBySection([sectioned, loose])
    expect(sections.get('step-1')).toEqual([sectioned])
    expect(unsectioned).toEqual([loose])
  })

  it('retourne des collections vides pour une entrée vide', () => {
    const { sections, unsectioned } = partitionBySection([])
    expect(sections.size).toBe(0)
    expect(unsectioned).toEqual([])
  })
})
