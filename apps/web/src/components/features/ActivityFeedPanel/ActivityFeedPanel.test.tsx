import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActivityFeedEvent } from '../../../lib/database.types'
import { renderWithClient } from '../../../test/renderWithClient'
import { ActivityFeedPanel } from './ActivityFeedPanel'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

const mockFeed = vi.fn()
vi.mock('@services/notificationRoutineService', () => ({
  getActivityFeed: (id: string) => mockFeed(id),
}))

function event(id: string, createdAt: string): ActivityFeedEvent {
  return { id, created_at: createdAt, metadata: { module_type: 'sleep_diary' } } as ActivityFeedEvent
}

beforeEach(() => vi.clearAllMocks())

describe('ActivityFeedPanel', () => {
  it('charge le fil au montage et affiche le badge « nouveauté »', async () => {
    mockFeed.mockResolvedValue([event('e1', '2026-07-03T10:00:00Z')])
    const { container } = renderWithClient(<ActivityFeedPanel practitionerId="pr1" />)

    await waitFor(() => expect(mockFeed).toHaveBeenCalledWith('pr1'))
    // Un événement non consulté → badge présent.
    await waitFor(() => expect(container.querySelector('.activity-feed__badge')).toBeInTheDocument())
  })

  it('efface le badge à l\'ouverture du panneau', async () => {
    mockFeed.mockResolvedValue([event('e1', '2026-07-03T10:00:00Z')])
    const { container } = renderWithClient(<ActivityFeedPanel practitionerId="pr1" />)
    await waitFor(() => expect(container.querySelector('.activity-feed__badge')).toBeInTheDocument())

    await userEvent.click(screen.getByLabelText('notifications.activity_feed_label'))

    expect(container.querySelector('.activity-feed__badge')).toBeNull()
  })

  it('n\'affiche pas de badge quand le fil est vide', async () => {
    mockFeed.mockResolvedValue([])
    const { container } = renderWithClient(<ActivityFeedPanel practitionerId="pr1" />)

    await waitFor(() => expect(mockFeed).toHaveBeenCalled())
    expect(container.querySelector('.activity-feed__badge')).toBeNull()
  })
})
