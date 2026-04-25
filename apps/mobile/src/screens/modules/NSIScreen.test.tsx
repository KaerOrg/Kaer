jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_mod, key) => key, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import NSIScreen from './NSIScreen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb) => {
      React.useEffect(() => { cb() }, [])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../components/TeenAccent', () => ({
  TeenAccent: () => null,
}))

jest.mock('../../lib/database', () => ({
  getAllNSIEntries: jest.fn().mockResolvedValue([]),
  deleteNSIEntry: jest.fn().mockResolvedValue(undefined),
}))

const ENTRY_FIXTURE = {
  id: 'nsi-1',
  answers: [5, 4, 3, 4, 3, 2, 3, 4, 4],
  score: 32,
  recurrent_pct: 70,
  themes: ['Chute', 'Agression'],
  created_at: '2026-04-20T10:00:00.000Z',
}

describe('NSIScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("affiche le bouton nouveau questionnaire après chargement", async () => {
    ;(database.getAllNSIEntries as jest.Mock).mockResolvedValueOnce([])
    render(<NSIScreen />)
    await waitFor(() => {
      expect(screen.getByText('new_btn')).toBeTruthy()
    })
  })

  it("affiche l'état vide quand il n'y a pas d'entrées", async () => {
    ;(database.getAllNSIEntries as jest.Mock).mockResolvedValueOnce([])
    render(<NSIScreen />)
    await waitFor(() => {
      expect(screen.getByText('empty_title')).toBeTruthy()
      expect(screen.getByText('empty_text')).toBeTruthy()
    })
  })

  it("affiche les entrées avec score et /45", async () => {
    ;(database.getAllNSIEntries as jest.Mock).mockResolvedValueOnce([ENTRY_FIXTURE])
    render(<NSIScreen />)
    await waitFor(() => {
      expect(screen.getByText(/32/)).toBeTruthy()
      expect(screen.getByText(/45/)).toBeTruthy()
    })
  })

  it("affiche le pourcentage récurrent quand renseigné", async () => {
    ;(database.getAllNSIEntries as jest.Mock).mockResolvedValueOnce([ENTRY_FIXTURE])
    render(<NSIScreen />)
    await waitFor(() => {
      expect(screen.getByText(/70.*récurrents/)).toBeTruthy()
    })
  })

  it("navigue vers NSIEntry au clic sur le bouton nouveau", async () => {
    ;(database.getAllNSIEntries as jest.Mock).mockResolvedValueOnce([])
    render(<NSIScreen />)
    await waitFor(() => screen.getByText('new_btn'))
    fireEvent.press(screen.getByText('new_btn'))
    expect(mockNavigate).toHaveBeenCalledWith('NSIEntry', {})
  })

  it("appelle deleteNSIEntry après confirmation", async () => {
    ;(database.getAllNSIEntries as jest.Mock).mockResolvedValueOnce([ENTRY_FIXTURE])
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (_title, _msg, buttons) => {
        const deleteBtn = buttons?.find(b => b.style === 'destructive')
        deleteBtn?.onPress?.()
      }
    )
    render(<NSIScreen />)
    await waitFor(() => screen.getByLabelText('Supprimer'))
    fireEvent.press(screen.getByLabelText('Supprimer'))
    await waitFor(() => {
      expect(database.deleteNSIEntry).toHaveBeenCalledWith('nsi-1')
    })
    alertSpy.mockRestore()
  })

  it("retire l'entrée de la liste localement après suppression", async () => {
    ;(database.getAllNSIEntries as jest.Mock).mockResolvedValueOnce([ENTRY_FIXTURE])
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (_title, _msg, buttons) => {
        const deleteBtn = buttons?.find(b => b.style === 'destructive')
        deleteBtn?.onPress?.()
      }
    )
    render(<NSIScreen />)
    await waitFor(() => screen.getByText(/32/))
    fireEvent.press(screen.getByLabelText('Supprimer'))
    await waitFor(() => {
      expect(screen.queryByText(/^32$/)).toBeNull()
    })
    alertSpy.mockRestore()
  })
})
