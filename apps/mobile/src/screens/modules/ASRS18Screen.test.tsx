jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_mod: string, key: string) => key, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import ASRS18Screen from './ASRS18Screen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: () => () => void) => {
      React.useEffect(() => { cb() }, [])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../components/TeenAccent', () => ({
  TeenAccent: () => null,
}))

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}))

jest.mock('../../lib/database', () => ({
  getAllASRS18Entries: jest.fn().mockResolvedValue([]),
  deleteASRS18Entry: jest.fn().mockResolvedValue(undefined),
}))

const ENTRY_FIXTURE: database.ASRS18Entry = {
  id: 'asrs18-1',
  answers: Array(18).fill(2),
  sub_scores: { part_a: 12, part_b: 24 },
  total_score: 36,
  created_at: '2026-04-20T10:00:00.000Z',
}

describe('ASRS18Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllASRS18Entries as jest.Mock).mockResolvedValue([])
  })

  it('navigue vers ASRS18Entry au clic sur le bouton nouveau', async () => {
    render(<ASRS18Screen />)
    await waitFor(() => { expect(screen.getByText('ASRS v1.1 — Bilan Complet')).toBeTruthy() })
    fireEvent.press(screen.getByText('new_btn'))
    expect(mockNavigate).toHaveBeenCalledWith('ASRS18Entry', {})
  })

  it('affiche le score total et le dénominateur /72', async () => {
    ;(database.getAllASRS18Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<ASRS18Screen />)
    await waitFor(() => {
      expect(screen.getByText('/ 72')).toBeTruthy()
      expect(screen.getByText('Score total')).toBeTruthy()
    })
  })

  it('affiche les chips Partie A et Partie B', async () => {
    ;(database.getAllASRS18Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<ASRS18Screen />)
    await waitFor(() => {
      expect(screen.getByText('Partie A')).toBeTruthy()
      expect(screen.getByText('Partie B')).toBeTruthy()
    })
  })

  it('affiche le dénominateur correct pour chaque partie', async () => {
    ;(database.getAllASRS18Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<ASRS18Screen />)
    await waitFor(() => {
      expect(screen.getByText('/24')).toBeTruthy()
      expect(screen.getByText('/48')).toBeTruthy()
    })
  })

  it('affiche le bouton info (référence scientifique)', async () => {
    render(<ASRS18Screen />)
    await waitFor(() => {
      expect(screen.getByLabelText('Source scientifique')).toBeTruthy()
    })
  })

  it('déclenche une confirmation avant suppression', async () => {
    ;(database.getAllASRS18Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<ASRS18Screen />)
    await waitFor(() => { expect(screen.getByLabelText('Supprimer')).toBeTruthy() })
    fireEvent.press(screen.getByLabelText('Supprimer'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Supprimer ce questionnaire',
      'Cette action est irréversible.',
      expect.any(Array)
    )
  })

  it('supprime une entrée après confirmation', async () => {
    ;(database.getAllASRS18Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = buttons?.find((b: { style?: string; onPress?: () => void }) => b.style === 'destructive')
      destructive?.onPress?.()
    })
    render(<ASRS18Screen />)
    await waitFor(() => { expect(screen.getByLabelText('Supprimer')).toBeTruthy() })
    fireEvent.press(screen.getByLabelText('Supprimer'))
    await waitFor(() => {
      expect(database.deleteASRS18Entry).toHaveBeenCalledWith('asrs18-1')
    })
  })

  it("n'affiche aucun label interprétatif (conformité MDR)", async () => {
    ;(database.getAllASRS18Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<ASRS18Screen />)
    await waitFor(() => { expect(screen.getByText('Score total')).toBeTruthy() })
    expect(screen.queryByText(/probable/i)).toBeNull()
    expect(screen.queryByText(/positif/i)).toBeNull()
    expect(screen.queryByText(/TDAH/i)).toBeNull()
  })
})
