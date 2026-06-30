import { vi, beforeEach, describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PsychoLibraryPicker } from './PsychoLibraryPicker'
import type { LibraryTopic, PsyEduTheme } from '@services/psyeduService'
import type { ModuleTaxonomy } from '@services/moduleCatalogService'

// ThemeSuggestionButton tire useToast/un service — stub (hors périmètre du picker).
vi.mock('../../../components/features/ThemeSuggestionButton', () => ({
  ThemeSuggestionButton: () => <div data-testid="suggest-btn" />,
}))

const THEMES: PsyEduTheme[] = [{ id: 'treatment', icon_name: 'Pill', sort_order: 1 }]
const TOPICS: LibraryTopic[] = [
  {
    id: 'tp1', module_key: 'm', theme_id: 'treatment', topic_key: 'sleep',
    icon_name: 'Moon', sort_order: 1, titleKey: 'sleep_title', summaryKey: 'sleep_summary', tags: [],
  },
  {
    id: 'tp2', module_key: 'm', theme_id: 'treatment', topic_key: 'diet',
    icon_name: 'Apple', sort_order: 2, titleKey: 'diet_title', summaryKey: 'diet_summary', tags: [],
  },
]
const EMPTY_TAXONOMY: ModuleTaxonomy = {
  dimensions: [], tagsByDimension: new Map(), tagsByModule: new Map(),
}

function setup(overrides: Partial<Parameters<typeof PsychoLibraryPicker>[0]> = {}) {
  const props = {
    mode: 'unlock' as const,
    libraryTopics: TOPICS,
    themes: THEMES,
    taxonomy: EMPTY_TAXONOMY,
    selectedTopicIds: new Set<string>(),
    saving: false,
    error: null as string | null,
    onToggle: vi.fn(),
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  }
  render(<PsychoLibraryPicker {...props} />)
  return props
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PsychoLibraryPicker', () => {
  it('rend les fiches (titleKey absent → la clé brute est affichée)', () => {
    setup()
    expect(screen.getByText('sleep_title')).toBeInTheDocument()
    expect(screen.getByText('diet_title')).toBeInTheDocument()
  })

  it('appelle onToggle avec le topicId au clic sur une case', async () => {
    const props = setup()
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    expect(props.onToggle).toHaveBeenCalledWith('tp1')
  })

  it('reflète la sélection via selectedTopicIds', () => {
    setup({ selectedTopicIds: new Set(['tp2']) })
    const checkboxes = screen.getAllByRole<HTMLInputElement>('checkbox')
    // tp1 d'abord (sort_order 1), tp2 ensuite.
    expect(checkboxes[0].checked).toBe(false)
    expect(checkboxes[1].checked).toBe(true)
  })

  it('filtre par recherche texte', async () => {
    setup()
    await userEvent.type(screen.getByRole('searchbox'), 'sleep')
    await waitFor(() => expect(screen.queryByText('diet_title')).toBeNull())
    expect(screen.getByText('sleep_title')).toBeInTheDocument()
  })

  it('affiche un message quand la recherche ne matche rien', async () => {
    setup()
    await userEvent.type(screen.getByRole('searchbox'), 'zzzznomatch')
    await waitFor(() => expect(screen.queryByText('sleep_title')).toBeNull())
    expect(screen.queryByText('diet_title')).toBeNull()
  })

  it('appelle onConfirm et onCancel', async () => {
    const props = setup({ selectedTopicIds: new Set(['tp1']) })
    await userEvent.click(screen.getByRole('button', { name: /débloquer|unlock/i }))
    expect(props.onConfirm).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: /annuler|cancel/i }))
    expect(props.onCancel).toHaveBeenCalledTimes(1)
  })

  it('affiche le message d’erreur fourni', () => {
    setup({ error: 'Oups' })
    expect(screen.getByText('Oups')).toBeInTheDocument()
  })
})
