jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_m: string, k: string) => k, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MedicationSideEffectsHistoryScreen from './MedicationSideEffectsHistoryScreen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: mockNavigate, setOptions: jest.fn() }),
    useFocusEffect: (cb: () => void) => { React.useEffect(() => cb(), []) },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../components/features/TeenAccent', () => ({ TeenAccent: () => null }))

jest.mock('../../components/features/TimeRangeCharts', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    DimensionChart: ({ label }: { label: string }) => React.createElement(Text, { testID: 'dimension-chart' }, label),
    CompositeChart: () => React.createElement(Text, { testID: 'composite-chart' }, 'composite'),
    RangeSelector: () => null,
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

jest.mock('../../theme', () => ({
  colors: { primary: '#000', background: '#fff', border: '#ccc', white: '#fff', textMuted: '#999', card: '#f5f5f5', text: '#111' },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, full: 999 },
  typography: { h2: {}, h3: {}, caption: {} },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ patient: { id: 'patient-1' } }),
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

jest.mock('../../lib/dateUtils', () => ({ formatDateLong: (d: string) => d }))

const mockGetAllScaleEntries = jest.mocked(database.getAllScaleEntries)

const makeEntry = (id: string, date: string) => ({
  id,
  scale_id: 'medication_side_effects',
  answers: [2, 0, 1, 0, 3, 0, 1, 0, 0, 2, 1, 0],
  total_score: 1,
  subscale_scores: {
    sedation: 2, sleep: 0, akathisia: 1, tremors: 0, dry_mouth: 3, nausea: 0,
    constipation: 1, weight: 0, appetite_loss: 0, dizziness: 2, headache: 1, sexual: 0,
  },
  created_at: date,
})

describe('MedicationSideEffectsHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAllScaleEntries.mockResolvedValue([])
  })

  it('affiche les 3 onglets Saisie / Évolution / Vue d’ensemble', async () => {
    render(<MedicationSideEffectsHistoryScreen />)
    await waitFor(() => {
      expect(screen.getByText('tab_entry')).toBeTruthy()
      expect(screen.getByText('tab_charts')).toBeTruthy()
      expect(screen.getByText('tab_month')).toBeTruthy()
    })
  })

  it('navigue vers ScaleEntry avec le bon scale_id', async () => {
    render(<MedicationSideEffectsHistoryScreen />)
    await waitFor(() => screen.getByText('new_entry_btn'))
    fireEvent.press(screen.getByText('new_entry_btn'))
    expect(mockNavigate).toHaveBeenCalledWith('ScaleEntry', { scale_id: 'medication_side_effects' })
  })

  it('affiche une courbe pour chacun des 12 effets dans l’onglet Évolution', async () => {
    mockGetAllScaleEntries.mockResolvedValue([makeEntry('e1', '2026-05-30T10:00:00')])
    render(<MedicationSideEffectsHistoryScreen />)
    await waitFor(() => screen.getByText('tab_charts'))
    fireEvent.press(screen.getByText('tab_charts'))
    await waitFor(() => {
      expect(screen.getAllByTestId('dimension-chart').length).toBe(12)
    })
  })

  it('affiche la section repères (événements de traitement) dans l’onglet Évolution', async () => {
    mockGetAllScaleEntries.mockResolvedValue([makeEntry('e1', '2026-05-30T10:00:00')])
    render(<MedicationSideEffectsHistoryScreen />)
    await waitFor(() => screen.getByText('tab_charts'))
    fireEvent.press(screen.getByText('tab_charts'))
    await waitFor(() => {
      expect(screen.getByText('markers_title')).toBeTruthy()
      expect(screen.getByText('markers_add')).toBeTruthy()
    })
  })
})
