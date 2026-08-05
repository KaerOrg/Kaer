import React from 'react'
import { AppState, Vibration } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { BreathingSessionScreen } from './BreathingSessionScreen'
import type { BreathingSettings, BreathingTechnique } from '@services/breathingService'

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native')
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: View,
  }
})

const COHERENCE: BreathingTechnique = {
  key: 'coherence_cardiaque', color: '#4A9EA3', recommended_duration_min: 5,
  phases: [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }],
}
const CARREE: BreathingTechnique = {
  key: 'carree', color: '#D97706', recommended_duration_min: 4,
  phases: [
    { type: 'inhale', seconds: 4 }, { type: 'hold_in', seconds: 4 },
    { type: 'exhale', seconds: 4 }, { type: 'hold_out', seconds: 4 },
  ],
}

const SETTINGS: BreathingSettings = {
  enabled_techniques: [], primary_technique: null, weekly_goal_sessions: 5,
  reminder_enabled: false, reminder_time: null, reminder_days: [],
  haptics: true, ambient_sound: false, ambient_sound_key: 'river',
  breath_sound: false, preferred_duration_min: 5,
}

const lbl = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key

/**
 * Fait avancer le temps. Les faux timers « modernes » avancent aussi `Date.now()` :
 * la session lit l'horloge murale, elle suit donc sans qu'on la pousse à part.
 */
function advance(ms: number) {
  act(() => { jest.advanceTimersByTime(ms) })
}

/**
 * Dernier arbre rendu, démonté par le `afterEach` de ce fichier.
 *
 * Le nettoyage automatique de `@testing-library/react-native` est enregistré à
 * l'import, donc AU NIVEAU RACINE : il s'exécute après les hooks de ce `describe`.
 * Or une phase de rétention lance une `Animated.loop` infinie ; laissée en vie, elle
 * garde la file de timers occupée et ce nettoyage n'aboutit jamais (« Exceeded
 * timeout for a hook »). On démonte donc nous-mêmes, pendant que les faux timers
 * sont encore en place, pour que l'effet de l'orbe arrête sa boucle.
 */
let tree: ReturnType<typeof render> | null = null

function renderSession(over: Partial<React.ComponentProps<typeof BreathingSessionScreen>> = {}) {
  const props = {
    technique: COHERENCE,
    settings: SETTINGS,
    lbl,
    stopRequested: false,
    onFinish: jest.fn(),
    ...over,
  }
  tree = render(<BreathingSessionScreen {...props} />)
  return { ...tree, props }
}

describe('BreathingSessionScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-08-05T10:00:00Z'))
  })
  afterEach(() => {
    act(() => { tree?.unmount() })
    tree = null
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('démarre sur la première phase, décompte complet', () => {
    const { getByTestId } = renderSession()
    expect(getByTestId('session-phase').props.children).toBe('phase_inhale')
    expect(getByTestId('session-countdown').props.children).toBe(5)
  })

  it('déroule les phases au fil du temps réellement écoulé', () => {
    const { getByTestId } = renderSession()
    advance(6_000)
    expect(getByTestId('session-phase').props.children).toBe('phase_exhale')
  })

  it('sert une technique à quatre phases, rétentions comprises', () => {
    const { getByTestId } = renderSession({ technique: CARREE })
    advance(5_000)
    expect(getByTestId('session-phase').props.children).toBe('phase_hold_in')
    advance(4_000)
    expect(getByTestId('session-phase').props.children).toBe('phase_exhale')
    advance(4_000)
    expect(getByTestId('session-phase').props.children).toBe('phase_hold_out')
  })

  it('affiche le temps restant sur la durée choisie', () => {
    const { getByTestId } = renderSession()
    advance(60_000)
    expect(getByTestId('session-remaining').props.children).toBe('4:00')
  })

  it('vibre à chaque changement de phase quand la bascule est active', () => {
    const vibrate = jest.spyOn(Vibration, 'vibrate')
    renderSession()
    const atStart = vibrate.mock.calls.length
    advance(6_000)
    expect(vibrate.mock.calls.length).toBeGreaterThan(atStart)
  })

  it('ne vibre pas quand la bascule est coupée', () => {
    const vibrate = jest.spyOn(Vibration, 'vibrate')
    renderSession({ settings: { ...SETTINGS, haptics: false } })
    advance(6_000)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('termine automatiquement à la durée choisie, session menée au bout', () => {
    const { props } = renderSession({ settings: { ...SETTINGS, preferred_duration_min: 1 } })
    advance(60_500)
    expect(props.onFinish).toHaveBeenCalledWith(
      expect.objectContaining({
        techniqueKey: 'coherence_cardiaque', plannedDurationSeconds: 60, completed: true,
      }),
    )
  })

  it('enregistre une session interrompue tôt avec completed = false', () => {
    const { getByTestId, props } = renderSession()
    advance(30_000)
    fireEvent.press(getByTestId('session-stop'))
    expect(props.onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 30, completed: false }),
    )
  })

  it('marque menée au bout une session arrêtée après la moitié de la durée', () => {
    const { getByTestId, props } = renderSession()
    advance(200_000)
    fireEvent.press(getByTestId('session-stop'))
    expect(props.onFinish).toHaveBeenCalledWith(expect.objectContaining({ completed: true }))
  })

  it('remonte le nombre de cycles menés au bout', () => {
    const { getByTestId, props } = renderSession()
    advance(35_000)
    fireEvent.press(getByTestId('session-stop'))
    expect(props.onFinish).toHaveBeenCalledWith(expect.objectContaining({ cyclesCompleted: 3 }))
  })

  it('ne conclut qu’une fois, même sur plusieurs arrêts', () => {
    const { getByTestId, props } = renderSession()
    advance(10_000)
    fireEvent.press(getByTestId('session-stop'))
    fireEvent.press(getByTestId('session-stop'))
    expect(props.onFinish).toHaveBeenCalledTimes(1)
  })

  it('fige le temps pendant la pause', () => {
    const { getByTestId, props } = renderSession()
    advance(20_000)
    fireEvent.press(getByTestId('session-pause'))
    advance(60_000)
    fireEvent.press(getByTestId('session-stop'))
    expect(props.onFinish).toHaveBeenCalledWith(expect.objectContaining({ durationSeconds: 20 }))
  })

  it('reprend là où on en était après une pause', () => {
    const { getByTestId } = renderSession()
    advance(20_000)
    fireEvent.press(getByTestId('session-pause'))
    advance(60_000)
    fireEvent.press(getByTestId('session-pause'))
    advance(10_000)
    expect(getByTestId('session-remaining').props.children).toBe('4:30')
  })

  it('met en pause quand l’app passe en fond, sans compter ce temps', () => {
    const listeners: Array<(state: string) => void> = []
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      listeners.push(handler as (state: string) => void)
      return { remove: jest.fn() } as never
    })
    const { getByTestId, props } = renderSession()
    advance(15_000)
    act(() => listeners.forEach(fn => fn('background')))
    advance(120_000)
    fireEvent.press(getByTestId('session-stop'))
    expect(props.onFinish).toHaveBeenCalledWith(expect.objectContaining({ durationSeconds: 15 }))
  })

  it('termine la session sur une demande d’arrêt externe (retour Android)', () => {
    const { rerender, props } = renderSession()
    advance(10_000)
    rerender(
      <BreathingSessionScreen
        technique={COHERENCE} settings={SETTINGS} lbl={lbl} stopRequested onFinish={props.onFinish} />,
    )
    expect(props.onFinish).toHaveBeenCalledWith(expect.objectContaining({ durationSeconds: 10 }))
  })

  it('masque le bouton son tant qu’aucun accompagnement sonore n’existe', () => {
    const { queryByTestId } = renderSession({ settings: { ...SETTINGS, ambient_sound: true } })
    expect(queryByTestId('session-sound')).toBeNull()
  })

  it('n’affiche la mention de vibration que si la bascule est active', () => {
    const on = renderSession()
    expect(on.queryByText('session_haptic_hint')).toBeTruthy()
    on.unmount()
    const off = renderSession({ settings: { ...SETTINGS, haptics: false } })
    expect(off.queryByText('session_haptic_hint')).toBeNull()
  })

  it('affiche le cycle en cours et le nom de la technique', () => {
    const { getByText } = renderSession()
    expect(getByText('session_cycle:1,coherence_cardiaque_name')).toBeTruthy()
  })
})
