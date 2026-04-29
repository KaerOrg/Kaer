jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_mod: string, key: string) => key, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import EPDSScreen from './EPDSScreen'
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
  getAllEPDSEntries: jest.fn().mockResolvedValue([]),
  deleteEPDSEntry: jest.fn().mockResolvedValue(undefined),
}))

const ENTRY_FIXTURE = {
  id: 'epds-1',
  answers: [0, 0, 3, 0, 3, 3, 3, 3, 3, 3],
  score: 21,
  created_at: '2026-04-20T10:00:00.000Z',
}

describe('EPDSScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("affiche le bouton nouveau questionnaire apres chargement", async () => {
    ;(database.getAllEPDSEntries as jest.Mock).mockResolvedValueOnce([])
    render(<EPDSScreen />)
    await waitFor(() => {
      expect(screen.getByText('new_btn')).toBeTruthy()
    })
  })

  it("affiche l'etat vide quand il n'y a pas d'entrees", async () => {
    ;(database.getAllEPDSEntries as jest.Mock).mockResolvedValueOnce([])
    render(<EPDSScreen />)
    await waitFor(() => {
      expect(screen.getByText('empty_title')).toBeTruthy()
      expect(screen.getByText('empty_text')).toBeTruthy()
    })
  })

  it("affiche les entrees avec score et date", async () => {
    ;(database.getAllEPDSEntries as jest.Mock).mockResolvedValueOnce([ENTRY_FIXTURE])
    render(<EPDSScreen />)
    await waitFor(() => {
      expect(screen.getByText(/21/)).toBeTruthy()
      expect(screen.getByText(/30/)).toBeTruthy()
    })
  })

  it("navigue vers EPDSEntry au clic sur le bouton nouveau", async () => {
    ;(database.getAllEPDSEntries as jest.Mock).mockResolvedValueOnce([])
    render(<EPDSScreen />)
    await waitFor(() => screen.getByText('new_btn'))
    fireEvent.press(screen.getByText('new_btn'))
    expect(mockNavigate).toHaveBeenCalledWith('EPDSEntry', {})
  })

  it("appelle deleteEPDSEntry apres confirmation", async () => {
    ;(database.getAllEPDSEntries as jest.Mock).mockResolvedValueOnce([ENTRY_FIXTURE])
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (_title, _msg, buttons) => {
        const deleteBtn = buttons?.find(b => b.style === 'destructive')
        deleteBtn?.onPress?.()
      }
    )
    render(<EPDSScreen />)
    await waitFor(() => screen.getByLabelText('Supprimer'))
    fireEvent.press(screen.getByLabelText('Supprimer'))
    await waitFor(() => {
      expect(database.deleteEPDSEntry).toHaveBeenCalledWith('epds-1')
    })
    alertSpy.mockRestore()
  })

  it("retire l'entree de la liste localement apres suppression", async () => {
    ;(database.getAllEPDSEntries as jest.Mock).mockResolvedValueOnce([ENTRY_FIXTURE])
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (_title, _msg, buttons) => {
        const deleteBtn = buttons?.find(b => b.style === 'destructive')
        deleteBtn?.onPress?.()
      }
    )
    render(<EPDSScreen />)
    await waitFor(() => screen.getByText(/21/))
    fireEvent.press(screen.getByLabelText('Supprimer'))
    await waitFor(() => {
      expect(screen.queryByText(/^21$/)).toBeNull()
    })
    alertSpy.mockRestore()
  })
})
