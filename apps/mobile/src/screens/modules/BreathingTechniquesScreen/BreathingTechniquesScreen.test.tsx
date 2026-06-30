jest.mock('../../../hooks/useTeen', () => ({
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

// Config des techniques telle que servie par la base (clés = i18n côté écran).
const TECHNIQUES = [
  { key: 'coherence_cardiaque', color: '#4F46E5', recommended_duration_min: 5, phases: [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }] },
  { key: 'diaphragmatique', color: '#059669', recommended_duration_min: 5, phases: [{ type: 'inhale', seconds: 4 }, { type: 'exhale', seconds: 7 }] },
  { key: 'carree', color: '#D97706', recommended_duration_min: 4, phases: [{ type: 'inhale', seconds: 4 }, { type: 'hold_in', seconds: 4 }, { type: 'exhale', seconds: 4 }, { type: 'hold_out', seconds: 4 }] },
  { key: 'quatre_sept_huit', color: '#9333EA', recommended_duration_min: 3, phases: [{ type: 'inhale', seconds: 4 }, { type: 'hold_in', seconds: 7 }, { type: 'exhale', seconds: 8 }] },
  { key: 'pleine_conscience', color: '#0EA5E9', recommended_duration_min: 10, phases: [{ type: 'inhale', seconds: 4 }, { type: 'hold_in', seconds: 1 }, { type: 'exhale', seconds: 6 }, { type: 'hold_out', seconds: 1 }] },
]

const mockFetchTechniques = jest.fn().mockResolvedValue(TECHNIQUES)
const mockFetchSessions = jest.fn().mockResolvedValue([])
jest.mock('@services/breathingService', () => ({
  fetchBreathingTechniques: () => mockFetchTechniques(),
  fetchBreathingSessions: () => mockFetchSessions(),
  getCycleDuration: (t: { phases: { seconds: number }[] }) => t.phases.reduce((a, p) => a + p.seconds, 0),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BreathingTechniquesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchTechniques.mockResolvedValue(TECHNIQUES)
    mockFetchSessions.mockResolvedValue([])
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
    mockFetchSessions.mockResolvedValue([
      { id: 's1', date: '2026-04-14', technique_key: 'coherence_cardiaque', duration_seconds: 300, created_at: '2026-04-14T10:00:00' },
      { id: 's2', date: '2026-04-13', technique_key: 'coherence_cardiaque', duration_seconds: 300, created_at: '2026-04-13T10:00:00' },
    ])
    render(<BreathingTechniquesScreen />)
    expect(await screen.findByText('2 sessions')).toBeTruthy()
  })

  it('affiche l\'historique récent si des sessions existent', async () => {
    mockFetchSessions.mockResolvedValue([
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
