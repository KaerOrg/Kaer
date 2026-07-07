import { describe, it, expect } from 'vitest'
import type { ContentField } from '@services/moduleService'
import {
  buildColumnSpecs,
  BECK_MOVEMENTS,
  SUMMARIZED_KEYS,
  readMovement,
  hasAnyMovement,
  findSliderColor,
  formatEntryDate,
  formatEntryDateShort,
} from './columnFormData'

// Factory typée : évite tout cast en construisant des ContentField complets.
function field(
  over: Partial<ContentField> & Pick<ContentField, 'id' | 'field_type'>,
): ContentField {
  return {
    module_id: 'beck_columns',
    section_id: null,
    parent_field_id: null,
    text_code: null,
    sort_order: 0,
    props: {},
    children: [],
    ...over,
  }
}

const slider = (id: string, key: string, sort = 0, props: Record<string, string> = {}) =>
  field({ id, field_type: 'column_slider_field', sort_order: sort, props: { key, ...props }, text_code: `modules.beck_columns.${key}` })

const text = (id: string, key: string, sort = 0) =>
  field({ id, field_type: 'column_text_field', sort_order: sort, props: { key } })

describe('buildColumnSpecs', () => {
  it('trie les colonnes et leurs enfants par sort_order, filtre les non column_*', () => {
    const fields = [
      field({ id: 'h2', field_type: 'column_header', sort_order: 20, children: [slider('s2', 'belief', 22), text('t2', 'thought', 21)] }),
      field({ id: 'h1', field_type: 'column_header', sort_order: 10, children: [text('t1', 'situation', 11), field({ id: 'x', field_type: 'footer_note' })] }),
      field({ id: 'cfg', field_type: 'column_form_config' }),
    ]

    const specs = buildColumnSpecs(fields)

    expect(specs.map(s => s.header.id)).toEqual(['h1', 'h2'])
    expect(specs[0].children.map(c => c.id)).toEqual(['t1'])
    expect(specs[1].children.map(c => c.id)).toEqual(['t2', 's2'])
  })
})

describe('BECK_MOVEMENTS / SUMMARIZED_KEYS', () => {
  it('couvre les deux mouvements du DTR (intensité, croyance)', () => {
    expect(BECK_MOVEMENTS.map(m => [m.beforeKey, m.afterKey])).toEqual([
      ['emotion_intensity', 'outcome_intensity'],
      ['thought_belief', 'outcome_belief'],
    ])
  })

  it('résume les quatre clés de curseur portées par les cartes de mouvement', () => {
    expect([...SUMMARIZED_KEYS].sort()).toEqual(
      ['emotion_intensity', 'outcome_belief', 'outcome_intensity', 'thought_belief'],
    )
  })
})

describe('readMovement', () => {
  it('restitue avant / après bruts et la différence arithmétique', () => {
    const res = readMovement({ date: 'd', values: { emotion_intensity: 80, outcome_intensity: 40 } }, BECK_MOVEMENTS[0])
    expect(res).toEqual({ before: 80, after: 40, delta: -40 })
  })

  it('coerce les valeurs numériques stockées en chaîne', () => {
    const res = readMovement({ date: 'd', values: { thought_belief: '85', outcome_belief: '60' } }, BECK_MOVEMENTS[1])
    expect(res).toEqual({ before: 85, after: 60, delta: -25 })
  })

  it('delta null si une des deux bornes manque', () => {
    expect(readMovement({ date: 'd', values: { emotion_intensity: 80 } }, BECK_MOVEMENTS[0]))
      .toEqual({ before: 80, after: null, delta: null })
  })

  it('ignore une valeur non numérique', () => {
    expect(readMovement({ date: 'd', values: { emotion_intensity: 'fort' } }, BECK_MOVEMENTS[0]))
      .toEqual({ before: null, after: null, delta: null })
  })
})

describe('hasAnyMovement', () => {
  it('vrai dès qu’une borne d’un mouvement est présente', () => {
    expect(hasAnyMovement({ date: 'd', values: { outcome_belief: 60 } })).toBe(true)
  })

  it('faux si aucune valeur de curseur résumé', () => {
    expect(hasAnyMovement({ date: 'd', values: { situation: 'texte' } })).toBe(false)
  })
})

describe('findSliderColor', () => {
  const columns = buildColumnSpecs([
    field({ id: 'h1', field_type: 'column_header', sort_order: 10, children: [slider('s1', 'emotion_intensity', 11, { color: '#8B5CF6' })] }),
    field({ id: 'h2', field_type: 'column_header', sort_order: 20, children: [text('t2', 'situation', 21)] }),
  ])

  it('dérive la couleur d’un curseur depuis la config (identité de colonne)', () => {
    expect(findSliderColor(columns, 'emotion_intensity')).toBe('#8B5CF6')
  })

  it('null si aucun curseur ne porte la clé', () => {
    expect(findSliderColor(columns, 'thought_belief')).toBeNull()
  })
})

describe('formatEntryDate', () => {
  it('formate la date métier locale en toutes lettres (fr) sans anglais', () => {
    const long = formatEntryDate('2026-07-06T10:00:00Z', 'fr-FR')
    expect(long.toLowerCase()).toContain('juillet')
    expect(long).not.toContain('July')
  })

  it('formate une date courte jour + mois', () => {
    expect(formatEntryDateShort('2026-07-06T10:00:00Z', 'fr-FR').toLowerCase()).toContain('juillet')
  })
})
