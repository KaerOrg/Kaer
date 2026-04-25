jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_mod: string, key: string) => key, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import SNAPIVScreen from './SNAPIVScreen'
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
  getAllSNAPIVEntries: jest.fn().mockResolvedValue([]),
  deleteSNAPIVEntry: jest.fn().mockResolvedValue(undefined),
}))

const ENTRY_FIXTURE: database.SNAPIVEntry = {
  id: 'snap-1',
  answers: Array(26).fill(1),
  subscale_scores: { inattention: 9, hyperactivite: 9, tod: 8 },
  total_score: 26,
  created_at: '2026-04-20T10:00:00.000Z',
}

describe('SNAPIVScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllSNAPIVEntries as jest.Mock).mockResolvedValue([])
  })

  it('navigue vers SNAPIVEntry au clic sur le bouton nouveau', async () => {
    render(<SNAPIVScreen />)
    await waitFor(() => { expect(screen.getByText('SNAP-IV')).toBeTruthy() })
    fireEvent.press(screen.getByText('new_btn'))
    expect(mockNavigate).toHaveBeenCalledWith('SNAPIVEntry', {})
  })

  it('affiche le score total et le dénominateur /78', async () => {
    ;(database.getAllSNAPIVEntries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<SNAPIVScreen />)
    await waitFor(() => {
      expect(screen.getByText('/ 78')).toBeTruthy()
      expect(screen.getByText('Score total')).toBeTruthy()
    })
  })

  it('affiche les chips de sous-scores I, H/I et TOD', async () => {
    ;(database.getAllSNAPIVEntries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<SNAPIVScreen />)
    await waitFor(() => {
      expect(screen.getByText('I')).toBeTruthy()
      expect(screen.getByText('H/I')).toBeTruthy()
      expect(screen.getByText('TOD')).toBeTruthy()
    })
  })

  it("n'affiche pas les labels diagnostiques complets des sous-échelles", async () => {
    ;(database.getAllSNAPIVEntries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<SNAPIVScreen />)
    await waitFor(() => { expect(screen.getByText('Score total')).toBeTruthy() })
    expect(screen.queryByText('Inattention')).toBeNull()
    expect(screen.queryByText('Hyperactivité-Impulsivité')).toBeNull()
    expect(screen.queryByText('Opposition-Défiance')).toBeNull()
  })

  it('déclenche une confirmation avant suppression', async () => {
    ;(database.getAllSNAPIVEntries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<SNAPIVScreen />)
    await waitFor(() => { expect(screen.getByLabelText('Supprimer')).toBeTruthy() })
    fireEvent.press(screen.getByLabelText('Supprimer'))
    expect(alertSpy).toHaveBeenCalledWith(
      'Supprimer ce questionnaire',
      'Cette action est irréversible.',
      expect.any(Array)
    )
  })

  it('supprime une entrée après confirmation', async () => {
    ;(database.getAllSNAPIVEntries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = buttons?.find((b: { style?: string; onPress?: () => void }) => b.style === 'destructive')
      destructive?.onPress?.()
    })
    render(<SNAPIVScreen />)
    await waitFor(() => { expect(screen.getByLabelText('Supprimer')).toBeTruthy() })
    fireEvent.press(screen.getByLabelText('Supprimer'))
    await waitFor(() => {
      expect(database.deleteSNAPIVEntry).toHaveBeenCalledWith('snap-1')
    })
  })
})
