import { describe, it, expect } from 'vitest'
import type { ContentField } from '@services/moduleService'
import {
  buildPassationRows,
  readMinInterpretableChange,
  readPractitionerNotes,
} from './passationRows'

function field(
  over: Partial<ContentField> & Pick<ContentField, 'id' | 'field_type'>,
): ContentField {
  return {
    module_id: 'phq9', section_id: null, parent_field_id: null,
    text_code: null, sort_order: 0, props: {}, children: [], ...over,
  }
}

function option(id: string, value: string, sortOrder: number): ContentField {
  return field({
    id, field_type: 'scale_option', text_code: `opt.${value}`,
    sort_order: sortOrder, props: { value },
  })
}

/** Questionnaire minimal du même moule que le PHQ-9 : 2 items cotés + 1 hors score. */
const FIELDS: ContentField[] = [
  field({ id: 'meta', field_type: 'scale_meta', props: { min_interpretable_change: '5' } }),
  option('opt0', '0', 10),
  option('opt1', '1', 11),
  option('opt2', '2', 12),
  option('opt3', '3', 13),
  field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100 }),
  field({ id: 'q2', field_type: 'scale_question', text_code: 'q2', sort_order: 101 }),
  field({
    id: 'q3', field_type: 'scale_question', text_code: 'q3', sort_order: 102,
    props: { scored: 'false' },
    children: [
      field({ id: 'q3.o0', field_type: 'scale_option', text_code: 'q3.opt0', sort_order: 1, props: { value: '0' } }),
      field({ id: 'q3.o1', field_type: 'scale_option', text_code: 'q3.opt1', sort_order: 2, props: { value: '1' } }),
    ],
  }),
  field({ id: 'note', field_type: 'scale_practitioner_note', text_code: 'note.item2', sort_order: 990 }),
]

describe('buildPassationRows', () => {
  it('associe chaque réponse à son item et à la modalité choisie', () => {
    const { scored } = buildPassationRows(FIELDS, [2, 0])

    expect(scored.map(r => [r.position, r.labelCode, r.optionCode, r.value])).toEqual([
      [1, 'q1', 'opt.2', 2],
      [2, 'q2', 'opt.0', 0],
    ])
  })

  it('sépare les items hors score, et leur applique LEURS propres modalités', () => {
    const { scored, unscored } = buildPassationRows(FIELDS, [1, 1, 1])

    expect(scored).toHaveLength(2)
    expect(unscored).toHaveLength(1)
    // La modalité vient de l'item, pas des options communes du questionnaire (#410).
    expect(unscored[0].optionCode).toBe('q3.opt1')
    expect(unscored[0].position).toBe(3)
  })

  it('dérive le total maximal des seuls items cotés', () => {
    // 2 items cotés × 3 = 6. L'item hors score, borné à 1, n'y entre pas.
    expect(buildPassationRows(FIELDS, [0, 0, 0]).maxScore).toBe(6)
  })

  it('borne un item à curseur par sa prop `max`, faute de modalités', () => {
    const slider = [
      field({ id: 's1', field_type: 'scale_slider_question', text_code: 's1', sort_order: 1, props: { max: '10' } }),
    ]
    expect(buildPassationRows(slider, [7]).maxScore).toBe(10)
  })

  it('rend le total maximal indéterminable plutôt que faux quand un item n\'a pas de borne', () => {
    const unbounded = [
      field({ id: 's1', field_type: 'scale_slider_question', text_code: 's1', sort_order: 1 }),
    ]
    expect(buildPassationRows(unbounded, [7]).maxScore).toBeNull()
  })

  it('n\'invente aucune ligne pour un item posé APRÈS la passation', () => {
    // Passation d'avant l'arrivée de l'item hors score : 2 réponses pour 3 items.
    const { scored, unscored } = buildPassationRows(FIELDS, [3, 3])

    expect(scored).toHaveLength(2)
    expect(unscored).toHaveLength(0)
  })

  it('garde la ligne d\'un item posé mais laissé sans réponse', () => {
    const { scored } = buildPassationRows(FIELDS, [2, null])

    expect(scored).toHaveLength(2)
    expect(scored[1].value).toBeNull()
    expect(scored[1].optionCode).toBeNull()
  })

  it('n\'associe aucune modalité à une valeur hors de la liste', () => {
    const { scored } = buildPassationRows(FIELDS, [9, 0])

    expect(scored[0].value).toBe(9)
    expect(scored[0].optionCode).toBeNull()
  })

  it('ordonne les items par sort_order, pas par ordre de déclaration', () => {
    const shuffled = [FIELDS[6], FIELDS[5]] // q2 déclaré avant q1
    const { scored } = buildPassationRows(shuffled, [1, 2])

    expect(scored.map(r => r.labelCode)).toEqual(['q1', 'q2'])
  })

  it('ne rend rien pour un module sans question', () => {
    expect(buildPassationRows([], [1, 2])).toEqual({ scored: [], unscored: [], maxScore: 0 })
  })
})

describe('readMinInterpretableChange', () => {
  it('lit la valeur déclarée par l\'échelle', () => {
    expect(readMinInterpretableChange(FIELDS)).toBe(5)
  })

  it('retourne null quand l\'échelle n\'en déclare pas', () => {
    expect(readMinInterpretableChange([field({ id: 'meta', field_type: 'scale_meta' })])).toBeNull()
    expect(readMinInterpretableChange([])).toBeNull()
  })
})

describe('readPractitionerNotes', () => {
  it('collecte les notes du questionnaire', () => {
    expect(readPractitionerNotes(FIELDS).map(n => n.text_code)).toEqual(['note.item2'])
  })

  it('retourne une liste vide pour une échelle qui n\'en porte pas', () => {
    expect(readPractitionerNotes([FIELDS[5]])).toEqual([])
  })
})
