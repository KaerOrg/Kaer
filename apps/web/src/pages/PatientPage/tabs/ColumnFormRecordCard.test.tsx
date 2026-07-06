import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { ContentField } from '@services/moduleService'
import type { FormEntryRow } from '@services/engagementService'
import type { ColumnSpec } from './columnFormData'
import { ColumnFormRecordCard } from './ColumnFormRecordCard'

const t = (key: string) => key

function child(over: Partial<ContentField> & Pick<ContentField, 'id' | 'field_type'>): ContentField {
  return {
    module_id: 'beck_columns', section_id: null, parent_field_id: null,
    text_code: null, sort_order: 0, props: {}, children: [], ...over,
  }
}

const columns: ColumnSpec[] = [
  {
    header: child({ id: 'h1', field_type: 'column_header', text_code: 'modules.beck_columns.entry_col_2_title', props: { color: '#8B5CF6' } }),
    children: [
      child({ id: 'c1t', field_type: 'column_text_field', props: { key: 'emotion' } }),
      child({ id: 'c1s', field_type: 'column_slider_field', text_code: 'modules.beck_columns.entry_col_2_intensity', props: { key: 'emotion_intensity' } }),
    ],
  },
  {
    header: child({ id: 'h2', field_type: 'column_header', text_code: 'modules.beck_columns.entry_col_5_title' }),
    children: [child({ id: 'c2t', field_type: 'column_text_field', props: { key: 'outcome' } })],
  },
]

function entry(values: FormEntryRow['values']): FormEntryRow {
  return { date: '2026-06-03T18:00:00Z', values }
}

describe('ColumnFormRecordCard', () => {
  it('rend le texte intégral et la valeur brute du curseur d’une colonne renseignée', () => {
    const long = 'Je vais tout rater demain et tout le monde va le voir.'
    const { container } = render(
      <ColumnFormRecordCard entry={entry({ emotion: long, emotion_intensity: 80 })} columns={columns} locale="fr" t={t} />,
    )
    expect(container.textContent).toContain(long)
    expect(container.textContent).toContain('80')
  })

  it('masque une colonne dont aucune valeur n’est renseignée', () => {
    const { container } = render(
      <ColumnFormRecordCard entry={entry({ emotion: 'colère' })} columns={columns} locale="fr" t={t} />,
    )
    const titles = [...container.querySelectorAll('.cfd-record__column-title')].map(el => el.textContent)
    expect(titles).toEqual(['modules.beck_columns.entry_col_2_title'])
  })

  it('MDR : la valeur est restituée brute, sans qualificatif de gravité', () => {
    const { container } = render(
      <ColumnFormRecordCard entry={entry({ emotion_intensity: 95 })} columns={columns} locale="fr" t={t} />,
    )
    expect(container.textContent).toContain('95')
    for (const word of ['sévère', 'grave', 'élevé', 'severe', 'high']) {
      expect(container.textContent?.toLowerCase()).not.toContain(word)
    }
  })
})
