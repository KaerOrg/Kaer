import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithClient } from '../../../../../test/renderWithClient'
import { CrisisAnchorsWidget } from './CrisisAnchorsWidget'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../../../../contexts/usePatientView', () => ({ usePatientView: () => 'patient-1' }))

const mockFetch = vi.fn()
vi.mock('@services/crisisPlanService', () => ({
  fetchCrisisPlanConfig: (id: string) => mockFetch(id),
}))

beforeEach(() => vi.clearAllMocks())

describe('CrisisAnchorsWidget', () => {
  it('affiche le message praticien configuré', async () => {
    mockFetch.mockResolvedValue({ practitionerMessage: 'Tu comptes', copingCards: [], commitmentPhrase: '' })
    renderWithClient(<CrisisAnchorsWidget />)

    expect(await screen.findByText('Tu comptes')).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith('patient-1')
  })

  it('n\'affiche pas de message quand vide', async () => {
    mockFetch.mockResolvedValue({ practitionerMessage: '', copingCards: [], commitmentPhrase: '' })
    const { container } = renderWithClient(<CrisisAnchorsWidget />)

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(container.querySelector('.crisis-anchors-widget__practitioner-msg')).toBeNull()
  })
})
