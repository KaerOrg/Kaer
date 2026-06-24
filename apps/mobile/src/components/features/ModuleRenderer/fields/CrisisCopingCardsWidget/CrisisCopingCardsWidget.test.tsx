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

jest.mock('../../../../../services/crisisPlanService', () => ({
  fetchPractitionerConfig: jest.fn(),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
import { CrisisCopingCardsWidget } from './CrisisCopingCardsWidget'
import * as service from '../../../../../services/crisisPlanService'

const svc = service as jest.Mocked<typeof service>

beforeEach(() => {
  jest.clearAllMocks()
  svc.fetchPractitionerConfig.mockResolvedValue({ practitionerMessage: '', copingCards: [], commitmentPhrase: '' })
})

describe('CrisisCopingCardsWidget', () => {
  it('affiche l\'état vide quand aucune carte', async () => {
    render(<CrisisCopingCardsWidget />)
    await waitFor(() => expect(svc.fetchPractitionerConfig).toHaveBeenCalledWith('patient-1'))
    expect(screen.getByText('modules.crisis_plan.coping_cards_empty')).toBeTruthy()
  })

  it('restitue les cartes du praticien (pensée + réponse)', async () => {
    svc.fetchPractitionerConfig.mockResolvedValue({
      practitionerMessage: '',
      commitmentPhrase: '',
      copingCards: [{ id: 'c1', thought: 'Je suis nul', response: 'Cette pensée passera' }],
    })
    render(<CrisisCopingCardsWidget />)
    expect(await screen.findByText('Je suis nul')).toBeTruthy()
    expect(screen.getByText('Cette pensée passera')).toBeTruthy()
  })
})
