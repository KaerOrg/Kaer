import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithClient } from '../../../../../test/renderWithClient'
import { CrisisCopingCardsWidget } from './CrisisCopingCardsWidget'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../../../../contexts/usePatientView', () => ({ usePatientView: () => 'patient-1' }))

const mockFetch = vi.fn()
vi.mock('@services/crisisPlanService', () => ({
  fetchCrisisPlanConfig: (id: string) => mockFetch(id),
}))

beforeEach(() => vi.clearAllMocks())

describe('CrisisCopingCardsWidget', () => {
  it('affiche les cartes de coping configurées', async () => {
    mockFetch.mockResolvedValue({
      practitionerMessage: '', commitmentPhrase: '',
      copingCards: [{ id: 'c1', thought: 'Je panique', response: 'Je respire' }],
    })
    renderWithClient(<CrisisCopingCardsWidget />)

    expect(await screen.findByText('Je panique')).toBeInTheDocument()
    expect(screen.getByText('Je respire')).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith('patient-1')
  })

  it('affiche l\'état vide sans carte', async () => {
    mockFetch.mockResolvedValue({ practitionerMessage: '', commitmentPhrase: '', copingCards: [] })
    renderWithClient(<CrisisCopingCardsWidget />)

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(screen.getByText('modules.crisis_plan.coping_cards_empty')).toBeInTheDocument()
  })
})
