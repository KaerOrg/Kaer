jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import ASRS6EntryScreen from './ASRS6EntryScreen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../lib/database', () => ({
  saveASRS6Entry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id'),
}))

describe('ASRS6EntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('affiche 6 questions', () => {
    render(<ASRS6EntryScreen />)
    expect(screen.getByText('1.')).toBeTruthy()
    expect(screen.getByText('6.')).toBeTruthy()
  })

  it('affiche les 5 options de fréquence', () => {
    render(<ASRS6EntryScreen />)
    expect(screen.getAllByText('Jamais').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Très souvent').length).toBeGreaterThanOrEqual(1)
  })

  it('affiche le compteur 0/6 au départ', () => {
    render(<ASRS6EntryScreen />)
    expect(screen.getByText('0 / 6 réponses')).toBeTruthy()
  })

  it('alerte si on valide sans réponses complètes', () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<ASRS6EntryScreen />)
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Questionnaire incomplet',
      expect.stringContaining('6 questions')
    )
  })

  it('sauvegarde et revient en arrière après validation complète', async () => {
    render(<ASRS6EntryScreen />)

    // Répondre à toutes les questions avec "Parfois" (valeur 2)
    const options = screen.getAllByText('Parfois')
    options.forEach(opt => fireEvent.press(opt))

    fireEvent.press(screen.getByText('Valider le questionnaire'))

    await waitFor(() => {
      expect(database.saveASRS6Entry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          answers: [2, 2, 2, 2, 2, 2],
          total_score: 12,
        })
      )
      expect(mockGoBack).toHaveBeenCalled()
    })
  })

  it('met à jour le compteur quand une réponse est sélectionnée', () => {
    render(<ASRS6EntryScreen />)
    fireEvent.press(screen.getAllByText('Jamais')[0])
    expect(screen.getByText('1 / 6 réponses')).toBeTruthy()
  })
})
