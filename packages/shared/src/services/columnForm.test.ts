import { describe, it, expect } from 'vitest'
import type { ContentField } from '../index'
import { buildColumnSpecs, readSliderParams, CHILD_FIELD_TYPES } from './columnForm'

function field(over: Partial<ContentField> & Pick<ContentField, 'id' | 'field_type'>): ContentField {
  return {
    module_id: 'beck_columns', section_id: null, parent_field_id: null,
    text_code: null, sort_order: 0, props: {}, children: [], ...over,
  }
}

describe('buildColumnSpecs', () => {
  it('trie les en-têtes par sort_order et n’attache que les enfants de type colonne, triés', () => {
    const fields = [
      field({
        id: 'h2', field_type: 'column_header', sort_order: 20,
        children: [
          field({ id: 'x', field_type: 'not_a_column_child', sort_order: 1 }),
          field({ id: 'b', field_type: 'column_slider_field', sort_order: 3 }),
          field({ id: 'a', field_type: 'column_text_field', sort_order: 2 }),
        ],
      }),
      field({ id: 'h1', field_type: 'column_header', sort_order: 10, children: [] }),
      field({ id: 'cfg', field_type: 'column_form_config' }),
    ]
    const specs = buildColumnSpecs(fields)
    expect(specs.map(s => s.header.id)).toEqual(['h1', 'h2'])
    // Enfant non-colonne exclu, ordre par sort_order.
    expect(specs[1].children.map(c => c.id)).toEqual(['a', 'b'])
  })

  it('retourne un tableau vide sans column_header', () => {
    expect(buildColumnSpecs([field({ id: 'cfg', field_type: 'column_form_config' })])).toEqual([])
  })
})

describe('readSliderParams', () => {
  it('lit min/max/step depuis les props', () => {
    expect(readSliderParams(field({ id: 's', field_type: 'column_slider_field', props: { min: '0', max: '10', step: '1' } })))
      .toEqual({ min: 0, max: 10, step: 1 })
  })

  it('applique les défauts 0-100 pas 10', () => {
    expect(readSliderParams(field({ id: 's', field_type: 'column_slider_field' })))
      .toEqual({ min: 0, max: 100, step: 10 })
  })
})

describe('CHILD_FIELD_TYPES', () => {
  it('couvre les trois widgets de colonne', () => {
    expect([...CHILD_FIELD_TYPES].sort()).toEqual(['column_slider_field', 'column_text_field', 'column_time_field'])
  })
})
