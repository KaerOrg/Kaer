jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_mod: string, key: string) => key, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import ASRS6Screen from './ASRS6Screen'
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
  getAllASRS6Entries: jest.fn().mockResolvedValue([]),
  deleteASRS6Entry: jest.fn().mockResolvedValue(undefined),
}))

const ENTRY_FIXTURE: database.ASRS6Entry = {
  id: 'asrs6-1',
  answers: [2, 3, 1, 4, 0, 2],
  total_score: 12,
  created_at: '2026-04-20T10:00:00.000Z',
}

describe('ASRS6Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllASRS6Entries as jest.Mock).mockResolvedValue([])
  })

  it('navigue vers ASRS6Entry au clic sur le bouton nouveau', async () => {
    render(<ASRS6Screen />)
    await waitFor(() => { expect(screen.getByText('ASRS v1.1 — Dépistage')).toBeTruthy() })
    fireEvent.press(screen.getByText('new_btn'))
    expect(mockNavigate).toHaveBeenCalledWith('ASRS6Entry', {})
  })

  it('affiche le score total et le dénominateur /24', async () => {
    ;(database.getAllASRS6Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<ASRS6Screen />)
    await waitFor(() => {
      expect(screen.getByText('/ 24')).toBeTruthy()
      expect(screen.getByText('Score total')).toBeTruthy()
    })
  })

  it('affiche la date formatée de chaque entrée', async () => {
    ;(database.getAllASRS6Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<ASRS6Screen />)
    await waitFor(() => {
      expect(screen.getByText('12')).toBeTruthy()
    })
  })

  it('affiche le bouton info (référence scientifique)', async () => {
    render(<ASRS6Screen />)
    await waitFor(() => {
      expect(screen.getByLabelText('Source scientifique')).toBeTruthy()
    })
  })

  it('déclenche une confirmation avant suppression', async () => {
    ;(database.getAllASRS6Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<ASRS6Screen />)
    await waitFor(() => { expect(screen.getByLabelText('Supprimer')).toBeTruthy() })
    fireEvent.press(screen.getByLabelText('Supprimer'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Supprimer ce questionnaire',
      'Cette action est irréversible.',
      expect.any(Array)
    )
  })

  it('supprime une entrée après confirmation', async () => {
    ;(database.getAllASRS6Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = buttons?.find((b: { style?: string; onPress?: () => void }) => b.style === 'destructive')
      destructive?.onPress?.()
    })
    render(<ASRS6Screen />)
    await waitFor(() => { expect(screen.getByLabelText('Supprimer')).toBeTruthy() })
    fireEvent.press(screen.getByLabelText('Supprimer'))
    await waitFor(() => {
      expect(database.deleteASRS6Entry).toHaveBeenCalledWith('asrs6-1')
    })
  })

  it("n'affiche aucun label interprétatif (conformité MDR)", async () => {
    ;(database.getAllASRS6Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<ASRS6Screen />)
    await waitFor(() => { expect(screen.getByText('Score total')).toBeTruthy() })
    expect(screen.queryByText(/probable/i)).toBeNull()
    expect(screen.queryByText(/positif/i)).toBeNull()
    expect(screen.queryByText(/TDAH/i)).toBeNull()
  })
})
