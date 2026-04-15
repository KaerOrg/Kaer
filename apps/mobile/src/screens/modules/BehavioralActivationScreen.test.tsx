import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import BehavioralActivationScreen from './BehavioralActivationScreen'

// ─── Mocks ────────────────────────────────────────────────────────────────────

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

jest.mock('../../lib/database', () => ({
  getAllActivityRecords: jest.fn().mockResolvedValue([]),
  deleteActivityRecord: jest.fn().mockResolvedValue(undefined),
  saveActivityRecord: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { getAllActivityRecords, saveActivityRecord } =
  jest.requireMock('../../lib/database')

const MOCK_RECORD = {
  id: 'act-1',
  date: '2026-04-14',
  label: 'Marche 20 min',
  pleasure: 7,
  mastery: 6,
  done: 0,
  notes: null,
  created_at: '2026-04-14T10:00:00',
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BehavioralActivationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getAllActivityRecords.mockResolvedValue([])
  })

  it('affiche l\'état vide quand il n\'y a pas d\'activités', async () => {
    render(<BehavioralActivationScreen />)
    expect(await screen.findByText('Aucune activité')).toBeTruthy()
  })

  it('affiche le bouton d\'ajout (FAB)', async () => {
    render(<BehavioralActivationScreen />)
    await screen.findByText('Aucune activité')
    expect(screen.getByLabelText('Ajouter une activité')).toBeTruthy()
  })

  it('navigue vers BehavioralActivationEntry au tap sur le FAB', async () => {
    render(<BehavioralActivationScreen />)
    await screen.findByText('Aucune activité')
    fireEvent.press(screen.getByLabelText('Ajouter une activité'))
    expect(mockNavigate).toHaveBeenCalledWith('BehavioralActivationEntry', {})
  })

  it('affiche les activités quand il en existe', async () => {
    getAllActivityRecords.mockResolvedValue([MOCK_RECORD])
    render(<BehavioralActivationScreen />)
    expect(await screen.findByText('Marche 20 min')).toBeTruthy()
  })

  it('affiche les scores P et M pour chaque activité', async () => {
    getAllActivityRecords.mockResolvedValue([MOCK_RECORD])
    render(<BehavioralActivationScreen />)
    await screen.findByText('Marche 20 min')
    expect(screen.getByText('7')).toBeTruthy() // plaisir
    expect(screen.getByText('6')).toBeTruthy() // maîtrise
  })

  it('navigue vers l\'édition au tap sur le crayon', async () => {
    getAllActivityRecords.mockResolvedValue([MOCK_RECORD])
    render(<BehavioralActivationScreen />)
    await screen.findByText('Marche 20 min')
    fireEvent.press(screen.getByLabelText('Modifier'))
    expect(mockNavigate).toHaveBeenCalledWith('BehavioralActivationEntry', { recordId: 'act-1' })
  })

  it('bascule le statut "réalisée" au tap sur la checkbox', async () => {
    getAllActivityRecords.mockResolvedValue([MOCK_RECORD])
    render(<BehavioralActivationScreen />)
    await screen.findByText('Marche 20 min')
    fireEvent.press(screen.getByLabelText('Marquer comme réalisée'))
    await waitFor(() => {
      expect(saveActivityRecord).toHaveBeenCalledWith(
        expect.objectContaining({ done: 1 })
      )
    })
  })

  it('affiche la date en en-tête de groupe', async () => {
    getAllActivityRecords.mockResolvedValue([MOCK_RECORD])
    render(<BehavioralActivationScreen />)
    // "lundi 14 avril" doit apparaître
    expect(await screen.findByText(/14 avril/i)).toBeTruthy()
  })
})
