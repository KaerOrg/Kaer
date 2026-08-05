import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { BreathingPacerLayout } from './BreathingPacerLayout'
import type { BreathingTechnique, BreathingSettings } from '@services/breathingService'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const TECHNIQUES: BreathingTechnique[] = [
  { key: 'coherence_cardiaque', color: '#4A9EA3', recommended_duration_min: 5, phases: [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }] },
  { key: 'diaphragmatique', color: '#5FAE9B', recommended_duration_min: 5, phases: [{ type: 'inhale', seconds: 4 }, { type: 'exhale', seconds: 7 }] },
  { key: 'carree', color: '#D97706', recommended_duration_min: 4, phases: [{ type: 'inhale', seconds: 4 }, { type: 'hold_in', seconds: 4 }, { type: 'exhale', seconds: 4 }, { type: 'hold_out', seconds: 4 }] },
]

const SETTINGS: BreathingSettings = {
  enabled_techniques: [], primary_technique: null, weekly_goal_sessions: 5,
  reminder_enabled: false, reminder_time: null, reminder_days: [],
  haptics: true, ambient_sound: false, ambient_sound_key: 'river',
  breath_sound: false, preferred_duration_min: 5,
}

const mockFetchSessions = jest.fn()
const mockFetchSettings = jest.fn()
const mockSaveSettings = jest.fn()

jest.mock('@services/breathingService', () => {
  const actual = jest.requireActual('@services/breathingService')
  return {
    ...actual,
    techniquesFromFields: () => TECHNIQUES,
    breathingConfigFromFields: () => ({
      defaultTechniqueKey: 'coherence_cardiaque',
      durationsMin: [2, 5, 10],
      ambientSounds: ['river', 'waves', 'rain', 'wind', 'bowl'],
    }),
    fetchBreathingSessions: () => mockFetchSessions(),
    fetchBreathingSettings: () => mockFetchSettings(),
    saveBreathingSettings: (...a: unknown[]) => mockSaveSettings(...a),
    saveBreathingSession: (...a: unknown[]) => mockSaveSession(...a),
  }
})

jest.mock('../../../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

// `ui/Sheet` lit les insets : sans provider dans l'arbre de test, le hook throw.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const mockReport = jest.fn()
jest.mock('@services/errorReportingService', () => ({
  reportFailedOperation: (...a: unknown[]) => mockReport(...a),
}))

// L'écran de session a son propre test : ici, un stub qui expose la technique active
// et permet de déclencher une fin de session depuis le layout.
let finishSession: ((result: unknown) => void) | null = null
jest.mock('./BreathingSessionScreen', () => ({
  BreathingSessionScreen: ({ technique, onFinish }: {
    technique: { key: string }
    onFinish: (result: unknown) => void
  }) => {
    const { Text } = require('react-native')
    finishSession = onFinish
    return <Text testID="player">{technique.key}</Text>
  },
}))

const mockSaveSession = jest.fn()

const session = (over: Partial<{ id: string; date: string; started_at: string; technique_key: string; duration_seconds: number }> = {}) => ({
  id: 's1', date: '2026-04-14', started_at: '2026-04-14T10:00:00', technique_key: 'coherence_cardiaque',
  duration_seconds: 300, planned_duration_seconds: 300, cycles_completed: 30,
  completed: true, feeling: null, created_at: '2026-04-14T10:05:00',
  ...over,
})

function renderHub() {
  return render(<BreathingPacerLayout fields={[]} moduleId="breathing_techniques" />)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BreathingPacerLayout : hub', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchSessions.mockResolvedValue([])
    mockFetchSettings.mockResolvedValue(SETTINGS)
    mockSaveSettings.mockResolvedValue(undefined)
    mockSaveSession.mockResolvedValue(undefined)
    finishSession = null
  })

  it('n’affiche rien tant que la config n’est pas lue (aucune écriture possible avant)', () => {
    renderHub()
    expect(screen.getByTestId('breathing-loader')).toBeTruthy()
    expect(screen.queryByTestId('breathing-week-card')).toBeNull()
  })

  it('met en tête la technique activée par le praticien', async () => {
    mockFetchSettings.mockResolvedValue({
      ...SETTINGS, enabled_techniques: ['diaphragmatique', 'carree'], primary_technique: 'diaphragmatique',
    })
    renderHub()
    expect(await screen.findByText('Respiration diaphragmatique')).toBeTruthy()
    expect(screen.getByTestId('breathing-primary-card')).toBeTruthy()
  })

  it('n’affiche aucune technique non activée, sous aucune forme', async () => {
    mockFetchSettings.mockResolvedValue({
      ...SETTINGS, enabled_techniques: ['coherence_cardiaque'], primary_technique: 'coherence_cardiaque',
    })
    renderHub()
    await screen.findByTestId('breathing-primary-card')
    expect(screen.queryByText('Respiration carrée')).toBeNull()
    expect(screen.queryByText('Respiration diaphragmatique')).toBeNull()
    expect(screen.queryByText('Vos techniques')).toBeNull()
  })

  it('retombe sur la technique par défaut quand le praticien n’a rien activé', async () => {
    renderHub()
    expect(await screen.findByText('Cohérence cardiaque')).toBeTruthy()
  })

  it('liste les autres techniques activées sous « Vos techniques »', async () => {
    mockFetchSettings.mockResolvedValue({
      ...SETTINGS, enabled_techniques: ['coherence_cardiaque', 'carree'], primary_technique: 'coherence_cardiaque',
    })
    renderHub()
    expect(await screen.findByText('Vos techniques')).toBeTruthy()
    expect(screen.getByTestId('breathing-technique-carree')).toBeTruthy()
  })

  it('affiche la durée proposée sur le bouton de démarrage', async () => {
    mockFetchSettings.mockResolvedValue({ ...SETTINGS, preferred_duration_min: 10 })
    renderHub()
    expect(await screen.findByText('Démarrer · 10 min')).toBeTruthy()
  })

  it('n’affiche aucune preuve scientifique sur les cartes', async () => {
    renderHub()
    await screen.findByTestId('breathing-primary-card')
    expect(screen.queryByText(/Lehrer & Gevirtz/)).toBeNull()
    expect(screen.queryByText(/Grade B/)).toBeNull()
  })

  it('déplace les preuves derrière « En savoir plus », repliées par défaut', async () => {
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-info-btn'))
    expect(await screen.findByTestId('breathing-info-sheet')).toBeTruthy()
    expect(screen.queryByTestId('breathing-info-sources')).toBeNull()
    fireEvent.press(screen.getByTestId('breathing-info-sources-toggle'))
    expect(screen.getByTestId('breathing-info-sources')).toBeTruthy()
  })

  it('ouvre la préparation, et non le lecteur, au démarrage de la technique de séance', async () => {
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-start-btn'))
    expect(await screen.findByTestId('breathing-prep-sheet')).toBeTruthy()
    expect(screen.queryByTestId('player')).toBeNull()
  })

  it('ouvre la préparation au tap sur une technique de la liste', async () => {
    mockFetchSettings.mockResolvedValue({
      ...SETTINGS, enabled_techniques: ['coherence_cardiaque', 'carree'], primary_technique: 'coherence_cardiaque',
    })
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-technique-carree'))
    expect(await screen.findByTestId('breathing-prep-sheet')).toBeTruthy()
  })

  it('lance le lecteur sur la technique préparée, une fois « Commencer » appuyé', async () => {
    mockFetchSettings.mockResolvedValue({
      ...SETTINGS, enabled_techniques: ['coherence_cardiaque', 'carree'], primary_technique: 'coherence_cardiaque',
    })
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-technique-carree'))
    fireEvent.press(await screen.findByTestId('breathing-prep-start'))
    expect((await screen.findByTestId('player')).props.children).toBe('carree')
  })

  it('mémorise les réglages de préparation pour la session suivante', async () => {
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-start-btn'))
    fireEvent.press(await screen.findByText('10 min'))
    fireEvent(screen.getByTestId('breathing-prep-breath-switch'), 'valueChange', true)
    fireEvent.press(screen.getByTestId('breathing-prep-start'))
    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ preferred_duration_min: 10, breath_sound: true }),
      )
    })
  })

  it('ne démarre rien quand la préparation est refermée', async () => {
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-start-btn'))
    fireEvent.press(await screen.findByTestId('breathing-prep-sheet-backdrop'))
    expect(screen.queryByTestId('player')).toBeNull()
    expect(mockSaveSettings).not.toHaveBeenCalled()
  })

  it('dérive les compteurs de la semaine des sessions enregistrées', async () => {
    const today = new Date()
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    mockFetchSessions.mockResolvedValue([
      session({ id: 'a', date: iso, started_at: `${iso}T08:00:00` }),
      session({ id: 'b', date: iso, started_at: `${iso}T19:00:00` }),
    ])
    renderHub()
    expect(await screen.findByText('2 / 5 sessions')).toBeTruthy()
    expect(screen.getByText('1 jour de suite')).toBeTruthy()
  })

  it('annonce l’absence de session tant que rien n’a été fait', async () => {
    renderHub()
    expect(await screen.findByText("Aucune session pour l'instant")).toBeTruthy()
  })

  it('enregistre le nouvel objectif hebdomadaire', async () => {
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-adjust-goal'))
    fireEvent.press(screen.getByTestId('breathing-goal-stepper-plus'))
    fireEvent.press(screen.getByTestId('breathing-goal-save'))
    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith(expect.objectContaining({ weekly_goal_sessions: 6 }))
    })
  })

  it('propose la création d’un rappel tant qu’aucun n’existe', async () => {
    renderHub()
    expect(await screen.findByText('Aucun rappel')).toBeTruthy()
    expect(screen.getByTestId('breathing-reminder-action').props.accessibilityLabel).toBe('Créer un rappel')
  })

  it('reflète le rappel enregistré dans la ligne du hub', async () => {
    mockFetchSettings.mockResolvedValue({
      ...SETTINGS, reminder_enabled: true, reminder_time: '21:00', reminder_days: [1, 3],
    })
    renderHub()
    expect(await screen.findByText('Rappel : L · Me à 21:00')).toBeTruthy()
  })

  it('enregistre le rappel réglé par le patient', async () => {
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-reminder-action'))
    fireEvent(screen.getByTestId('breathing-reminder-toggle-switch'), 'valueChange', true)
    fireEvent.press(screen.getByTestId('breathing-reminder-day-1'))
    fireEvent.press(screen.getByTestId('breathing-reminder-save'))
    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ reminder_enabled: true, reminder_days: [1] }),
      )
    })
  })

  it('propose un réessai plutôt qu’un formulaire quand les réglages sont illisibles', async () => {
    mockFetchSettings.mockRejectedValueOnce(new Error('sqlite down'))
    renderHub()
    expect(await screen.findByTestId('breathing-error')).toBeTruthy()
    // Aucune écriture n'est atteignable sur des réglages qu'on n'a pas lus.
    expect(screen.queryByTestId('breathing-adjust-goal')).toBeNull()
    expect(screen.queryByTestId('breathing-reminder-action')).toBeNull()
  })

  it('remonte l’échec de lecture des réglages à la télémétrie', async () => {
    mockFetchSettings.mockRejectedValueOnce(new Error('sqlite down'))
    renderHub()
    await screen.findByTestId('breathing-error')
    expect(mockReport).toHaveBeenCalledWith(
      'module/breathing_techniques/hub', 'breathing settings unreadable', 'sqlite down',
    )
  })

  it('recharge les réglages au réessai', async () => {
    mockFetchSettings.mockRejectedValueOnce(new Error('sqlite down'))
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-retry'))
    expect(await screen.findByTestId('breathing-week-card')).toBeTruthy()
  })

  it('remonte un échec d’écriture des réglages (jamais avalé)', async () => {
    mockSaveSettings.mockRejectedValueOnce(new Error('disk full'))
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-adjust-goal'))
    fireEvent.press(screen.getByTestId('breathing-goal-save'))
    await waitFor(() => {
      expect(mockReport).toHaveBeenCalledWith(
        'module/breathing_techniques/hub', 'breathing settings write failed', 'disk full',
      )
    })
  })

  it('enregistre la session remontée par l’écran, interruption comprise', async () => {
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-start-btn'))
    fireEvent.press(await screen.findByTestId('breathing-prep-start'))
    await screen.findByTestId('player')

    act(() => {
      finishSession?.({
        techniqueKey: 'coherence_cardiaque',
        startedAt: '2026-08-05T10:00:00.000Z',
        durationSeconds: 42,
        plannedDurationSeconds: 300,
        cyclesCompleted: 4,
        completed: false,
      })
    })

    await waitFor(() => {
      expect(mockSaveSession).toHaveBeenCalledWith(expect.objectContaining({
        technique_key: 'coherence_cardiaque',
        started_at: '2026-08-05T10:00:00.000Z',
        duration_seconds: 42,
        planned_duration_seconds: 300,
        cycles_completed: 4,
        completed: false,
      }))
    })
    expect(screen.queryByTestId('player')).toBeNull()
  })

  it('remonte un échec d’enregistrement de session (jamais avalé)', async () => {
    mockSaveSession.mockRejectedValueOnce(new Error('disk full'))
    renderHub()
    fireEvent.press(await screen.findByTestId('breathing-start-btn'))
    fireEvent.press(await screen.findByTestId('breathing-prep-start'))
    await screen.findByTestId('player')

    act(() => {
      finishSession?.({
        techniqueKey: 'coherence_cardiaque', startedAt: '2026-08-05T10:00:00.000Z',
        durationSeconds: 42, plannedDurationSeconds: 300, cyclesCompleted: 4, completed: false,
      })
    })

    await waitFor(() => {
      expect(mockReport).toHaveBeenCalledWith(
        'module/breathing_techniques/session', 'breathing session write failed', 'disk full',
      )
    })
  })

  it('n’affiche aucun message de félicitation ni jugement (MDR)', async () => {
    mockFetchSessions.mockResolvedValue([session()])
    renderHub()
    await screen.findByTestId('breathing-week-card')
    expect(screen.queryByText(/bravo|félicitation|excellent|bien jou/i)).toBeNull()
  })
})
