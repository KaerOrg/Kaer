import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import type { PsyEduTopic } from '@services/psyeduService'
import { renderWithClient } from '../../../../../test/renderWithClient'
import { PsyEduLayout } from './PsyEduLayout'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockFetchTopics = vi.fn()
vi.mock('@services/psyeduService', () => ({
  fetchTopicsByModule: (key: string) => mockFetchTopics(key),
}))

// PsyEduBlocks fait son propre fetch — stub pour isoler le layout.
vi.mock('./PsyEduBlocks', () => ({
  PsyEduBlocks: ({ topicId }: { topicId: string }) => <div data-testid={`blocks-${topicId}`} />,
}))

const TOPIC: PsyEduTopic = {
  id: 't1', module_key: 'psyedu_sleep', topic_key: 'sleep',
  icon_name: 'Moon', sort_order: 1, is_active: true,
}

beforeEach(() => vi.clearAllMocks())

describe('PsyEduLayout (web)', () => {
  it('charge et affiche les fiches du module', async () => {
    mockFetchTopics.mockResolvedValue([TOPIC])
    renderWithClient(<PsyEduLayout moduleId="psyedu_sleep" />)

    await waitFor(() => expect(mockFetchTopics).toHaveBeenCalledWith('psyedu_sleep'))
    // Le mock i18n renvoie la clé brute → le titre affiché est la clé dérivée du topic.
    expect(await screen.findByText('psyedu_sleep.sleep.title')).toBeInTheDocument()
  })

  it('affiche l\'état vide quand aucune fiche', async () => {
    mockFetchTopics.mockResolvedValue([])
    renderWithClient(<PsyEduLayout moduleId="psyedu_sleep" />)

    await waitFor(() => expect(document.querySelector('.psyedu--empty')).toBeInTheDocument())
  })

  it('ne fetche pas quand moduleId est vide (query désactivée)', () => {
    renderWithClient(<PsyEduLayout moduleId="" />)
    expect(mockFetchTopics).not.toHaveBeenCalled()
  })
})
