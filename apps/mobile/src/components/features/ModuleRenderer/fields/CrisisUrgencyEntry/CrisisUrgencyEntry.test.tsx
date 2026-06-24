const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { CrisisUrgencyEntry } from './CrisisUrgencyEntry'

beforeEach(() => jest.clearAllMocks())

describe('CrisisUrgencyEntry', () => {
  it('affiche le bandeau urgence', () => {
    render(<CrisisUrgencyEntry />)
    expect(screen.getByText('modules.crisis_plan.urgency_title')).toBeTruthy()
  })

  it('navigue vers CrisisUrgency au press', () => {
    render(<CrisisUrgencyEntry />)
    fireEvent.press(screen.getByLabelText('modules.crisis_plan.urgency_title'))
    expect(mockNavigate).toHaveBeenCalledWith('CrisisUrgency')
  })
})
