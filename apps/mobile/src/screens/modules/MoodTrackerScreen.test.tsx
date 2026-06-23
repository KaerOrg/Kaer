jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_m: string, k: string) => k, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert, ActivityIndicator } from 'react-native'
import MoodTrackerScreen from './MoodTrackerScreen'
import * as database from '../../lib/database'
import * as notificationService from '../../services/notificationService'
import type { ScaleEntry } from '../../lib/database'

jest.setTimeout(15000)

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: mockNavigate, setOptions: jest.fn() }),
    useFocusEffect: (cb: () => void) => {
      React.useEffect(() => cb(), [])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../components/features/TeenAccent', () => ({
  TeenAccent: () => null,
}))

jest.mock('@ui/Chart/TimeRangeCharts', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    DimensionChart: ({ label }: { label: string }) => React.createElement(Text, { testID: 'dimension-chart' }, label),
    CompositeChart: () => React.createElement(Text, { testID: 'composite-chart' }, 'composite'),
    MonthCalendar: () => React.createElement(Text, { testID: 'month-calendar' }, 'calendar'),
    buildChartData: () => [],
    buildCompositeData: () => [],
    buildXLabels: () => [],
    computeStreak: (entries: unknown[]) => entries.length > 0 ? 3 : 0,
    markerXFraction: () => 0.5,
  }
})

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key.split('.').pop() ?? key, i18n: { language: 'fr' } }),
}))

jest.mock('../../navigation/AppStack', () => ({}))

jest.mock('@theme', () => ({
  colors: {
    primary: '#000',
    background: '#fff',
    border: '#ccc',
    white: '#fff',
    textMuted: '#999',
    card: '#f5f5f5',
    text: '#111',
    neutral: '#f3f4f6',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, full: 999 },
  typography: { h2: {}, h3: {}, caption: {} },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: (sel: (s: { patient: { id: string } }) => unknown) => sel({ patient: { id: 'patient-1' } }),
}))

jest.mock('../../lib/database', () => ({
  getAllScaleEntries: jest.fn().mockResolvedValue([]),
  deleteScaleEntry: jest.fn().mockResolvedValue(undefined),
  getAllTimelineMarkers: jest.fn().mockResolvedValue([]),
  saveTimelineMarker: jest.fn().mockResolvedValue(undefined),
  deleteTimelineMarker: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../services/notificationService', () => ({
  getAllRoutinesForPatient: jest.fn().mockResolvedValue([]),
  updateTimeOverride: jest.fn().mockResolvedValue(true),
}))

jest.mock('../../services/moodMarkerService', () => ({
  saveMoodMarker: jest.fn().mockResolvedValue(undefined),
  deleteMoodMarker: jest.fn().mockResolvedValue(undefined),
  getAllMoodMarkers: jest.fn().mockResolvedValue([]),
}))

jest.mock('../../services/scaleEntryService', () => ({
  deleteScaleEntry: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../lib/dateUtils', () => ({
  formatDateLong: (d: string) => d,
}))

const mockGetAllScaleEntries = jest.mocked(database.getAllScaleEntries)
const mockGetAllRoutines = jest.mocked(notificationService.getAllRoutinesForPatient)

const makeMoodEntry = (
  id: string,
  date: string,
  overrides: Record<string, number> = {},
): ScaleEntry => ({
  id,
  scale_id: 'mood_tracker',
  answers: [7, 6, 4, 8, 7, 5],
  total_score: 6.17,
  subscale_scores: { mood: 7, energy: 6, anxiety: 4, pleasure: 8, sleep: 7, food: 5, ...overrides },
  created_at: date,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MoodTrackerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAllScaleEntries.mockResolvedValue([])
    mockGetAllRoutines.mockResolvedValue([])
  })

  it('affiche un indicateur de chargement pendant le fetch initial', () => {
    mockGetAllScaleEntries.mockReturnValue(new Promise(() => {}))
    render(<MoodTrackerScreen />)
    expect(screen.UNSAFE_queryAllByType(ActivityIndicator).length).toBeGreaterThan(0)
  })

  it('affiche les 3 onglets Saisie / Graphiques / Mois', async () => {
    render(<MoodTrackerScreen />)
    await waitFor(() => {
      expect(screen.getByText('tab_entry')).toBeTruthy()
      expect(screen.getByText('tab_charts')).toBeTruthy()
      expect(screen.getByText('tab_month')).toBeTruthy()
    })
  })

  it('affiche le bouton Nouvelle saisie dans l\'onglet Saisie', async () => {
    render(<MoodTrackerScreen />)
    await waitFor(() => {
      expect(screen.getByText('new_entry_btn')).toBeTruthy()
    })
  })

  it('navigue vers ScaleEntry quand Nouvelle saisie est pressé', async () => {
    render(<MoodTrackerScreen />)
    await waitFor(() => screen.getByText('new_entry_btn'))
    fireEvent.press(screen.getByText('new_entry_btn'))
    expect(mockNavigate).toHaveBeenCalledWith('ScaleEntry', { scale_id: 'mood_tracker' })
  })

  it('affiche l\'état vide quand aucune entrée', async () => {
    render(<MoodTrackerScreen />)
    await waitFor(() => {
      expect(screen.getByText('empty_title')).toBeTruthy()
    })
  })

  it('affiche les entrées avec chips de dimensions', async () => {
    mockGetAllScaleEntries.mockResolvedValue([
      makeMoodEntry('e1', '2025-05-30T10:00:00'),
    ])
    render(<MoodTrackerScreen />)
    await waitFor(() => {
      expect(screen.queryByText('empty_title')).toBeNull()
    })
  })

  it('affiche le badge streak quand des entrées existent', async () => {
    mockGetAllScaleEntries.mockResolvedValue([
      makeMoodEntry('e1', '2025-05-30T10:00:00'),
    ])
    render(<MoodTrackerScreen />)
    await waitFor(() => {
      expect(screen.getByText('streak_plural')).toBeTruthy()
    })
  })

  it('bascule vers l\'onglet Graphiques et affiche le compositeChart', async () => {
    mockGetAllScaleEntries.mockResolvedValue([
      makeMoodEntry('e1', '2025-05-30T10:00:00'),
    ])
    render(<MoodTrackerScreen />)
    await waitFor(() => screen.getByText('tab_charts'))
    fireEvent.press(screen.getByText('tab_charts'))
    await waitFor(() => {
      expect(screen.getByTestId('composite-chart')).toBeTruthy()
    })
  })

  it('affiche 6 DimensionChart dans l\'onglet Graphiques', async () => {
    mockGetAllScaleEntries.mockResolvedValue([
      makeMoodEntry('e1', '2025-05-30T10:00:00'),
    ])
    render(<MoodTrackerScreen />)
    await waitFor(() => screen.getByText('tab_charts'))
    fireEvent.press(screen.getByText('tab_charts'))
    await waitFor(() => {
      const charts = screen.getAllByTestId('dimension-chart')
      expect(charts.length).toBe(6)
    })
  })

  it('bascule vers l\'onglet Mois et affiche le calendrier', async () => {
    render(<MoodTrackerScreen />)
    await waitFor(() => screen.getByText('tab_month'))
    fireEvent.press(screen.getByText('tab_month'))
    await waitFor(() => {
      expect(screen.getByTestId('month-calendar')).toBeTruthy()
    })
  })

  it('affiche la section repères dans l\'onglet Évolution', async () => {
    mockGetAllScaleEntries.mockResolvedValue([
      makeMoodEntry('e1', '2025-05-30T10:00:00'),
    ])
    render(<MoodTrackerScreen />)
    await waitFor(() => screen.getByText('tab_charts'))
    fireEvent.press(screen.getByText('tab_charts'))
    await waitFor(() => {
      expect(screen.getByText('markers_title')).toBeTruthy()
      expect(screen.getByText('markers_add')).toBeTruthy()
    })
  })

  it('ouvre le modal d\'ajout de repère au clic sur Ajouter', async () => {
    mockGetAllScaleEntries.mockResolvedValue([
      makeMoodEntry('e1', '2025-05-30T10:00:00'),
    ])
    render(<MoodTrackerScreen />)
    await waitFor(() => screen.getByText('tab_charts'))
    fireEvent.press(screen.getByText('tab_charts'))
    await waitFor(() => screen.getByText('markers_add'))
    fireEvent.press(screen.getByText('markers_add'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('markers_placeholder')).toBeTruthy()
    })
  })

  it('affiche le message "aucun rappel" quand aucune routine active', async () => {
    mockGetAllRoutines.mockResolvedValue([])
    render(<MoodTrackerScreen />)
    await waitFor(() => {
      expect(screen.getByText('reminder_none')).toBeTruthy()
    })
  })

  it('affiche l\'heure du rappel quand une routine est active', async () => {
    mockGetAllRoutines.mockResolvedValue([{
      id: 'r1',
      patient_module_id: 'pm1',
      practitioner_id: 'prac1',
      patient_id: 'patient-1',
      days_of_week: [0, 1, 2, 3, 4],
      time_of_day: '08:00:00',
      patient_time_override: null,
      practitioner_note: null,
      is_active: true,
      patient_paused: false,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      module_type: 'mood_tracker',
    }])
    render(<MoodTrackerScreen />)
    await waitFor(() => {
      expect(screen.getByText('reminder_active')).toBeTruthy()
    })
  })

  it('ouvre la confirmation de suppression quand on presse l\'icône poubelle', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    mockGetAllScaleEntries.mockResolvedValue([
      makeMoodEntry('e1', '2025-05-30T10:00:00'),
    ])
    render(<MoodTrackerScreen />)
    await waitFor(() => screen.getByText('streak_plural'))
    const deleteButtons = screen.getAllByLabelText('delete')
    await act(async () => fireEvent.press(deleteButtons[0]))
    expect(alertSpy).toHaveBeenCalled()
  })
})

// ── Tests unitaires des fonctions chartUtils ───────────────────────────────────

interface FakeEntry {
  id: string
  scale_id: string
  answers: number[]
  total_score: number
  subscale_scores: Record<string, number> | null
  created_at: string
}

describe('chartUtils — buildCompositeData', () => {
  const { buildCompositeData } = jest.requireActual<typeof import('@ui/Chart/TimeRangeCharts/chartUtils')>(
    '@ui/Chart/TimeRangeCharts/chartUtils'
  )

  const makeEntry = (date: string, scores: Record<string, number>): FakeEntry => ({
    id: date,
    scale_id: 'mood_tracker',
    answers: [],
    total_score: 0,
    subscale_scores: scores,
    created_at: date,
  })

  it('retourne hasValue=false quand aucune entrée', () => {
    const result = buildCompositeData([], ['mood', 'energy'], '7J')
    expect(result.every(p => !p.hasValue)).toBe(true)
  })

  it('calcule la moyenne correcte sur les dimensions', () => {
    const today = new Date().toISOString().slice(0, 10)
    const entries = [makeEntry(`${today}T10:00:00`, { mood: 8, energy: 6 })]
    const result = buildCompositeData(entries, ['mood', 'energy'], '7J')
    const todayPoint = result[result.length - 1]
    expect(todayPoint.hasValue).toBe(true)
    expect(todayPoint.value).toBeCloseTo(7, 1)
  })

  it('ignore les dimensions sans valeur pour le calcul de la moyenne', () => {
    const today = new Date().toISOString().slice(0, 10)
    // sleep absent (ancienne entrée sans la dimension)
    const entries = [makeEntry(`${today}T10:00:00`, { mood: 6, energy: 8 })]
    const result = buildCompositeData(entries, ['mood', 'energy', 'sleep'], '7J')
    const todayPoint = result[result.length - 1]
    // sleep absent → moyenne sur 2 dims seulement
    expect(todayPoint.hasValue).toBe(true)
    expect(todayPoint.value).toBeCloseTo(7, 1)
  })
})

describe('chartUtils — computeStreak', () => {
  const { computeStreak } = jest.requireActual<typeof import('@ui/Chart/TimeRangeCharts/chartUtils')>(
    '@ui/Chart/TimeRangeCharts/chartUtils'
  )

  it('retourne 0 sans entrée', () => {
    expect(computeStreak([])).toBe(0)
  })

  it('compte les jours consécutifs depuis aujourd\'hui', () => {
    // Utilise le même calcul de date que computeStreak (minuit local → UTC)
    const getDateStr = (daysAgo: number) => {
      const d = new Date()
      d.setUTCHours(0, 0, 0, 0)
      d.setUTCDate(d.getUTCDate() - daysAgo)
      return d.toISOString().slice(0, 10)
    }
    const entries: FakeEntry[] = [0, 1].map(offset => ({
      id: String(offset),
      scale_id: 'mood_tracker',
      answers: [],
      total_score: 5,
      subscale_scores: null,
      created_at: getDateStr(offset) + 'T10:00:00.000Z',
    }))
    expect(computeStreak(entries)).toBe(2)
  })
})

describe('chartUtils — markerXFraction', () => {
  const { markerXFraction } = jest.requireActual<typeof import('@ui/Chart/TimeRangeCharts/chartUtils')>(
    '@ui/Chart/TimeRangeCharts/chartUtils'
  )

  const dateNDaysAgo = (n: number) => {
    const now = new Date()
    const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - n)
    return new Date(utc).toISOString().slice(0, 10)
  }

  it('place aujourd\'hui tout à droite (fraction = 1)', () => {
    expect(markerXFraction(dateNDaysAgo(0), '7J')).toBeCloseTo(1, 2)
  })

  it('place le premier jour de la fenêtre 7J tout à gauche (fraction = 0)', () => {
    expect(markerXFraction(dateNDaysAgo(6), '7J')).toBeCloseTo(0, 2)
  })

  it('place le milieu de la fenêtre vers 0.5', () => {
    expect(markerXFraction(dateNDaysAgo(3), '7J')).toBeCloseTo(0.5, 2)
  })

  it('retourne null pour une date hors fenêtre (trop ancienne)', () => {
    expect(markerXFraction(dateNDaysAgo(30), '7J')).toBeNull()
  })

  it('retourne null pour une date future', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    expect(markerXFraction(future.toISOString().slice(0, 10), '1M')).toBeNull()
  })

  it('positionne correctement sur la plage 1M', () => {
    expect(markerXFraction(dateNDaysAgo(0), '1M')).toBeCloseTo(1, 2)
    expect(markerXFraction(dateNDaysAgo(29), '1M')).toBeCloseTo(0, 2)
  })

  it('retourne null pour une date invalide', () => {
    expect(markerXFraction('pas-une-date', '7J')).toBeNull()
  })
})
