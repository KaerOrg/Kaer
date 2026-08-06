import { readEntryMode, readInstructions, buildStepperQuestions } from './entryConfig'
import type { ContentField } from '@services/moduleService'
import type { Translate } from './StepperEntry'

const t: Translate = key => `T:${key}`

function field(over: Partial<ContentField> & Pick<ContentField, 'id' | 'field_type'>): ContentField {
  return {
    module_id: 'phq9',
    section_id: null,
    parent_field_id: null,
    text_code: null,
    sort_order: 0,
    props: {},
    children: [],
    ...over,
  }
}

describe('readEntryMode', () => {
  it('lit le mode depuis scale_meta', () => {
    const fields = [field({ id: 'm', field_type: 'scale_meta', props: { entry_mode: 'one_per_screen' } })]
    expect(readEntryMode(fields)).toBe('one_per_screen')
  })

  it('retombe sur la liste défilante quand scale_meta ne porte pas le mode', () => {
    const fields = [field({ id: 'm', field_type: 'scale_meta', props: { category: 'Humeur' } })]
    expect(readEntryMode(fields)).toBe('scrolling_list')
  })

  it('retombe sur la liste défilante quand il n\'y a pas de scale_meta', () => {
    expect(readEntryMode([field({ id: 'q1', field_type: 'scale_question' })])).toBe('scrolling_list')
  })

  it('retombe sur la liste défilante sur une valeur inconnue', () => {
    // Une configuration erronée dégrade vers le comportement historique : elle ne
    // doit jamais casser la saisie du patient.
    const fields = [field({ id: 'm', field_type: 'scale_meta', props: { entry_mode: 'carousel' } })]
    expect(readEntryMode(fields)).toBe('scrolling_list')
  })

  it('accepte des fields nuls (chargement en cours)', () => {
    expect(readEntryMode(null)).toBe('scrolling_list')
  })
})

describe('readInstructions', () => {
  it('rend les consignes triées par sort_order', () => {
    const fields = [
      field({ id: 'i2', field_type: 'scale_instruction', text_code: 'b', sort_order: 2 }),
      field({ id: 'i1', field_type: 'scale_instruction', text_code: 'a', sort_order: 1 }),
      field({ id: 'q1', field_type: 'scale_question', text_code: 'q', sort_order: 3 }),
    ]
    expect(readInstructions(fields, t)).toEqual(['T:a', 'T:b'])
  })

  it('rend un tableau vide sans consigne', () => {
    expect(readInstructions([], t)).toEqual([])
  })
})

describe('buildStepperQuestions', () => {
  const OPTIONS = [
    field({ id: 'o0', field_type: 'scale_option', text_code: 'opt0', sort_order: 10, props: { value: '0' } }),
    field({ id: 'o1', field_type: 'scale_option', text_code: 'opt1', sort_order: 11, props: { value: '1' } }),
  ]

  it('construit un item par question, avec les modalités communes', () => {
    const fields = [
      ...OPTIONS,
      field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100 }),
      field({ id: 'q2', field_type: 'scale_question', text_code: 'q2', sort_order: 101 }),
    ]
    const built = buildStepperQuestions(fields, t)
    expect(built.map(q => q.id)).toEqual(['q1', 'q2'])
    expect(built[0].label).toBe('T:q1')
    expect(built[0].options).toEqual([
      { value: 0, label: 'T:opt0' },
      { value: 1, label: 'T:opt1' },
    ])
  })

  it('respecte l\'ordre sort_order, pas l\'ordre du tableau', () => {
    // L'indexation doit coller à celle de `answers` : un décalage écrirait les
    // réponses dans les mauvaises cases.
    const fields = [
      ...OPTIONS,
      field({ id: 'q2', field_type: 'scale_question', text_code: 'q2', sort_order: 101 }),
      field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100 }),
    ]
    expect(buildStepperQuestions(fields, t).map(q => q.id)).toEqual(['q1', 'q2'])
  })

  it('préfère les modalités propres à un item quand il en porte', () => {
    const own = [
      field({ id: 'x0', field_type: 'scale_option', text_code: 'own0', sort_order: 1, props: { value: '0' } }),
    ]
    const fields = [
      ...OPTIONS,
      field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100, children: own }),
    ]
    expect(buildStepperQuestions(fields, t)[0].options).toEqual([{ value: 0, label: 'T:own0' }])
  })

  it('compte aussi les questions à curseur, comme le fait le tableau des réponses', () => {
    const fields = [
      ...OPTIONS,
      field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100 }),
      field({ id: 's1', field_type: 'scale_slider_question', text_code: 's1', sort_order: 101 }),
    ]
    expect(buildStepperQuestions(fields, t).map(q => q.id)).toEqual(['q1', 's1'])
  })
})
