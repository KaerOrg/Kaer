jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react')
  return {
    useFocusEffect: (cb: () => unknown) => {
      ReactLib.useEffect(() => cb(), [])
    },
  }
})

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-1' } }),
}))

const mockShowToast = jest.fn()
jest.mock('../../../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

jest.mock('../../../../../lib/dateUtils', () => ({
  formatDateLong: (s: string) => `long:${s}`,
}))

jest.mock('@services/crisisPlanService', () => ({
  getCommitment: jest.fn(),
  saveCommitment: jest.fn(),
  fetchPractitionerConfig: jest.fn(),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { CrisisCommitmentWidget } from './CrisisCommitmentWidget'
import * as service from '@services/crisisPlanService'

const svc = service as jest.Mocked<typeof service>

beforeEach(() => {
  jest.clearAllMocks()
  svc.getCommitment.mockResolvedValue(null)
  svc.saveCommitment.mockResolvedValue(undefined)
  svc.fetchPractitionerConfig.mockResolvedValue({ practitionerMessage: '', copingCards: [], commitmentPhrase: '' })
})

describe('CrisisCommitmentWidget', () => {
  it('affiche le formulaire de signature quand aucun engagement', async () => {
    render(<CrisisCommitmentWidget />)
    await waitFor(() => expect(svc.getCommitment).toHaveBeenCalled())
    expect(screen.getByPlaceholderText('modules.crisis_plan.commitment_sign_placeholder')).toBeTruthy()
  })

  it('utilise la phrase par défaut quand le praticien n\'en a pas configuré', async () => {
    render(<CrisisCommitmentWidget />)
    expect(await screen.findByText('modules.crisis_plan.commitment_phrase_default')).toBeTruthy()
  })

  it('signe l\'engagement avec le prénom saisi', async () => {
    render(<CrisisCommitmentWidget />)
    await waitFor(() => expect(svc.getCommitment).toHaveBeenCalled())
    fireEvent.changeText(screen.getByPlaceholderText('modules.crisis_plan.commitment_sign_placeholder'), 'Marie')
    fireEvent.press(screen.getByText('modules.crisis_plan.commitment_sign_button'))
    await waitFor(() => expect(svc.saveCommitment).toHaveBeenCalledWith('Marie'))
    expect(await screen.findByText('Marie')).toBeTruthy()
  })

  it('affiche l\'engagement déjà signé', async () => {
    svc.getCommitment.mockResolvedValue({ name: 'Jean', date: '2026-06-20T10:00:00.000Z' })
    render(<CrisisCommitmentWidget />)
    expect(await screen.findByText('Jean')).toBeTruthy()
    expect(screen.getByText('modules.crisis_plan.commitment_update')).toBeTruthy()
  })
})
