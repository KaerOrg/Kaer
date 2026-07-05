import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

// Stub du graphique recharts (non rendu en jsdom) : on expose les séries.
vi.mock('../../../components/ui/Chart', () => ({
  LineChart: ({ series }: { series: { key: string }[] }) => (
    <div data-testid="linechart" data-series={series.map(s => s.key).join(',')} />
  ),
}))

const mockFetchModuleFields = vi.fn()
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: (...args: unknown[]) => mockFetchModuleFields(...args),
}))

import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ContentField } from '@services/moduleService'
import type { FormEntryRow } from '@services/engagementService'
import { ColumnFormDataPanel } from './ColumnFormDataPanel'

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

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

// Module column_form minimal : 2 colonnes (texte + curseur ; texte + curseur).
const FIELDS: ContentField[] = [
  field({ id: 'cfg', field_type: 'column_form_config' }),
  field({
    id: 'h1', field_type: 'column_header', sort_order: 10,
    text_code: 'modules.beck_columns.entry_col_2_title',
    props: { color: '#8B5CF6' },
    children: [
      field({ id: 'c1t', field_type: 'column_text_field', sort_order: 11, props: { key: 'emotion' } }),
      field({
        id: 'c1s', field_type: 'column_slider_field', sort_order: 12,
        text_code: 'modules.beck_columns.entry_col_2_intensity', props: { key: 'emotion_intensity' },
      }),
    ],
  }),
  field({
    id: 'h2', field_type: 'column_header', sort_order: 50,
    text_code: 'modules.beck_columns.entry_col_5_title',
    children: [
      field({ id: 'c2t', field_type: 'column_text_field', sort_order: 51, props: { key: 'outcome_emotion' } }),
      field({
        id: 'c2s', field_type: 'column_slider_field', sort_order: 52,
        text_code: 'modules.beck_columns.entry_col_5_intensity', props: { key: 'outcome_intensity' },
      }),
    ],
  }),
]

function entry(date: string, values: FormEntryRow['values']): FormEntryRow {
  return { date, values }
}

function renderPanel(entries: FormEntryRow[]) {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ColumnFormDataPanel moduleType="beck_columns" entries={entries} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchModuleFields.mockResolvedValue({ preview_kind: 'column_form', fields: FIELDS })
})

describe('ColumnFormDataPanel', () => {
  it('trace une série par curseur du module (valeurs brutes)', async () => {
    const { getByTestId } = renderPanel([
      entry('2026-06-01T10:00:00Z', { emotion_intensity: 80, outcome_intensity: 40 }),
      entry('2026-06-02T10:00:00Z', { emotion_intensity: 60, outcome_intensity: 30 }),
    ])

    await waitFor(() => expect(getByTestId('linechart')).toBeTruthy())
    expect(mockFetchModuleFields).toHaveBeenCalledWith('beck_columns')
    expect(getByTestId('linechart').getAttribute('data-series')).toBe('emotion_intensity,outcome_intensity')
  })

  it('restitue les fiches complètes, la plus récente d’abord, textes intégraux et valeurs brutes', async () => {
    const longText = 'Je vais tout rater demain, comme la dernière fois, et tout le monde va le voir.'
    const { container } = renderPanel([
      entry('2026-06-01T10:00:00Z', { emotion: 'anxiété', emotion_intensity: 80 }),
      entry('2026-06-03T18:00:00Z', { emotion: longText, outcome_emotion: 'soulagement', outcome_intensity: 40 }),
    ])

    await waitFor(() => expect(container.querySelectorAll('.cfd-record').length).toBe(2))
    const records = container.querySelectorAll('.cfd-record')
    // Antichronologique : la fiche du 3 juin d'abord, texte intégral non tronqué.
    expect(records[0].textContent).toContain(longText)
    expect(records[0].textContent).toContain('soulagement')
    expect(records[0].textContent).toContain('40')
    expect(records[1].textContent).toContain('anxiété')
    expect(records[1].textContent).toContain('80')
  })

  it('masque les colonnes vides d’une fiche', async () => {
    const { container } = renderPanel([
      entry('2026-06-01T10:00:00Z', { emotion: 'colère' }),
    ])

    await waitFor(() => expect(container.querySelectorAll('.cfd-record').length).toBe(1))
    const titles = [...container.querySelectorAll('.cfd-record__column-title')].map(el => el.textContent)
    expect(titles).toEqual(['modules.beck_columns.entry_col_2_title'])
  })

  it('pagine les fiches : 10 visibles puis « voir plus »', async () => {
    const entries = Array.from({ length: 12 }, (_, i) =>
      entry(`2026-06-${String(i + 1).padStart(2, '0')}T10:00:00Z`, { emotion: `e${i}` }))
    const { container, getByText } = renderPanel(entries)

    await waitFor(() => expect(container.querySelectorAll('.cfd-record').length).toBe(10))
    fireEvent.click(getByText('patient.form_show_more'))
    expect(container.querySelectorAll('.cfd-record').length).toBe(12)
  })

  it('conformité MDR : aucun label interprétatif ni seuil sur les valeurs', async () => {
    const { container } = renderPanel([
      entry('2026-06-01T10:00:00Z', { emotion_intensity: 95 }),
      entry('2026-06-02T10:00:00Z', { emotion_intensity: 90 }),
    ])

    await waitFor(() => expect(container.querySelectorAll('.cfd-record').length).toBe(2))
    // La valeur est restituée brute, sans qualificatif de gravité.
    expect(container.textContent).toContain('95')
    for (const word of ['sévère', 'grave', 'élevé', 'severe', 'high', 'danger']) {
      expect(container.textContent?.toLowerCase()).not.toContain(word)
    }
  })
})
