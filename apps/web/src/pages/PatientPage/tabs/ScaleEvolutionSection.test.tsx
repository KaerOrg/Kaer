import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr-FR' } }),
}))

const mockFetchModuleFields = vi.fn()
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: (...args: unknown[]) => mockFetchModuleFields(...args),
}))

const mockFetchScalePassations = vi.fn()
vi.mock('@services/engagementService', () => ({
  fetchScalePassations: (...args: unknown[]) => mockFetchScalePassations(...args),
}))

import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ContentField } from '@services/moduleService'
import { ScaleEvolutionSection } from './ScaleEvolutionSection'

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

function field(
  over: Partial<ContentField> & Pick<ContentField, 'id' | 'field_type'>,
): ContentField {
  return {
    module_id: 'phq9', section_id: null, parent_field_id: null,
    text_code: null, sort_order: 0, props: {}, children: [], ...over,
  }
}

const FIELDS: ContentField[] = [
  field({
    id: 'meta', field_type: 'scale_meta',
    props: { instrument_citation: 'PHQ-9, Kroenke, Spitzer & Williams, 2001' },
  }),
  field({ id: 'opt0', field_type: 'scale_option', text_code: 'opt_0', sort_order: 10, props: { value: '0' } }),
  field({ id: 'opt1', field_type: 'scale_option', text_code: 'opt_1', sort_order: 11, props: { value: '1' } }),
  field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100 }),
  field({
    id: 'q2', field_type: 'scale_question', text_code: 'q2', sort_order: 101,
    props: { track_in_evolution: 'true' },
  }),
]

/** Deux passations récentes, une très ancienne : de quoi éprouver la fenêtre. */
const PASSATIONS = [
  { id: 'old', date: '2024-01-10T10:00:00Z', answers: [1, 1], totalScore: 2, readAt: null },
  { id: 'a', date: '2026-06-30T10:00:00Z', answers: [1, 0], totalScore: 1, readAt: null },
  { id: 'b', date: '2026-07-14T10:00:00Z', answers: [0, 1], totalScore: 1, readAt: null },
]

function renderSection() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ScaleEvolutionSection patientId="pat-1" moduleType="phq9" />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchModuleFields.mockResolvedValue({ preview_kind: 'questionnaire', fields: FIELDS })
  mockFetchScalePassations.mockResolvedValue(PASSATIONS)
})

describe('ScaleEvolutionSection', () => {
  it('rend une bande par item suivi, avec un intitulé dérivé de son rang', async () => {
    const { container } = renderSection()

    await waitFor(() => expect(container.querySelectorAll('.sec__band').length).toBe(1))
    expect(container.querySelector('.sec__band-label')?.textContent)
      .toBe('scales.evolution.band_item')
  })

  it('borne l\'axe sur le total maximal dérivé de la configuration', async () => {
    // 2 items cotés × 1 = 2 : la graduation s'arrête à 0, jamais « / 27 » en dur.
    const { container } = renderSection()

    await waitFor(() => expect(container.querySelectorAll('.sec__tick').length).toBeGreaterThan(0))
    expect([...container.querySelectorAll('.sec__tick')].map(el => el.textContent)).toEqual(['0'])
  })

  it('applique la fenêtre par défaut de 6 mois', async () => {
    const { container } = renderSection()

    // La passation de 2024 est hors fenêtre : deux colonnes, pas trois.
    await waitFor(() => expect(container.querySelectorAll('.sec__point').length).toBe(2))
  })

  it('révèle tout l\'historique sur « tout »', async () => {
    const { container, getByText } = renderSection()

    await waitFor(() => expect(container.querySelectorAll('.sec__point').length).toBe(2))
    fireEvent.click(getByText('scales.evolution.window_all'))

    await waitFor(() => expect(container.querySelectorAll('.sec__point').length).toBe(3))
  })

  it('porte la citation des auteurs en pied de vue (#417)', async () => {
    const { container } = renderSection()

    await waitFor(() =>
      expect(container.querySelector('[data-testid="source-citation"]')?.textContent)
        .toContain('Kroenke'))
  })

  it('lit les passations du bon patient et du bon module', async () => {
    renderSection()
    await waitFor(() => expect(mockFetchScalePassations).toHaveBeenCalledWith('pat-1', 'phq9'))
    expect(mockFetchModuleFields).toHaveBeenCalledWith('phq9')
  })
})
