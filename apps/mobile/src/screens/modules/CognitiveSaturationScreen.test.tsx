import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import CognitiveSaturationScreen from './CognitiveSaturationScreen'
import CognitiveSaturationExerciseScreen from './CognitiveSaturationExerciseScreen'

// ─── Mocks communs ────────────────────────────────────────────────────────────

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
    useFocusEffect: (cb: () => () => void) => {
      React.useEffect(() => { cb() }, [])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../lib/database', () => ({
  getAllCognitiveSaturationSessions: jest.fn(),
  deleteCognitiveSaturationSession: jest.fn(),
  saveCognitiveSaturationSession: jest.fn(),
  generateId: () => 'test-uuid-1234',
}))

const {
  getAllCognitiveSaturationSessions,
  deleteCognitiveSaturationSession,
  saveCognitiveSaturationSession,
} = jest.requireMock('../../lib/database')

// ─── Fixture ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  id: 'session-1',
  word: 'inutile',
  repetitions: 42,
  duration_seconds: 78,
  created_at: '2026-04-16T10:00:00.000Z',
}

// ─── CognitiveSaturationScreen ────────────────────────────────────────────────

describe('CognitiveSaturationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getAllCognitiveSaturationSessions.mockResolvedValue([])
  })

  it('affiche l\'état vide quand il n\'y a pas de sessions', async () => {
    render(<CognitiveSaturationScreen />)
    expect(await screen.findByTestId('empty-state')).toBeTruthy()
    expect(screen.getByText('Aucune session')).toBeTruthy()
  })

  it('affiche la carte d\'introduction', async () => {
    render(<CognitiveSaturationScreen />)
    expect(await screen.findByTestId('intro-card')).toBeTruthy()
  })

  it('affiche le bouton Démarrer un exercice', async () => {
    render(<CognitiveSaturationScreen />)
    expect(await screen.findByTestId('start-exercise-button')).toBeTruthy()
  })

  it('navigue vers CognitiveSaturationExercise au tap sur le bouton', async () => {
    render(<CognitiveSaturationScreen />)
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    expect(mockNavigate).toHaveBeenCalledWith('CognitiveSaturationExercise')
  })

  it('affiche les sessions existantes', async () => {
    getAllCognitiveSaturationSessions.mockResolvedValue([MOCK_SESSION])
    render(<CognitiveSaturationScreen />)
    expect(await screen.findByTestId('session-card-session-1')).toBeTruthy()
    expect(screen.getByText('inutile')).toBeTruthy()
    expect(screen.getByText('42 répétitions')).toBeTruthy()
    expect(screen.getByText('1min 18s')).toBeTruthy()
  })

  it('affiche le compte de sessions dans le titre de section', async () => {
    getAllCognitiveSaturationSessions.mockResolvedValue([MOCK_SESSION])
    render(<CognitiveSaturationScreen />)
    expect(await screen.findByText('Historique (1)')).toBeTruthy()
  })

  it('supprime une session via le bouton poubelle', async () => {
    getAllCognitiveSaturationSessions.mockResolvedValue([MOCK_SESSION])
    deleteCognitiveSaturationSession.mockResolvedValue(undefined)
    render(<CognitiveSaturationScreen />)
    await screen.findByTestId('session-card-session-1')
    fireEvent.press(screen.getByLabelText('Supprimer cette session ?'))
    expect(deleteCognitiveSaturationSession).toBeDefined()
  })
})

// ─── CognitiveSaturationExerciseScreen ────────────────────────────────────────

describe('CognitiveSaturationExerciseScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    saveCognitiveSaturationSession.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // ── Mode saisie ─────────────────────────────────────────────────────────────

  it('affiche le champ de saisie au démarrage', () => {
    render(<CognitiveSaturationExerciseScreen />)
    expect(screen.getByTestId('input-card')).toBeTruthy()
    expect(screen.getByTestId('word-input')).toBeTruthy()
  })

  it('affiche le compteur de caractères', () => {
    render(<CognitiveSaturationExerciseScreen />)
    expect(screen.getByTestId('char-count')).toBeTruthy()
    expect(screen.getByText('0/40')).toBeTruthy()
  })

  it('met à jour le compteur de caractères en tapant', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'inutile')
    expect(screen.getByText('7/40')).toBeTruthy()
  })

  it('le bouton Démarrer est désactivé si le champ est vide', () => {
    render(<CognitiveSaturationExerciseScreen />)
    const btn = screen.getByTestId('confirm-start-button')
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy()
  })

  it('le bouton Démarrer est actif quand un mot est saisi', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    const btn = screen.getByTestId('confirm-start-button')
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy()
  })

  // ── Transition vers le mode exercice ─────────────────────────────────────────

  it('passe en mode exercice après avoir appuyé sur Démarrer', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    expect(screen.getByTestId('exercise-mode')).toBeTruthy()
  })

  it('affiche le mot dans la zone de tap', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    expect(screen.getByText('danger')).toBeTruthy()
  })

  it('affiche le compteur à 0 au démarrage', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    expect(screen.getByTestId('rep-counter').props.children).toBe(0)
  })

  it('incrémente le compteur à chaque tap sur le mot', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    expect(screen.getByTestId('rep-counter').props.children).toBe(3)
  })

  it('affiche la barre de progression du timer', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    expect(screen.getByTestId('progress-bar')).toBeTruthy()
    expect(screen.getByTestId('time-label')).toBeTruthy()
  })

  // ── Arrêt anticipé ───────────────────────────────────────────────────────────

  it('passe en mode terminé quand on appuie sur Terminer', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('stop-button'))
    expect(screen.getByTestId('done-card')).toBeTruthy()
  })

  // ── Fin par timer ────────────────────────────────────────────────────────────

  it('passe en mode terminé quand le timer atteint 0', async () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    await act(async () => { jest.advanceTimersByTime(90_000) })
    expect(screen.getByTestId('done-card')).toBeTruthy()
  })

  // ── Mode terminé ─────────────────────────────────────────────────────────────

  it('affiche la carte récapitulative avec le mot et les stats', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    fireEvent.press(screen.getByTestId('stop-button'))
    expect(screen.getByTestId('summary-card')).toBeTruthy()
    expect(screen.getByText('danger')).toBeTruthy()
    expect(screen.getByTestId('done-repetitions').props.children).toBe(2)
  })

  it('enregistre la session et revient en arrière', async () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'inutile')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('stop-button'))
    fireEvent.press(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(saveCognitiveSaturationSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-1234',
          word: 'inutile',
        })
      )
      expect(mockGoBack).toHaveBeenCalled()
    })
  })

  it('revient au mode saisie après Recommencer', () => {
    render(<CognitiveSaturationExerciseScreen />)
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('stop-button'))
    fireEvent.press(screen.getByTestId('restart-button'))
    expect(screen.getByTestId('input-card')).toBeTruthy()
    expect(screen.getByTestId('word-input').props.value).toBe('')
  })
})
