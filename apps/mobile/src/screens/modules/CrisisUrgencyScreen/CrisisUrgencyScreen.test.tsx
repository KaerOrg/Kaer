const mockGoBack = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))

jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ tt: (_m: string, k: string) => `tt:${k}` }),
}))

jest.mock('../../../services/moduleService', () => ({
  fetchModuleFields: jest.fn(),
}))

jest.mock('../../../components/features/ModuleRenderer/FieldRenderer', () => {
  const ReactLib = require('react')
  const { Text } = require('react-native')
  return {
    FieldRenderer: ({ preview_kind }: { preview_kind: string }) =>
      ReactLib.createElement(Text, null, `renderer:${preview_kind}`),
  }
})

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import CrisisUrgencyScreen from './CrisisUrgencyScreen'
import * as moduleService from '../../../services/moduleService'

const svc = moduleService as jest.Mocked<typeof moduleService>

beforeEach(() => {
  jest.clearAllMocks()
  svc.fetchModuleFields.mockResolvedValue({ preview_kind: 'editable_steps', fields: [] })
})

describe('CrisisUrgencyScreen', () => {
  it('charge les fields crisis_plan et rend le layout crisis_urgency', async () => {
    render(<CrisisUrgencyScreen />)
    await waitFor(() => expect(svc.fetchModuleFields).toHaveBeenCalledWith('crisis_plan'))
    expect(await screen.findByText('renderer:crisis_urgency')).toBeTruthy()
  })

  it('affiche le titre urgence (teen-aware) et ferme via goBack', async () => {
    render(<CrisisUrgencyScreen />)
    expect(screen.getByText('tt:urgency_title')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('tt:urgency_title'))
    expect(mockGoBack).toHaveBeenCalled()
    await waitFor(() => expect(svc.fetchModuleFields).toHaveBeenCalled())
  })
})
