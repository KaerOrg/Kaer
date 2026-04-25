jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import RCADS25EntryScreen from './RCADS25EntryScreen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../lib/database', () => ({
  saveRCADS25Entry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-rcads-id'),
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('RCADS25EntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("n'affiche pas les labels de sous-échelles diagnostiques", () => {
    render(<RCADS25EntryScreen />)
    expect(screen.queryByText('Anxiété généralisée')).toBeNull()
    expect(screen.queryByText('Trouble panique')).toBeNull()
    expect(screen.queryByText('Dépression')).toBeNull()
    expect(screen.queryByText('TOC')).toBeNull()
  })

  it('affiche bien 25 questions numérotées', () => {
    render(<RCADS25EntryScreen />)
    expect(screen.getByText(/^1\./)).toBeTruthy()
    expect(screen.getByText(/^25\./)).toBeTruthy()
  })

  it('affiche le compteur de réponses à zéro au départ', () => {
    render(<RCADS25EntryScreen />)
    expect(screen.getByText('0 / 25 réponses')).toBeTruthy()
  })

  it('alerte quand on soumet un questionnaire incomplet', () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<RCADS25EntryScreen />)
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Questionnaire incomplet',
      expect.stringContaining('25')
    )
  })

  it('ne sauvegarde pas si le questionnaire est incomplet', () => {
    render(<RCADS25EntryScreen />)
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    expect(database.saveRCADS25Entry).not.toHaveBeenCalled()
  })

  it('met à jour le compteur en répondant à une question', () => {
    render(<RCADS25EntryScreen />)
    fireEvent.press(screen.getAllByText('Jamais')[0])
    expect(screen.getByText('1 / 25 réponses')).toBeTruthy()
  })

  it('sauvegarde avec les bons scores et navigue en arrière — toutes réponses "Jamais"', async () => {
    render(<RCADS25EntryScreen />)
    screen.getAllByText('Jamais').forEach(btn => fireEvent.press(btn))
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      expect(database.saveRCADS25Entry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-rcads-id',
          total_score: 0,
          subscale_scores: { tag: 0, tp: 0, ts: 0, ps: 0, toc: 0, td: 0 },
          answers: Array(25).fill(0),
        })
      )
      expect(mockGoBack).toHaveBeenCalled()
    })
  })

  it('calcule correctement le score total avec "Toujours" pour toutes les réponses', async () => {
    render(<RCADS25EntryScreen />)
    screen.getAllByText('Toujours').forEach(btn => fireEvent.press(btn))
    fireEvent.press(screen.getByText('Valider le questionnaire'))
    await waitFor(() => {
      expect(database.saveRCADS25Entry).toHaveBeenCalledWith(
        expect.objectContaining({
          total_score: 75,
          subscale_scores: { tag: 15, tp: 12, ts: 15, ps: 12, toc: 6, td: 15 },
        })
      )
    })
  })
})
