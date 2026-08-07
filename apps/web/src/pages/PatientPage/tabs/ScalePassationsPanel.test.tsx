import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr-FR' } }),
}))

const mockFetchModuleFields = vi.fn()
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: (...args: unknown[]) => mockFetchModuleFields(...args),
}))

const mockFetchScalePassations = vi.fn()
const mockMarkPassationRead = vi.fn()
vi.mock('@services/engagementService', () => ({
  fetchScalePassations: (...args: unknown[]) => mockFetchScalePassations(...args),
  markPassationRead: (...args: unknown[]) => mockMarkPassationRead(...args),
}))

const mockFetchScaleSchedule = vi.fn()
vi.mock('@services/scaleScheduleService', () => ({
  fetchScaleSchedule: (...args: unknown[]) => mockFetchScaleSchedule(...args),
  fetchScaleSchedules: vi.fn(),
  saveScaleSchedule: vi.fn(),
  deleteScaleSchedule: vi.fn(),
}))

const mockFetchScaleMeta = vi.fn()
vi.mock('@services/scaleService', () => ({
  fetchScaleMeta: (...args: unknown[]) => mockFetchScaleMeta(...args),
}))

import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ContentField } from '@services/moduleService'
import { ScalePassationsPanel } from './ScalePassationsPanel'

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
  field({ id: 'meta', field_type: 'scale_meta', props: { instrument_citation: 'PHQ-9, Kroenke, 2001' } }),
  field({ id: 'q1', field_type: 'scale_question', text_code: 'q1', sort_order: 100 }),
  field({ id: 'q2', field_type: 'scale_question', text_code: 'q2', sort_order: 101 }),
  field({ id: 'opt0', field_type: 'scale_option', text_code: 'opt_0', sort_order: 10, props: { value: '0' } }),
  field({ id: 'opt1', field_type: 'scale_option', text_code: 'opt_1', sort_order: 11, props: { value: '1' } }),
]

const PASSATIONS = [
  { id: 'p0', date: '2026-07-14T09:00:00Z', answers: [1, 1], totalScore: 2, readAt: null },
  { id: 'p1', date: '2026-07-28T21:12:00Z', answers: [0, 1], totalScore: 1, readAt: null },
]

function renderPanel() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ScalePassationsPanel patientId="pat-1" moduleType="phq9" />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchModuleFields.mockResolvedValue({ preview_kind: 'questionnaire', fields: FIELDS })
  mockFetchScalePassations.mockResolvedValue(PASSATIONS)
  mockFetchScaleSchedule.mockResolvedValue(null)
  mockFetchScaleMeta.mockResolvedValue([{ id: 'phq9', evaluationType: 'auto' }])
  mockMarkPassationRead.mockResolvedValue(null)
})

describe('ScalePassationsPanel', () => {
  it('liste les passations (la plus récente en tête) et détaille celle-là par défaut', async () => {
    const { container } = renderPanel()

    await waitFor(() => expect(container.querySelectorAll('.spd-item').length).toBe(2))
    expect(mockFetchScalePassations).toHaveBeenCalledWith('pat-1', 'phq9')
    expect(container.querySelectorAll('.spd-item')[0].getAttribute('aria-current')).toBe('true')
    // La plus récente vaut 1 : c'est son détail qui est ouvert.
    expect(container.querySelector('.spd-total__score')?.textContent).toBe('1')
    // Et la précédente (14 juillet, 2) sert de comparaison.
    expect(container.querySelector('.spd-total__previous')?.textContent).toContain('scales.entry_detail.previous')
  })

  it('change de passation détaillée au clic', async () => {
    const { container } = renderPanel()

    await waitFor(() => expect(container.querySelectorAll('.spd-item').length).toBe(2))
    fireEvent.click(container.querySelectorAll('.spd-item')[1]) // la plus ancienne

    expect(container.querySelector('.spd-total__score')?.textContent).toBe('2')
    // Rien avant elle : aucun bloc de comparaison.
    expect(container.querySelector('.spd-total__previous')).toBeNull()
  })

  it('affiche un état vide quand aucune passation n’est arrivée', async () => {
    mockFetchScalePassations.mockResolvedValue([])
    const { container } = renderPanel()

    await waitFor(() => expect(container.textContent).toContain('scales.entry_detail.empty'))
    expect(container.querySelector('.spd-item')).toBeNull()
  })

  it('ne montre aucune échéance quand l’échelle n’a pas de cadence récurrente', async () => {
    const { container } = renderPanel()

    await waitFor(() => expect(container.querySelectorAll('.spd-item').length).toBe(2))
    expect(container.textContent).not.toContain('scales.entry_detail.next_due')
  })

  // ── Accusé de lecture (#419) ──────────────────────────────────────────────

  it('pose l\'accusé de lecture à l\'ouverture, sans aucune action du praticien', async () => {
    const { container } = renderPanel()

    await waitFor(() => expect(mockMarkPassationRead).toHaveBeenCalled())
    // Sur la passation réellement affichée, la plus récente.
    expect(mockMarkPassationRead).toHaveBeenCalledWith('pat-1', 'p1', 'phq9')
    // Et aucun bouton « j'ai lu » : le geste, c'est d'avoir ouvert l'écran.
    expect(container.textContent?.toLowerCase()).not.toContain('lu')
  })

  it('pose l\'accusé de la passation qu\'on ouvre ensuite', async () => {
    const { container } = renderPanel()

    await waitFor(() => expect(container.querySelectorAll('.spd-item').length).toBe(2))
    mockMarkPassationRead.mockClear()
    fireEvent.click(container.querySelectorAll('.spd-item')[1]) // la plus ancienne

    await waitFor(() => expect(mockMarkPassationRead).toHaveBeenCalledWith('pat-1', 'p0', 'phq9'))
  })

  it('ne pose aucun accusé quand il n\'y a rien à ouvrir', async () => {
    mockFetchScalePassations.mockResolvedValue([])
    const { container } = renderPanel()

    await waitFor(() => expect(container.textContent).toContain('scales.entry_detail.empty'))
    expect(mockMarkPassationRead).not.toHaveBeenCalled()
  })

  it('reprend la prochaine échéance de la programmation, jamais le retard', async () => {
    mockFetchScaleSchedule.mockResolvedValue({
      mode: 'home', frequency: 'biweekly', created_at: '2026-07-01T00:00:00Z', patient_reminder: true,
    })
    const { container } = renderPanel()

    await waitFor(() => expect(container.textContent).toContain('scales.entry_detail.next_due'))
    // `overdueDays` est un constat de calendrier destiné au tableau de suivi : il n'a
    // rien à faire dans la lecture d'une passation.
    expect(container.textContent).not.toContain('overdue')
  })
})
