import { render, screen, waitFor } from '@testing-library/react'
import type { ModuleSource } from '@kaer/shared'

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
    render(<ModuleSourcesPanel moduleId="crisis_plan" />)
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('affiche les sources une fois chargées (happy path)', async () => {
    mockedFetch.mockResolvedValue([SOURCE])
    render(<ModuleSourcesPanel moduleId="crisis_plan" />)

    expect(await screen.findByText(SOURCE.label)).toBeInTheDocument()
    expect(screen.getByText('patient.sources_intro')).toBeInTheDocument()
    expect(screen.getByText(SOURCE.description!)).toBeInTheDocument()
    expect(mockedFetch).toHaveBeenCalledWith('crisis_plan')
  })

  it('rend un lien externe sécurisé quand url est présente', async () => {
    mockedFetch.mockResolvedValue([SOURCE])
    render(<ModuleSourcesPanel moduleId="crisis_plan" />)

    await screen.findByText(SOURCE.label)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', SOURCE.url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('affiche le label sans lien quand url est null', async () => {
    mockedFetch.mockResolvedValue([{ ...SOURCE, url: null }])
    render(<ModuleSourcesPanel moduleId="crisis_plan" />)

    expect(await screen.findByText(SOURCE.label)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('affiche l’état vide quand aucune source', async () => {
    mockedFetch.mockResolvedValue([])
    render(<ModuleSourcesPanel moduleId="crisis_plan" />)

    expect(await screen.findByText('patient.sources_empty')).toBeInTheDocument()
  })

  it('affiche l’état vide en cas d’erreur du service', async () => {
    mockedFetch.mockRejectedValue(new Error('rls denied'))
    render(<ModuleSourcesPanel moduleId="crisis_plan" />)

    await waitFor(() => expect(screen.getByText('patient.sources_empty')).toBeInTheDocument())
  })

  it('recharge les sources quand moduleId change', async () => {
    mockedFetch.mockResolvedValue([SOURCE])
    const { rerender } = render(<ModuleSourcesPanel moduleId="crisis_plan" />)
    await screen.findByText(SOURCE.label)

    rerender(<ModuleSourcesPanel moduleId="phq9" />)
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledWith('phq9'))
  })
})
