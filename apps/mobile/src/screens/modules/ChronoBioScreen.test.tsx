jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ChronoBioScreen from './ChronoBioScreen'
import * as database from '../../lib/database'
import * as psyeduService from '../../services/psyeduService'

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

jest.mock('../../components/TeenAccent', () => ({
  TeenAccent: () => null,
}))

jest.mock('../../services/psyeduService', () => ({
  fetchTopicsByModule: jest.fn().mockResolvedValue([]),
}))

jest.mock('../../lib/database', () => ({
  listChronoEntries: jest.fn().mockResolvedValue([]),
}))

const TOPIC_FIXTURE = {
  id: 'topic-1',
  module_key: 'chronobiology_tracker',
  topic_key: 'what_is_chrono',
  icon_name: 'Clock',
  sort_order: 1,
  is_active: true,
}

const ENTRY_FIXTURE: database.ChronoEntry = {
  id: 'entry-1',
  date: new Date().toISOString().slice(0, 10),
  wake_time: '07:00',
  first_meal: '07:30',
  main_activity: null,
  last_meal: '19:00',
  bedtime: '23:00',
  created_at: new Date().toISOString(),
}

describe('ChronoBioScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([])
    ;(database.listChronoEntries as jest.Mock).mockResolvedValue([])
  })

  it('affiche les deux onglets Fiches et Journal', async () => {
    render(<ChronoBioScreen />)
    await waitFor(() => {
      expect(screen.getByText('Fiches')).toBeTruthy()
      expect(screen.getByText('Journal')).toBeTruthy()
    })
  })

  it('passe sur l\'onglet Journal au tap', async () => {
    render(<ChronoBioScreen />)
    await waitFor(() => { expect(screen.getByText('Journal')).toBeTruthy() })
    fireEvent.press(screen.getByText('Journal'))
    await waitFor(() => {
      expect(screen.getByText("Aujourd'hui")).toBeTruthy()
    })
  })

  it('affiche le bouton d\'ajout quand aucune entrée aujourd\'hui', async () => {
    ;(database.listChronoEntries as jest.Mock).mockResolvedValue([])
    render(<ChronoBioScreen />)
    fireEvent.press(screen.getByText('Journal'))
    await waitFor(() => {
      expect(screen.getByText('Saisir mes ancrages du jour')).toBeTruthy()
    })
  })

  it('navigue vers ChronoBioEntry au tap sur "ajouter aujourd\'hui"', async () => {
    ;(database.listChronoEntries as jest.Mock).mockResolvedValue([])
    render(<ChronoBioScreen />)
    fireEvent.press(screen.getByText('Journal'))
    await waitFor(() => { expect(screen.getByText('Saisir mes ancrages du jour')).toBeTruthy() })
    fireEvent.press(screen.getByText('Saisir mes ancrages du jour'))
    expect(mockNavigate).toHaveBeenCalledWith('ChronoBioEntry', expect.objectContaining({ date: expect.any(String) }))
  })

  it('affiche les chips d\'ancrage d\'une entrée existante (aujourd\'hui)', async () => {
    ;(database.listChronoEntries as jest.Mock).mockResolvedValue([ENTRY_FIXTURE])
    render(<ChronoBioScreen />)
    fireEvent.press(screen.getByText('Journal'))
    await waitFor(() => {
      expect(screen.getByText('07:00')).toBeTruthy()
      expect(screen.getByText('23:00')).toBeTruthy()
    })
  })

  it('affiche les topics psyedu dans l\'onglet Fiches', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([TOPIC_FIXTURE])
    render(<ChronoBioScreen />)
    await waitFor(() => {
      expect(psyeduService.fetchTopicsByModule).toHaveBeenCalledWith('chronobiology_tracker')
    })
  })

  it('navigue vers ChronoBioDetail au tap sur un topic', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([TOPIC_FIXTURE])
    render(<ChronoBioScreen />)
    await waitFor(() => {
      expect(psyeduService.fetchTopicsByModule).toHaveBeenCalledWith('chronobiology_tracker')
    })
  })

  it('affiche les jours passés sans saisie dans l\'historique', async () => {
    ;(database.listChronoEntries as jest.Mock).mockResolvedValue([])
    render(<ChronoBioScreen />)
    fireEvent.press(screen.getByText('Journal'))
    await waitFor(() => {
      expect(screen.getAllByText('Aucun ancrage').length).toBeGreaterThan(0)
    })
  })

  it('affiche le bouton vue mensuelle dans l\'onglet Journal', async () => {
    render(<ChronoBioScreen />)
    fireEvent.press(screen.getByText('Journal'))
    await waitFor(() => {
      expect(screen.getByText('Vue mensuelle')).toBeTruthy()
    })
  })

  it('navigue vers ChronoBioMonth au tap sur vue mensuelle', async () => {
    render(<ChronoBioScreen />)
    fireEvent.press(screen.getByText('Journal'))
    await waitFor(() => { expect(screen.getByText('Vue mensuelle')).toBeTruthy() })
    fireEvent.press(screen.getByText('Vue mensuelle'))
    expect(mockNavigate).toHaveBeenCalledWith('ChronoBioMonth')
  })
})
