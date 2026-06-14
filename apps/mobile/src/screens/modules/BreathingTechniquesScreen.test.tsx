jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import BreathingTechniquesScreen from './BreathingTechniquesScreen'

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
  getAllBreathingSessions: jest.fn().mockResolvedValue([]),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

const { getAllBreathingSessions } = jest.requireMock('../../lib/database')

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BreathingTechniquesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getAllBreathingSessions.mockResolvedValue([])
  })

  it('affiche les 5 techniques de respiration', async () => {
    render(<BreathingTechniquesScreen />)
    expect(await screen.findByText('Cohérence cardiaque')).toBeTruthy()
    expect(screen.getByText('Respiration diaphragmatique')).toBeTruthy()
    expect(screen.getByText('Respiration carrée')).toBeTruthy()
    expect(screen.getByText('Technique 4-7-8')).toBeTruthy()
    expect(screen.getByText('Pleine conscience respiratoire')).toBeTruthy()
  })

  it('affiche les sous-titres des techniques', async () => {
    render(<BreathingTechniquesScreen />)
    expect(await screen.findByText('6 respirations par minute')).toBeTruthy()
    expect(screen.getByText('Box Breathing, 4-4-4-4')).toBeTruthy()
  })

  it('affiche les niveaux de preuve', async () => {
    render(<BreathingTechniquesScreen />)
    expect(await screen.findByText(/Grade A/i)).toBeTruthy()
    expect(screen.getAllByText(/Grade B/i).length).toBeGreaterThanOrEqual(1)
  })

  it('navigue vers BreathingExercise au tap sur la cohérence cardiaque', async () => {
    render(<BreathingTechniquesScreen />)
    fireEvent.press(await screen.findByLabelText('Cohérence cardiaque'))
    expect(mockNavigate).toHaveBeenCalledWith('BreathingExercise', {
      techniqueKey: 'coherence_cardiaque',
    })
  })

  it('navigue vers BreathingExercise au tap sur la respiration carrée', async () => {
    render(<BreathingTechniquesScreen />)
    fireEvent.press(await screen.findByLabelText('Respiration carrée'))
    expect(mockNavigate).toHaveBeenCalledWith('BreathingExercise', {
      techniqueKey: 'carree',
    })
  })

  it('affiche le texte d\'introduction', async () => {
    render(<BreathingTechniquesScreen />)
    expect(await screen.findByText(/guide animé/i)).toBeTruthy()
  })

  it('affiche le nombre de sessions pour une technique déjà utilisée', async () => {
    getAllBreathingSessions.mockResolvedValue([
      { id: 's1', date: '2026-04-14', technique_key: 'coherence_cardiaque', duration_seconds: 300, created_at: '2026-04-14T10:00:00' },
      { id: 's2', date: '2026-04-13', technique_key: 'coherence_cardiaque', duration_seconds: 300, created_at: '2026-04-13T10:00:00' },
    ])
    render(<BreathingTechniquesScreen />)
    expect(await screen.findByText('2 sessions')).toBeTruthy()
  })

  it('affiche l\'historique récent si des sessions existent', async () => {
    getAllBreathingSessions.mockResolvedValue([
      { id: 's1', date: '2026-04-14', technique_key: 'carree', duration_seconds: 240, created_at: '2026-04-14T10:00:00' },
    ])
    render(<BreathingTechniquesScreen />)
    expect(await screen.findByText('Sessions récentes')).toBeTruthy()
    // "Respiration carrée" apparaît à la fois dans la carte technique et dans l'historique
    expect(screen.getAllByText('Respiration carrée').length).toBeGreaterThanOrEqual(2)
  })

  it('n\'affiche pas la section historique si aucune session', async () => {
    render(<BreathingTechniquesScreen />)
    await screen.findByText('Cohérence cardiaque')
    expect(screen.queryByText('Sessions récentes')).toBeNull()
  })
})
