import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr-FR' } }),
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
    module_id: 'beck_columns', section_id: null, parent_field_id: null,
    text_code: null, sort_order: 0, props: {}, children: [], ...over,
  }
}

// Module column_form minimal : émotion (texte + intensité) puis résultat (intensité + texte).
const FIELDS: ContentField[] = [
  field({ id: 'cfg', field_type: 'column_form_config' }),
  field({
    id: 'h1', field_type: 'column_header', sort_order: 20,
    text_code: 'modules.beck_columns.entry_col_2_title', props: { color: '#8B5CF6' },
    children: [
      field({ id: 'c1t', field_type: 'column_text_field', sort_order: 21, props: { key: 'emotion' } }),
      field({ id: 'c1s', field_type: 'column_slider_field', sort_order: 22, props: { key: 'emotion_intensity', color: '#8B5CF6' } }),
    ],
  }),
  field({
    id: 'h2', field_type: 'column_header', sort_order: 50,
    text_code: 'modules.beck_columns.entry_col_5_title',
    children: [
      field({ id: 'c2s', field_type: 'column_slider_field', sort_order: 51, props: { key: 'outcome_intensity', color: '#D97706' } }),
      field({ id: 'c2t', field_type: 'column_text_field', sort_order: 52, props: { key: 'outcome_emotion' } }),
    ],
  }),
]

const entry = (date: string, values: FormEntryRow['values']): FormEntryRow => ({ date, values })

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
  it('liste les saisies (la plus récente en tête) et détaille la sélection par défaut', async () => {
    const { container } = renderPanel([
      entry('2026-06-01T10:00:00Z', { emotion: 'colère', emotion_intensity: 70, outcome_intensity: 55 }),
      entry('2026-07-06T18:00:00Z', { emotion: 'anxiété', emotion_intensity: 80, outcome_intensity: 40, outcome_emotion: 'soulagement' }),
    ])

    await waitFor(() => expect(container.querySelectorAll('.cfd-entry').length).toBe(2))
    expect(mockFetchModuleFields).toHaveBeenCalledWith('beck_columns')
    // La plus récente (6 juillet) est en tête et détaillée par défaut.
    const items = container.querySelectorAll('.cfd-entry')
    expect(items[0].textContent).toContain('anxiété')
    expect(items[0].getAttribute('aria-current')).toBe('true')
    const detail = container.querySelector('.cfd-detail')?.textContent ?? ''
    expect(detail).toContain('80')
    expect(detail).toContain('40')
    expect(detail).toContain('soulagement')
  })

  it('change de fiche détaillée au clic sur une autre saisie', async () => {
    const { container } = renderPanel([
      entry('2026-06-01T10:00:00Z', { emotion: 'colère', emotion_intensity: 70, outcome_intensity: 55 }),
      entry('2026-07-06T18:00:00Z', { emotion: 'anxiété', emotion_intensity: 80, outcome_intensity: 40 }),
    ])

    await waitFor(() => expect(container.querySelectorAll('.cfd-entry').length).toBe(2))
    fireEvent.click(container.querySelectorAll('.cfd-entry')[1]) // la plus ancienne (colère)
    const detail = container.querySelector('.cfd-detail')?.textContent ?? ''
    expect(detail).toContain('70')
    expect(detail).toContain('55')
  })

  it('conformité MDR : aucun label interprétatif ni seuil sur les valeurs', async () => {
    const { container } = renderPanel([
      entry('2026-06-02T10:00:00Z', { emotion_intensity: 95, outcome_intensity: 90 }),
    ])

    await waitFor(() => expect(container.querySelectorAll('.cfd-move').length).toBe(1))
    expect(container.textContent).toContain('95')
    for (const word of ['sévère', 'grave', 'élevé', 'severe', 'high', 'danger']) {
      expect(container.textContent?.toLowerCase()).not.toContain(word)
    }
  })
})
