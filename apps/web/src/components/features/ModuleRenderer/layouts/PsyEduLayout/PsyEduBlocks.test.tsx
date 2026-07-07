import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import type { PsyEduBlock } from '@services/psyeduService'
import { renderWithClient } from '../../../../../test/renderWithClient'
import { PsyEduBlocks } from './PsyEduBlocks'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockFetchBlocks = vi.fn()
vi.mock('@services/psyeduService', () => ({
  fetchBlocksByTopic: (id: string) => mockFetchBlocks(id),
}))

const SECTION_ORDER = { why: 0, how: 1, sources: 2 } as const

const BLOCK: PsyEduBlock = {
  id: 'b1', topic_id: 't1', section_key: 'why', block_type: 'paragraph',
  text_code: 'psyedu.b1', items_codes: null, href: null, sort_order: 1,
}

beforeEach(() => vi.clearAllMocks())

describe('PsyEduBlocks (web)', () => {
  it('affiche le chargement puis les blocs du topic', async () => {
    mockFetchBlocks.mockResolvedValue([BLOCK])
    renderWithClient(<PsyEduBlocks topicId="t1" sectionOrder={SECTION_ORDER} />)

    expect(screen.getByText('common.loading')).toBeInTheDocument()
    await waitFor(() => expect(mockFetchBlocks).toHaveBeenCalledWith('t1'))
    expect(mockFetchBlocks).toHaveBeenCalledTimes(1)
  })

  it('affiche l\'état d\'erreur si le service échoue', async () => {
    mockFetchBlocks.mockRejectedValue(new Error('boom'))
    renderWithClient(<PsyEduBlocks topicId="t1" sectionOrder={SECTION_ORDER} />)

    await waitFor(() =>
      expect(document.querySelector('.psyedu__body--error')).toBeInTheDocument(),
    )
  })

  it('ne re-fetche pas un topic déjà en cache au 2e montage (dédup React Query)', async () => {
    mockFetchBlocks.mockResolvedValue([BLOCK])
    const { unmount, queryClient } = renderWithClient(
      <PsyEduBlocks topicId="t1" sectionOrder={SECTION_ORDER} />,
    )
    await waitFor(() => expect(mockFetchBlocks).toHaveBeenCalledTimes(1))
    unmount()

    // Remonté avec le MÊME client → la donnée est servie depuis le cache infini.
    renderWithClient(<PsyEduBlocks topicId="t1" sectionOrder={SECTION_ORDER} />, queryClient)
    await waitFor(() => expect(screen.getAllByText('psyedu.b1').length).toBeGreaterThan(0))
    expect(mockFetchBlocks).toHaveBeenCalledTimes(1)
  })
})
