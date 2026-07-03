import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithClient } from '../../../../../test/renderWithClient'
import { CrisisCommitmentWidget } from './CrisisCommitmentWidget'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Le widget lit le patient courant via le contexte d'aperçu.
vi.mock('../../../../../contexts/usePatientView', () => ({
  usePatientView: () => 'patient-1',
}))

const mockFetch = vi.fn()
vi.mock('@services/crisisPlanService', () => ({
  fetchCrisisPlanConfig: (id: string) => mockFetch(id),
}))

beforeEach(() => vi.clearAllMocks())

describe('CrisisCommitmentWidget', () => {
  it('affiche la phrase d\'engagement configurée', async () => {
    mockFetch.mockResolvedValue({ practitionerMessage: '', copingCards: [], commitmentPhrase: 'Je tiens bon' })
    renderWithClient(<CrisisCommitmentWidget />)

    expect(await screen.findByText('Je tiens bon')).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith('patient-1')
  })

  it('affiche la phrase par défaut + le libellé « non configuré » quand vide', async () => {
    mockFetch.mockResolvedValue({ practitionerMessage: '', copingCards: [], commitmentPhrase: '' })
    renderWithClient(<CrisisCommitmentWidget />)

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(screen.getByText('modules.crisis_plan.commitment_phrase_default')).toBeInTheDocument()
    expect(screen.getByText('modules.crisis_plan.commitment_not_configured')).toBeInTheDocument()
  })
})
