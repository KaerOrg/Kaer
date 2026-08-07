import { readScoreDisplay } from './historyConfig'
import type { ContentField } from '@services/moduleService'

function meta(props: Record<string, string>): ContentField {
  return {
    id: 'phq9.scale_meta', module_id: 'phq9', section_id: null, parent_field_id: null,
    field_type: 'scale_meta', text_code: null, sort_order: 0, props, children: [],
  }
}

describe('readScoreDisplay', () => {
  it('lit la posture depuis scale_meta', () => {
    expect(readScoreDisplay([meta({ score_display: 'collapsed' })])).toBe('collapsed')
    expect(readScoreDisplay([meta({ score_display: 'inline' })])).toBe('inline')
  })

  it('retombe sur le comportement historique quand la clé est absente', () => {
    // Une échelle qui n'a rien demandé ne doit pas changer d'apparence dans son dos.
    expect(readScoreDisplay([meta({ category: 'Humeur' })])).toBe('inline')
  })

  it('retombe sur le comportement historique sans scale_meta, ou sans fields', () => {
    expect(readScoreDisplay([])).toBe('inline')
    expect(readScoreDisplay(null)).toBe('inline')
  })

  it('retombe sur le comportement historique sur une valeur inconnue', () => {
    // Une configuration erronée n'efface pas des informations déjà affichées.
    expect(readScoreDisplay([meta({ score_display: 'hidden' })])).toBe('inline')
  })
})
