import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { DefusionReader } from './DefusionReader'

const mockSave = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/defusionService', () => ({
  saveDefusionSession: (...a: unknown[]) => mockSave(...a),
}))
jest.mock('../../../../../lib/database', () => ({ generateId: () => 'df-test' }))
jest.mock('../../../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: jest.fn() }),
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

function renderReader(onClose = jest.fn()) {
  render(<DefusionReader technique="word_repetition" moduleId="cognitive_saturation" accent="#F59E0B" onClose={onClose} />)
  return onClose
}

describe('DefusionReader', () => {
  beforeEach(() => jest.clearAllMocks())

  it('démarre sur la saisie du mot, avec un bouton de fermeture', () => {
    renderReader()
    expect(screen.getByText('Quel mot voulez-vous travailler ?')).toBeTruthy()
    expect(screen.getByTestId('defusion-close')).toBeTruthy()
  })

  it('la fermeture appelle onClose', () => {
    const onClose = renderReader()
    fireEvent.press(screen.getByTestId('defusion-close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('un mot saisi puis « Continuer » mène à la mesure avant', () => {
    renderReader()
    fireEvent.changeText(screen.getByPlaceholderText('rater'), 'peur')
    fireEvent.press(screen.getByText('Continuer'))
    expect(screen.getByText('Avant de commencer')).toBeTruthy()
  })
})
