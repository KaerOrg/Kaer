jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_mod: string, key: string) => key, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import RCADS25Screen from './RCADS25Screen'
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

jest.mock('../../lib/database', () => ({
  getAllRCADS25Entries: jest.fn().mockResolvedValue([]),
  deleteRCADS25Entry: jest.fn().mockResolvedValue(undefined),
}))

const ENTRY_FIXTURE: database.RCADS25Entry = {
  id: 'rcads-1',
  answers: Array(25).fill(1),
  subscale_scores: { tag: 5, tp: 4, ts: 5, ps: 4, toc: 2, td: 5 },
  total_score: 25,
  created_at: '2026-04-20T10:00:00.000Z',
}

describe('RCADS25Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllRCADS25Entries as jest.Mock).mockResolvedValue([])
  })

  it('navigue vers RCADS25Entry au clic sur le bouton nouveau', async () => {
    render(<RCADS25Screen />)
    await waitFor(() => { expect(screen.getByText('RCADS-25')).toBeTruthy() })
    fireEvent.press(screen.getByText('new_btn'))
    expect(mockNavigate).toHaveBeenCalledWith('RCADS25Entry', {})
  })

  it('affiche le score total et le dénominateur /75', async () => {
    ;(database.getAllRCADS25Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<RCADS25Screen />)
    await waitFor(() => {
      expect(screen.getByText('/ 75')).toBeTruthy()
      expect(screen.getByText('Score total')).toBeTruthy()
    })
  })

  it("n'affiche pas les labels de sous-échelles diagnostiques", async () => {
    ;(database.getAllRCADS25Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<RCADS25Screen />)
    await waitFor(() => { expect(screen.getByText('Score total')).toBeTruthy() })
    expect(screen.queryByText('Anxiété généralisée')).toBeNull()
    expect(screen.queryByText('Trouble panique')).toBeNull()
    expect(screen.queryByText('Dépression')).toBeNull()
  })

  it('déclenche une confirmation avant suppression', async () => {
    ;(database.getAllRCADS25Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<RCADS25Screen />)
    await waitFor(() => { expect(screen.getByLabelText('Supprimer')).toBeTruthy() })
    fireEvent.press(screen.getByLabelText('Supprimer'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Supprimer ce questionnaire',
      'Cette action est irréversible.',
      expect.any(Array)
    )
  })

  it('supprime une entrée après confirmation', async () => {
    ;(database.getAllRCADS25Entries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = buttons?.find((b: { style?: string; onPress?: () => void }) => b.style === 'destructive')
      destructive?.onPress?.()
    })
    render(<RCADS25Screen />)
    await waitFor(() => { expect(screen.getByLabelText('Supprimer')).toBeTruthy() })
    fireEvent.press(screen.getByLabelText('Supprimer'))
    await waitFor(() => {
      expect(database.deleteRCADS25Entry).toHaveBeenCalledWith('rcads-1')
    })
  })
})
