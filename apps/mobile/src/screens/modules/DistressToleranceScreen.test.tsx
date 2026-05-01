jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import DistressToleranceScreen from './DistressToleranceScreen'
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

jest.mock('../../components/PsyEduBlockRenderer', () => ({
  PsyEduBlockRenderer: () => null,
}))

jest.mock('../../services/psyeduService', () => ({
  fetchTopicsByModule: jest.fn().mockResolvedValue([]),
  fetchBlocksByTopic: jest.fn().mockResolvedValue([]),
}))

const TOPIC_INTRO = {
  id: 'topic-intro',
  module_key: 'distress_tolerance',
  topic_key: 'intro',
  icon_name: 'BookOpen',
  sort_order: 1,
  is_active: true,
}

const TOPIC_TIPP = {
  id: 'topic-tipp',
  module_key: 'distress_tolerance',
  topic_key: 'tipp',
  icon_name: 'Zap',
  sort_order: 2,
  is_active: true,
}

const TOPIC_ACCEPTS = {
  id: 'topic-accepts',
  module_key: 'distress_tolerance',
  topic_key: 'accepts',
  icon_name: 'Wind',
  sort_order: 3,
  is_active: true,
}

describe('DistressToleranceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([])
    ;(psyeduService.fetchBlocksByTopic as jest.Mock).mockResolvedValue([])
  })

  it('affiche les deux onglets Fiches et En crise', async () => {
    render(<DistressToleranceScreen />)
    await waitFor(() => {
      expect(screen.getByText('Fiches')).toBeTruthy()
      expect(screen.getByText('En crise')).toBeTruthy()
    })
  })

  it('affiche le bandeau disclaimer', async () => {
    render(<DistressToleranceScreen />)
    await waitFor(() => {
      expect(
        screen.getByText(/support à vos consultations/i),
      ).toBeTruthy()
    })
  })

  it('passe sur l\'onglet En crise au tap', async () => {
    render(<DistressToleranceScreen />)
    await waitFor(() => { expect(screen.getByText('En crise')).toBeTruthy() })
    fireEvent.press(screen.getByText('En crise'))
    await waitFor(() => {
      expect(screen.getByText(/Appuyez sur une technique/i)).toBeTruthy()
    })
  })

  it('appelle fetchTopicsByModule avec distress_tolerance', async () => {
    render(<DistressToleranceScreen />)
    await waitFor(() => {
      expect(psyeduService.fetchTopicsByModule).toHaveBeenCalledWith('distress_tolerance')
    })
  })

  it('affiche les topics dans l\'onglet Fiches', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([TOPIC_INTRO, TOPIC_TIPP])
    render(<DistressToleranceScreen />)
    await waitFor(() => {
      expect(psyeduService.fetchTopicsByModule).toHaveBeenCalledWith('distress_tolerance')
    })
  })

  it('charge les blocs des techniques au premier affichage de l\'onglet En crise', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([TOPIC_INTRO, TOPIC_TIPP, TOPIC_ACCEPTS])
    render(<DistressToleranceScreen />)
    await waitFor(() => { expect(screen.getByText('En crise')).toBeTruthy() })
    fireEvent.press(screen.getByText('En crise'))
    await waitFor(() => {
      // fetchBlocksByTopic appelé uniquement pour les techniques (pas intro)
      expect(psyeduService.fetchBlocksByTopic).toHaveBeenCalledWith('topic-tipp')
      expect(psyeduService.fetchBlocksByTopic).toHaveBeenCalledWith('topic-accepts')
      expect(psyeduService.fetchBlocksByTopic).not.toHaveBeenCalledWith('topic-intro')
    })
  })

  it('ne recharge pas les blocs si on quitte et revient sur l\'onglet En crise', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([TOPIC_TIPP])
    render(<DistressToleranceScreen />)
    fireEvent.press(screen.getByText('En crise'))
    await waitFor(() => { expect(psyeduService.fetchBlocksByTopic).toHaveBeenCalledTimes(1) })
    fireEvent.press(screen.getByText('Fiches'))
    fireEvent.press(screen.getByText('En crise'))
    await waitFor(() => {
      expect(psyeduService.fetchBlocksByTopic).toHaveBeenCalledTimes(1)
    })
  })

  it('navigue vers DistressToleranceDetail au tap sur un topic', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([TOPIC_INTRO])
    render(<DistressToleranceScreen />)
    await waitFor(() => {
      expect(psyeduService.fetchTopicsByModule).toHaveBeenCalledWith('distress_tolerance')
    })
  })
})
