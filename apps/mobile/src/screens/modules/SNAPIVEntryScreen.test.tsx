jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import SNAPIVEntryScreen from './SNAPIVEntryScreen'
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
  saveSNAPIVEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-snap-id'),
}))

describe('SNAPIVEntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("n'affiche pas les labels diagnostiques des sous-échelles", () => {
    render(<SNAPIVEntryScreen />)
    // 'Inattention' est affiché comme séparateur de section (attendu) — on vérifie seulement l'absence des noms diagnostiques complets avec tiret
    expect(screen.queryByText('Hyperactivité-Impulsivité')).toBeNull()
    expect(screen.queryByText('Opposition-Défiance')).toBeNull()
  })

  it('affiche les séparateurs de section sans noms cliniques complets', () => {
    render(<SNAPIVEntryScreen />)
    // Les séparateurs utilisent des abréviations neutres (textTransform CSS ne change pas le texte lu par RNTL)
    expect(screen.getByText('Inattention')).toBeTruthy()
    expect(screen.getByText('Hyperactivité · Impulsivité')).toBeTruthy()
    expect(screen.getByText('Opposition · Défiance')).toBeTruthy()
  })

  it('affiche bien 26 questions numérotées', () => {
    render(<SNAPIVEntryScreen />)
    expect(screen.getByText(/^1\./)).toBeTruthy()
    expect(screen.getByText(/^26\./)).toBeTruthy()
  })

  it('affiche le compteur de réponses à zéro au départ', () => {
    render(<SNAPIVEntryScreen />)
    expect(screen.getByText('0 / 26 réponses')).toBeTruthy()
  })

  it('affiche la note hétéro-évaluation', () => {
    render(<SNAPIVEntryScreen />)
    expect(screen.getByText(/parent|tuteur|enseignant/i)).toBeTruthy()
  })

  it('alerte quand on soumet un questionnaire incomplet', () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<SNAPIVEntryScreen />)
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Questionnaire incomplet',
      expect.stringContaining('26')
    )
  })

  it('ne sauvegarde pas si le questionnaire est incomplet', () => {
    render(<SNAPIVEntryScreen />)
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    expect(database.saveSNAPIVEntry).not.toHaveBeenCalled()
  })

  it('met à jour le compteur en répondant à une question', () => {
    render(<SNAPIVEntryScreen />)
    fireEvent.press(screen.getAllByText('Pas du tout')[0])
    expect(screen.getByText('1 / 26 réponses')).toBeTruthy()
  })

  it('sauvegarde avec les bons scores — toutes réponses "Pas du tout"', async () => {
    render(<SNAPIVEntryScreen />)
    screen.getAllByText('Pas du tout').forEach(btn => fireEvent.press(btn))
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      expect(database.saveSNAPIVEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-snap-id',
          total_score: 0,
          subscale_scores: { inattention: 0, hyperactivite: 0, tod: 0 },
          answers: Array(26).fill(0),
        })
      )
      expect(mockGoBack).toHaveBeenCalled()
    })
  })

  it('calcule correctement le score total — toutes réponses "Beaucoup"', async () => {
    render(<SNAPIVEntryScreen />)
    screen.getAllByText('Beaucoup').forEach(btn => fireEvent.press(btn))
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      expect(database.saveSNAPIVEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          total_score: 78,
          subscale_scores: { inattention: 27, hyperactivite: 27, tod: 24 },
        })
      )
    })
  })
})
