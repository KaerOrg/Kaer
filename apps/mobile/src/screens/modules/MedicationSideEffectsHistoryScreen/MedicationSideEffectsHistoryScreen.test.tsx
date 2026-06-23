jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_m: string, k: string) => k, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MedicationSideEffectsHistoryScreen from './MedicationSideEffectsHistoryScreen'
import * as database from '../../../lib/database'
import * as configService from '../../../services/sideEffectsConfigService'

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

jest.mock('../../../components/features/TeenAccent', () => ({ TeenAccent: () => null }))

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

jest.mock('../../../navigation/AppStack', () => ({}))

jest.mock('@theme', () => ({
  colors: { primary: '#000', background: '#fff', border: '#ccc', white: '#fff', textMuted: '#999', card: '#f5f5f5', text: '#111' },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, full: 999 },
  typography: { h2: {}, h3: {}, caption: {} },
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ patient: { id: 'patient-1' } }),
}))

jest.mock('../../../lib/database', () => ({
  getAllScaleEntries: jest.fn().mockResolvedValue([]),
  deleteScaleEntry: jest.fn().mockResolvedValue(undefined),
  getAllTimelineMarkers: jest.fn().mockResolvedValue([]),
  saveTimelineMarker: jest.fn().mockResolvedValue(undefined),
  deleteTimelineMarker: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../services/notificationService', () => ({
  getAllRoutinesForPatient: jest.fn().mockResolvedValue([]),
  updateTimeOverride: jest.fn().mockResolvedValue(true),
}))

jest.mock('../../../services/sideEffectsConfigService', () => ({
  fetchTrackedEffects: jest.fn().mockResolvedValue([]),
  updateTrackedEffects: jest.fn().mockResolvedValue({ ok: true }),
}))

jest.mock('../../../lib/dateUtils', () => ({ formatDateLong: (d: string) => d }))

const mockFetchTracked = jest.mocked(configService.fetchTrackedEffects)
const mockGetEntries = jest.mocked(database.getAllScaleEntries)

describe('MedicationSideEffectsHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetEntries.mockResolvedValue([])
    mockFetchTracked.mockResolvedValue([])
  })

  it('affiche les 3 onglets', async () => {
    render(<MedicationSideEffectsHistoryScreen />)
    await waitFor(() => {
      expect(screen.getByText('tab_entry')).toBeTruthy()
      expect(screen.getByText('tab_charts')).toBeTruthy()
      expect(screen.getByText('tab_month')).toBeTruthy()
    })
  })

  it('affiche l’état « aucun effet configuré » + bouton Configurer quand la config est vide', async () => {
    mockFetchTracked.mockResolvedValue([])
    render(<MedicationSideEffectsHistoryScreen />)
    await waitFor(() => {
      expect(screen.getByText('config_empty_title')).toBeTruthy()
      expect(screen.getByText('config_button')).toBeTruthy()
    })
  })

  it('n’affiche que les effets configurés (sous-ensemble + perso)', async () => {
    mockFetchTracked.mockResolvedValue([
      { key: 'sedation' },
      { key: 'nausea' },
      { key: 'c_abc', custom: true, label: 'Bouffées de chaleur', color: '#F43F5E' },
    ])
    mockGetEntries.mockResolvedValue([{
      id: 'e1', scale_id: 'medication_side_effects', answers: [2, 0, 5],
      total_score: 2, subscale_scores: { sedation: 2, nausea: 0, c_abc: 5 }, created_at: '2026-05-30T10:00:00',
    }])
    render(<MedicationSideEffectsHistoryScreen />)
    await waitFor(() => screen.getByText('tab_charts'))
    fireEvent.press(screen.getByText('tab_charts'))
    await waitFor(() => {
      // 3 effets suivis = 3 courbes (pas les 12)
      expect(screen.getAllByTestId('dimension-chart').length).toBe(3)
    })
  })

  it('navigue vers la saisie dynamique avec les effets actifs', async () => {
    mockFetchTracked.mockResolvedValue([{ key: 'sedation' }, { key: 'nausea' }])
    render(<MedicationSideEffectsHistoryScreen />)
    await waitFor(() => screen.getByText('new_entry_btn'))
    fireEvent.press(screen.getByText('new_entry_btn'))
    expect(mockNavigate).toHaveBeenCalledWith(
      'MedicationSideEffectsEntry',
      expect.objectContaining({ effects: expect.arrayContaining([
        expect.objectContaining({ key: 'sedation' }),
        expect.objectContaining({ key: 'nausea' }),
      ]) })
    )
  })
})
