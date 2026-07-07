import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithClient } from '../../../../../test/renderWithClient'
import { PsyEduLibraryLayout } from './PsyEduLibraryLayout'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockFetchTopics = vi.fn()
const mockFetchThemes = vi.fn()
vi.mock('@services/psyeduService', () => ({
  fetchLibraryTopics: () => mockFetchTopics(),
  fetchThemes: () => mockFetchThemes(),
}))

// PsyEduBlocks fait son propre fetch de blocs — stub pour isoler le layout.
vi.mock('../PsyEduLayout/PsyEduBlocks', () => ({
  PsyEduBlocks: ({ topicId }: { topicId: string }) => <div data-testid={`blocks-${topicId}`} />,
}))

const THEMES = [{ id: 'treatment', icon_name: 'Pill', sort_order: 1 }]
const TOPICS = [
  {
    id: 't1', module_key: 'psyedu_sleep', theme_id: 'treatment', topic_key: 'sleep',
    icon_name: 'Moon', sort_order: 1, titleKey: 'psyedu_sleep.sleep.title',
    summaryKey: 'psyedu_sleep.sleep.summary', tags: [],
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PsyEduLibraryLayout (web)', () => {
  it('charge puis affiche les fiches groupées par thème', async () => {
    mockFetchTopics.mockResolvedValue(TOPICS)
    mockFetchThemes.mockResolvedValue(THEMES)
    renderWithClient(<PsyEduLibraryLayout />)
    // titleKey absent des locales → defaultValue = topic_key ('sleep').
    expect(await screen.findByText('sleep')).toBeInTheDocument()
  })

  it('affiche un état vide quand aucune fiche', async () => {
    mockFetchTopics.mockResolvedValue([])
    mockFetchThemes.mockResolvedValue(THEMES)
    renderWithClient(<PsyEduLibraryLayout />)
    await waitFor(() => expect(mockFetchTopics).toHaveBeenCalled())
    expect(await screen.findByText(/aucune fiche|empty/i)).toBeInTheDocument()
  })

  it('affiche un état erreur si le chargement échoue', async () => {
    mockFetchTopics.mockRejectedValue(new Error('boom'))
    mockFetchThemes.mockResolvedValue(THEMES)
    renderWithClient(<PsyEduLibraryLayout />)
    await waitFor(() =>
      expect(document.querySelector('.psyedu--error')).toBeInTheDocument()
    )
  })

  it('déplie une fiche au clic et rend ses blocs', async () => {
    mockFetchTopics.mockResolvedValue(TOPICS)
    mockFetchThemes.mockResolvedValue(THEMES)
    renderWithClient(<PsyEduLibraryLayout />)
    const row = await screen.findByRole('button', { name: /sleep/i })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(row)
    expect(row).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('blocks-t1')).toBeInTheDocument()
  })
})
