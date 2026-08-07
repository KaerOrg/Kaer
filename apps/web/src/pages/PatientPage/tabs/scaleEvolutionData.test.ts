import { describe, it, expect } from 'vitest'
import type { ContentField } from '@services/moduleService'
import type { ScalePassation } from '@services/engagementService'
import { readTrackedItems, toEvolutionEntries } from './scaleEvolutionData'

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
    id, field_type: 'scale_option', text_code: `opt_${value}`,
    sort_order: sortOrder, props: { value },
  })
}

/** Questionnaire du même moule que le PHQ-9 : 2 items cotés + 1 hors score, 2 suivis. */
const FIELDS: ContentField[] = [
  option('opt0', '0', 10),
  option('opt1', '1', 11),
  field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100 }),
  field({
    id: 'q2', field_type: 'scale_question', text_code: 'q2', sort_order: 101,
    props: { track_in_evolution: 'true' },
  }),
  field({
    id: 'q3', field_type: 'scale_question', text_code: 'q3', sort_order: 102,
    props: { scored: 'false', track_in_evolution: 'true' },
    children: [
      field({ id: 'q3.o0', field_type: 'scale_option', text_code: 'q3_opt_0', sort_order: 1, props: { value: '0' } }),
      field({ id: 'q3.o1', field_type: 'scale_option', text_code: 'q3_opt_1', sort_order: 2, props: { value: '1' } }),
    ],
  }),
]

function passation(over: Partial<ScalePassation> & Pick<ScalePassation, 'id'>): ScalePassation {
  return {
    date: '2026-07-14T10:00:00Z', answers: [1, 1, 1], totalScore: 2, readAt: null, ...over,
  }
}

describe('readTrackedItems', () => {
  it('ne retient que les items que la CONFIGURATION marque, avec leur rang', () => {
    // Aucun rang codé dans l'écran : la vue est partagée par toutes les échelles.
    expect(readTrackedItems(FIELDS)).toEqual([
      { fieldId: 'q2', position: 2, scored: true },
      { fieldId: 'q3', position: 3, scored: false },
    ])
  })

  it('rend une liste vide pour une échelle qui ne marque rien', () => {
    // Cas nominal : la vue se réduit alors à la courbe.
    expect(readTrackedItems([FIELDS[2]])).toEqual([])
    expect(readTrackedItems([])).toEqual([])
  })

  it('compte le rang sur TOUS les items posés, pas sur les seuls items suivis', () => {
    // Sinon l'item 9 du PHQ-9 s'annoncerait « item 1 » dans son intitulé de bande.
    const tracked = readTrackedItems(FIELDS)
    expect(tracked[0].position).toBe(2)
  })
})

describe('toEvolutionEntries', () => {
  const tracked = readTrackedItems(FIELDS)

  it('résout la modalité de chaque item suivi, dans l\'ordre des bandes', () => {
    const [entry] = toEvolutionEntries(
      [passation({ id: 'p1', answers: [0, 1, 0] })],
      FIELDS,
      tracked,
    )

    // q2 lit les options communes, q3 les siennes propres (#410).
    expect(entry.bandCodes).toEqual(['opt_1', 'q3_opt_0'])
  })

  it('reprend l\'identité, la date et le total de la passation', () => {
    const [entry] = toEvolutionEntries(
      [passation({ id: 'p1', date: '2026-08-01T09:00:00Z', totalScore: 18 })],
      FIELDS,
      tracked,
    )

    expect(entry.id).toBe('p1')
    expect(entry.date).toBe('2026-08-01T09:00:00Z')
    expect(entry.score).toBe(18)
  })

  it('porte `null` pour un item posé APRÈS la passation', () => {
    // Passation à 2 items, antérieure à l'arrivée du troisième.
    const [entry] = toEvolutionEntries(
      [passation({ id: 'p1', answers: [0, 1] })],
      FIELDS,
      tracked,
    )

    expect(entry.bandCodes).toEqual(['opt_1', null])
  })

  it('porte `null` pour un item posé mais laissé sans réponse', () => {
    const [entry] = toEvolutionEntries(
      [passation({ id: 'p1', answers: [0, null, 1] })],
      FIELDS,
      tracked,
    )

    expect(entry.bandCodes).toEqual([null, 'q3_opt_1'])
  })

  it('rend une liste vide sans passation', () => {
    expect(toEvolutionEntries([], FIELDS, tracked)).toEqual([])
  })
})
