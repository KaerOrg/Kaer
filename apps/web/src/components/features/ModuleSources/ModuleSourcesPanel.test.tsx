import { screen, waitFor } from '@testing-library/react'
import type { ModuleSource } from '@kaer/shared'
import { renderWithClient } from '../../../test/renderWithClient'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@services/moduleSourcesService', () => ({
  fetchSourcesByModule: vi.fn(),
}))

import { fetchSourcesByModule } from '@services/moduleSourcesService'
import { ModuleSourcesPanel } from './ModuleSourcesPanel'

const mockedFetch = vi.mocked(fetchSourcesByModule)

const SOURCE: ModuleSource = {
  id: 's1',
  module_id: 'crisis_plan',
  label: 'Stanley & Brown (JAMA Psychiatry, 2018)',
  source_type: 'cohort_study',
  url: 'https://doi.org/10.1001/jamapsychiatry.2018.1776',
  evidence_grade: 'A',
  description: '45 % de comportements suicidaires en moins',
  sort_order: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ModuleSourcesPanel', () => {
  it('affiche l’état de chargement avant la résolution', () => {
    mockedFetch.mockReturnValue(new Promise(() => {})) // jamais résolue
    renderWithClient(<ModuleSourcesPanel moduleId="crisis_plan" />)
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('affiche les sources une fois chargées (happy path)', async () => {
    mockedFetch.mockResolvedValue([SOURCE])
    renderWithClient(<ModuleSourcesPanel moduleId="crisis_plan" />)

    expect(await screen.findByText(SOURCE.label)).toBeInTheDocument()
    expect(screen.getByText('patient.sources_intro')).toBeInTheDocument()
    expect(screen.getByText(SOURCE.description!)).toBeInTheDocument()
    expect(mockedFetch).toHaveBeenCalledWith('crisis_plan')
  })

  it('rend un lien externe sécurisé quand url est présente', async () => {
    mockedFetch.mockResolvedValue([SOURCE])
    renderWithClient(<ModuleSourcesPanel moduleId="crisis_plan" />)

    await screen.findByText(SOURCE.label)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', SOURCE.url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('affiche le label sans lien quand url est null', async () => {
    mockedFetch.mockResolvedValue([{ ...SOURCE, url: null }])
    renderWithClient(<ModuleSourcesPanel moduleId="crisis_plan" />)

    expect(await screen.findByText(SOURCE.label)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('groupe les sources par niveau de preuve, du plus lourd au plus léger', async () => {
    mockedFetch.mockResolvedValue([
      { ...SOURCE, id: 'a', source_type: 'expert_opinion', label: 'Willcox 1982', sort_order: 1 },
      { ...SOURCE, id: 'b', source_type: 'rct', label: 'Kircanski 2012', sort_order: 2 },
      { ...SOURCE, id: 'c', source_type: 'systematic_review', label: 'Revue 2025', sort_order: 3 },
    ])
    const { container } = renderWithClient(<ModuleSourcesPanel moduleId="emotion_wheel" />)

    await screen.findByText('Revue 2025')
    const titles = [...container.querySelectorAll('.sources-panel__group-title')].map(h => h.textContent)
    expect(titles).toEqual([
      'patient.sources_group_reviews',
      'patient.sources_group_trials',
      'patient.sources_group_mechanism',
    ])
  })

  it('n\'affiche que les groupes qui portent une source', async () => {
    mockedFetch.mockResolvedValue([{ ...SOURCE, source_type: 'rct' }])
    const { container } = renderWithClient(<ModuleSourcesPanel moduleId="emotion_wheel" />)

    await screen.findByText(SOURCE.label)
    const titles = [...container.querySelectorAll('.sources-panel__group-title')].map(h => h.textContent)
    expect(titles).toEqual(['patient.sources_group_trials'])
  })

  it('affiche l’état vide quand aucune source', async () => {
    mockedFetch.mockResolvedValue([])
    renderWithClient(<ModuleSourcesPanel moduleId="crisis_plan" />)

    expect(await screen.findByText('patient.sources_empty')).toBeInTheDocument()
  })

  it('affiche l’état vide en cas d’erreur du service', async () => {
    mockedFetch.mockRejectedValue(new Error('rls denied'))
    renderWithClient(<ModuleSourcesPanel moduleId="crisis_plan" />)

    await waitFor(() => expect(screen.getByText('patient.sources_empty')).toBeInTheDocument())
  })

  it('recharge les sources quand moduleId change', async () => {
    mockedFetch.mockResolvedValue([SOURCE])
    const { rerender } = renderWithClient(<ModuleSourcesPanel moduleId="crisis_plan" />)
    await screen.findByText(SOURCE.label)

    rerender(<ModuleSourcesPanel moduleId="phq9" />)
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledWith('phq9'))
  })
})
