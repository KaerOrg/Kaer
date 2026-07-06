import { describe, it, expect } from 'vitest'
import type { ContentField } from '@services/moduleService'
import {
  buildColumnSpecs,
  buildSliderSpecs,
  buildChartData,
  chartYDomain,
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

describe('buildSliderSpecs', () => {
  it('collecte les curseurs dans l’ordre des colonnes, avec bornes par défaut 0-100', () => {
    const specs = buildColumnSpecs([
      field({ id: 'h1', field_type: 'column_header', sort_order: 10, children: [slider('s1', 'emotion_intensity', 11)] }),
      field({ id: 'h2', field_type: 'column_header', sort_order: 20, children: [slider('s2', 'outcome_intensity', 21, { min: '10', max: '50' }), text('t1', 'outcome', 22)] }),
    ])

    const sliders = buildSliderSpecs(specs)

    expect(sliders).toEqual([
      { key: 'emotion_intensity', labelCode: 'modules.beck_columns.emotion_intensity', min: 0, max: 100 },
      { key: 'outcome_intensity', labelCode: 'modules.beck_columns.outcome_intensity', min: 10, max: 50 },
    ])
  })

  it('ignore un curseur sans prop key', () => {
    const specs = buildColumnSpecs([
      field({ id: 'h1', field_type: 'column_header', children: [field({ id: 's1', field_type: 'column_slider_field' })] }),
    ])

    expect(buildSliderSpecs(specs)).toEqual([])
  })
})

describe('buildChartData', () => {
  const sliders = [
    { key: 'emotion_intensity', labelCode: null, min: 0, max: 100 },
    { key: 'outcome_intensity', labelCode: null, min: 0, max: 100 },
  ]

  it('produit une ligne datée par fiche portant au moins une valeur numérique', () => {
    const rows = buildChartData(
      [
        { date: '2026-06-01', values: { emotion_intensity: 80, outcome_intensity: 40 } },
        { date: '2026-06-02', values: { situation: 'texte seul' } },
        { date: '2026-06-03', values: { outcome_intensity: 30 } },
      ],
      sliders,
    )

    expect(rows).toEqual([
      { date: '2026-06-01', emotion_intensity: 80, outcome_intensity: 40 },
      { date: '2026-06-03', outcome_intensity: 30 },
    ])
  })

  it('ignore les valeurs non numériques d’une clé de curseur', () => {
    const rows = buildChartData(
      [{ date: '2026-06-01', values: { emotion_intensity: 'fort' } }],
      sliders,
    )

    expect(rows).toEqual([])
  })
})

describe('chartYDomain', () => {
  it('englobe les bornes de tous les curseurs', () => {
    expect(chartYDomain([
      { key: 'a', labelCode: null, min: 10, max: 50 },
      { key: 'b', labelCode: null, min: 0, max: 80 },
    ])).toEqual([0, 80])
  })

  it('retombe sur 0-100 sans curseur', () => {
    expect(chartYDomain([])).toEqual([0, 100])
  })
})
