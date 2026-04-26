jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import ASRS18EntryScreen from './ASRS18EntryScreen'
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
  saveASRS18Entry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id'),
}))

describe('ASRS18EntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('affiche 18 questions numérotées', () => {
    render(<ASRS18EntryScreen />)
    expect(screen.getByText('1.')).toBeTruthy()
    expect(screen.getByText('18.')).toBeTruthy()
  })

  it('affiche les séparateurs de section Partie A et Partie B', () => {
    render(<ASRS18EntryScreen />)
    expect(screen.getByText('PARTIE A')).toBeTruthy()
    expect(screen.getByText('PARTIE B')).toBeTruthy()
  })

  it('affiche les 5 options de fréquence', () => {
    render(<ASRS18EntryScreen />)
    expect(screen.getAllByText('Jamais').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Très souvent').length).toBeGreaterThanOrEqual(1)
  })

  it('affiche le compteur 0/18 au départ', () => {
    render(<ASRS18EntryScreen />)
    expect(screen.getByText('0 / 18 réponses')).toBeTruthy()
  })

  it('alerte si on valide sans réponses complètes', () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<ASRS18EntryScreen />)
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Questionnaire incomplet',
      expect.stringContaining('18 questions')
    )
  })

  it('sauvegarde avec les bons sous-scores après validation complète', async () => {
    render(<ASRS18EntryScreen />)

    // Répondre à toutes les questions avec "Souvent" (valeur 3)
    const options = screen.getAllByText('Souvent')
    options.forEach(opt => fireEvent.press(opt))

    fireEvent.press(screen.getByText('Valider le questionnaire'))

    await waitFor(() => {
      expect(database.saveASRS18Entry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          answers: Array(18).fill(3),
          sub_scores: { part_a: 18, part_b: 36 },
          total_score: 54,
        })
      )
      expect(mockGoBack).toHaveBeenCalled()
    })
  })

  it('met à jour le compteur quand une réponse est sélectionnée', () => {
    render(<ASRS18EntryScreen />)
    fireEvent.press(screen.getAllByText('Jamais')[0])
    expect(screen.getByText('1 / 18 réponses')).toBeTruthy()
  })
})
