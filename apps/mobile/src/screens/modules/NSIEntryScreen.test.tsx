jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import NSIEntryScreen from './NSIEntryScreen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../lib/database', () => ({
  saveNSIEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id'),
}))

describe('NSIEntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("affiche les 9 questions scorées", () => {
    render(<NSIEntryScreen />)
    // 9 items × 6 options = 54 boutons radio
    expect(screen.getAllByRole('radio')).toHaveLength(54)
  })

  it("affiche la consigne de période", () => {
    render(<NSIEntryScreen />)
    expect(screen.getByText(/Au cours du dernier mois/)).toBeTruthy()
  })

  it("affiche le compteur 0 sur 9 au départ", () => {
    render(<NSIEntryScreen />)
    expect(screen.getByText('0 / 9 réponses')).toBeTruthy()
  })

  it("incrémente le compteur après sélection d'une option", () => {
    render(<NSIEntryScreen />)
    const firstOption = screen.getAllByRole('radio')[0]
    fireEvent.press(firstOption)
    expect(screen.getByText('1 / 9 réponses')).toBeTruthy()
  })

  it("affiche une alerte si on valide avec des réponses manquantes", () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<NSIEntryScreen />)
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Questionnaire incomplet',
      expect.stringContaining('9 questions')
    )
    alertSpy.mockRestore()
  })

  it("sauvegarde et ferme l'écran quand les 9 réponses sont données", async () => {
    render(<NSIEntryScreen />)
    const radios = screen.getAllByRole('radio')
    // 9 items × 6 options — première option de chaque item
    for (let i = 0; i < 9; i++) {
      fireEvent.press(radios[i * 6])
    }
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      expect(database.saveNSIEntry).toHaveBeenCalledTimes(1)
      expect(mockGoBack).toHaveBeenCalled()
    })
  })

  it("sauvegarde avec un score numérique et 9 réponses", async () => {
    render(<NSIEntryScreen />)
    const radios = screen.getAllByRole('radio')
    // Dernière option (valeur 5) de chaque item
    for (let i = 0; i < 9; i++) {
      fireEvent.press(radios[i * 6 + 5])
    }
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      const calls = (database.saveNSIEntry as jest.Mock).mock.calls
      expect(calls).toHaveLength(1)
      const entry = calls[0][0]
      expect(typeof entry.score).toBe('number')
      expect(entry.score).toBe(45)
      expect(entry.answers).toHaveLength(9)
    })
  })

  it("sauvegarde le pourcentage récurrent si renseigné", async () => {
    render(<NSIEntryScreen />)
    const radios = screen.getAllByRole('radio')
    for (let i = 0; i < 9; i++) {
      fireEvent.press(radios[i * 6])
    }
    fireEvent.changeText(
      screen.getByLabelText('Pourcentage de cauchemars récurrents'),
      '60'
    )
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      const entry = (database.saveNSIEntry as jest.Mock).mock.calls[0][0]
      expect(entry.recurrent_pct).toBe(60)
    })
  })

  it("sauvegarde recurrent_pct à null si le champ est vide", async () => {
    render(<NSIEntryScreen />)
    const radios = screen.getAllByRole('radio')
    for (let i = 0; i < 9; i++) {
      fireEvent.press(radios[i * 6])
    }
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      const entry = (database.saveNSIEntry as jest.Mock).mock.calls[0][0]
      expect(entry.recurrent_pct).toBeNull()
    })
  })
})
