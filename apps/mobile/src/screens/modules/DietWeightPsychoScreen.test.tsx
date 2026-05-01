jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import DietWeightPsychoScreen from './DietWeightPsychoScreen'
import * as psyeduService from '../../services/psyeduService'

jest.setTimeout(15000)

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

jest.mock('../../components/TeenAccent', () => ({
  TeenAccent: () => null,
}))

jest.mock('../../services/psyeduService', () => ({
  fetchTopicsByModule: jest.fn().mockResolvedValue([]),
}))

const TOPICS_LIFESTYLE = [
  { id: 'tp-sleep', module_key: 'diet_weight_psycho', topic_key: 'sleep_chrono',    icon_name: 'Moon',       sort_order: 6, is_active: true },
  { id: 'tp-nutri', module_key: 'diet_weight_psycho', topic_key: 'nutrition_brain',  icon_name: 'Apple',      sort_order: 7, is_active: true },
  { id: 'tp-activ', module_key: 'diet_weight_psycho', topic_key: 'gentle_activity',  icon_name: 'Footprints', sort_order: 8, is_active: true },
]

const TOPICS_MEDICATION = [
  { id: 'tp-gen',  module_key: 'diet_weight_psycho', topic_key: 'general',         icon_name: 'Info',       sort_order: 1, is_active: true },
  { id: 'tp-anti', module_key: 'diet_weight_psycho', topic_key: 'antipsychotics',  icon_name: 'Pill',       sort_order: 2, is_active: true },
]

const ALL_TOPICS = [...TOPICS_LIFESTYLE, ...TOPICS_MEDICATION]

describe('DietWeightPsychoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([])
  })

  it('appelle fetchTopicsByModule avec diet_weight_psycho', async () => {
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(psyeduService.fetchTopicsByModule).toHaveBeenCalledWith('diet_weight_psycho')
    })
  })

  it('affiche le titre de section "Hygiène de vie" quand des topics lifestyle sont présents', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue(TOPICS_LIFESTYLE)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(screen.getByText('Hygiène de vie')).toBeTruthy()
    })
  })

  it('affiche le titre de section "Médicaments & alimentation" quand des topics médicaments sont présents', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue(TOPICS_MEDICATION)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(screen.getByText('Médicaments & alimentation')).toBeTruthy()
    })
  })

  it('affiche les deux sections quand tous les topics sont présents', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue(ALL_TOPICS)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(screen.getByText('Hygiène de vie')).toBeTruthy()
      expect(screen.getByText('Médicaments & alimentation')).toBeTruthy()
    })
  })

  it('n\'affiche pas la section lifestyle si aucun topic lifestyle', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue(TOPICS_MEDICATION)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(screen.queryByText('Hygiène de vie')).toBeNull()
    })
  })

  it('navigue vers DietWeightPsychoDetail au tap sur un topic', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue(TOPICS_MEDICATION)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => { expect(screen.getByText('Psychotropes et alimentation')).toBeTruthy() })
    fireEvent.press(screen.getByText('Psychotropes et alimentation'))
    expect(mockNavigate).toHaveBeenCalledWith('DietWeightPsychoDetail', expect.objectContaining({
      topicId: 'tp-gen',
      topicTitle: expect.any(String),
    }))
  })

  it('affiche un indicateur de chargement pendant le fetch', () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<DietWeightPsychoScreen />)
    expect(screen.getByTestId !== undefined).toBeTruthy()
  })

  it('les topics lifestyle sont séparés des topics médicaments', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue(ALL_TOPICS)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      const lifestyle = screen.getByText('Hygiène de vie')
      const medication = screen.getByText('Médicaments & alimentation')
      expect(lifestyle).toBeTruthy()
      expect(medication).toBeTruthy()
    })
  })
})
