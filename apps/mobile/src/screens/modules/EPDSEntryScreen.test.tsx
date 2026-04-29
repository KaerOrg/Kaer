jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import EPDSEntryScreen from './EPDSEntryScreen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../lib/database', () => ({
  saveEPDSEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id'),
}))

describe('EPDSEntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("affiche les 10 questions", () => {
    render(<EPDSEntryScreen />)
    expect(screen.getByText(/1\./)).toBeTruthy()
    expect(screen.getByText(/10\./)).toBeTruthy()
  })

  it("affiche la consigne de periode", () => {
    render(<EPDSEntryScreen />)
    expect(screen.getByText(/Pendant la semaine qui vient de s/)).toBeTruthy()
  })

  it("affiche le compteur 0 sur 10 au depart", () => {
    render(<EPDSEntryScreen />)
    expect(screen.getByText('0 / 10 réponses')).toBeTruthy()
  })

  it("incremente le compteur apres selection d'une option", () => {
    render(<EPDSEntryScreen />)
    const firstOption = screen.getAllByRole('radio')[0]
    fireEvent.press(firstOption)
    expect(screen.getByText('1 / 10 réponses')).toBeTruthy()
  })

  it("affiche une alerte si on valide avec des reponses manquantes", () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<EPDSEntryScreen />)
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Questionnaire incomplet',
      expect.stringContaining('10 questions')
    )
    alertSpy.mockRestore()
  })

  it("sauvegarde et ferme l'ecran quand toutes les reponses sont donnees", async () => {
    render(<EPDSEntryScreen />)
    const radios = screen.getAllByRole('radio')
    // 10 items x 4 options = 40 radios — premier de chaque groupe
    for (let i = 0; i < 10; i++) {
      fireEvent.press(radios[i * 4])
    }
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      expect(database.saveEPDSEntry).toHaveBeenCalledTimes(1)
      expect(mockGoBack).toHaveBeenCalled()
    })
  })

  it("sauvegarde avec un score numerique et 10 reponses", async () => {
    render(<EPDSEntryScreen />)
    const radios = screen.getAllByRole('radio')
    // 4e choix de chaque item
    for (let i = 0; i < 10; i++) {
      fireEvent.press(radios[i * 4 + 3])
    }
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      const calls = (database.saveEPDSEntry as jest.Mock).mock.calls
      expect(calls).toHaveLength(1)
      const entry = calls[0][0]
      expect(typeof entry.score).toBe('number')
      expect(entry.answers).toHaveLength(10)
    })
  })
})
