import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import DietWeightPsychoScreen from './DietWeightPsychoScreen'
import DietWeightPsychoDetailScreen from './DietWeightPsychoDetailScreen'
import * as psyeduService from '../../services/psyeduService'
import { PsyEduTopic, PsyEduBlock } from '@psytool/shared'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useFocusEffect: (cb: () => unknown) => {
      React.useEffect(() => {
        const cleanup = cb()
        return cleanup
      }, [])
    },
    useNavigation: () => ({ navigate: mockNavigate }),
    useRoute: jest.fn().mockReturnValue({
      params: { topicId: 'topic-uuid-1', topicKey: 'sleep_chrono' },
    }),
  }
})

jest.mock('react-native-safe-area-context', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    SafeAreaView: ({ children, testID }: { children: React.ReactNode; testID?: string }) =>
      React.createElement(View, { testID }, children),
  }
})

jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({
    isTeenMode: false,
    tt: () => '',
    tg: () => '',
    teenColor: () => undefined,
  }),
}))

jest.mock('../../components/features/TeenAccent', () => ({
  TeenAccent: () => null,
}))

jest.mock('../../components/features/DisclaimerBanner', () => ({
  DisclaimerBanner: () => null,
}))

jest.mock('../../components/features/PsyEduBlockRenderer', () => ({
  PsyEduBlockRenderer: () => null,
}))

jest.mock('../../components/features/ModuleRenderer/layouts/PsyEdu/iconMap', () => ({
  resolvePsyEduIcon: () => () => null,
}))

jest.mock('../../services/psyeduService')

const mockFetchTopics = psyeduService.fetchTopicsByModule as jest.Mock
const mockFetchBlocks = psyeduService.fetchBlocksByTopic as jest.Mock

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeTopic(overrides: Partial<PsyEduTopic>): PsyEduTopic {
  return {
    id: 'topic-uuid-1',
    module_key: 'diet_weight_psycho',
    topic_key: 'sleep_chrono',
    icon_name: 'moon',
    sort_order: 6,
    is_active: true,
    ...overrides,
  }
}

const LIFESTYLE_TOPICS: PsyEduTopic[] = [
  makeTopic({ id: 't1', topic_key: 'sleep_chrono', sort_order: 6 }),
  makeTopic({ id: 't2', topic_key: 'nutrition_brain', icon_name: 'leaf', sort_order: 7 }),
  makeTopic({ id: 't3', topic_key: 'gentle_activity', icon_name: 'activity', sort_order: 8 }),
]

const MEDICATION_TOPICS: PsyEduTopic[] = [
  makeTopic({ id: 't4', topic_key: 'general', icon_name: 'pill', sort_order: 1 }),
  makeTopic({ id: 't5', topic_key: 'antipsychotics', icon_name: 'shield', sort_order: 2 }),
]

const ALL_TOPICS = [...MEDICATION_TOPICS, ...LIFESTYLE_TOPICS]

// ─── DietWeightPsychoScreen ───────────────────────────────────────────────────

describe('DietWeightPsychoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('affiche un indicateur de chargement initialement', () => {
    mockFetchTopics.mockReturnValue(new Promise(() => {}))
    render(<DietWeightPsychoScreen />)
    expect(screen.getByTestId('dwp-loading')).toBeTruthy()
  })

  it('affiche les topics après chargement', async () => {
    mockFetchTopics.mockResolvedValue(ALL_TOPICS)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(screen.getByTestId('dwp-screen')).toBeTruthy()
      expect(screen.getByTestId('topic-row-sleep_chrono')).toBeTruthy()
      expect(screen.getByTestId('topic-row-general')).toBeTruthy()
    })
  })

  it('affiche la section Hygiène de vie (sort_order >= 6)', async () => {
    mockFetchTopics.mockResolvedValue(ALL_TOPICS)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(screen.getByTestId('section-lifestyle')).toBeTruthy()
    })
  })

  it('affiche la section Médicaments & alimentation (sort_order < 6)', async () => {
    mockFetchTopics.mockResolvedValue(ALL_TOPICS)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(screen.getByTestId('section-medication')).toBeTruthy()
    })
  })

  it("n'affiche pas la section Médicaments si aucun topic n'y appartient", async () => {
    mockFetchTopics.mockResolvedValue(LIFESTYLE_TOPICS)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(screen.queryByTestId('section-medication')).toBeNull()
    })
  })

  it('navigue vers DietWeightPsychoDetail au clic sur un topic', async () => {
    mockFetchTopics.mockResolvedValue(ALL_TOPICS)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      fireEvent.press(screen.getByTestId('topic-row-sleep_chrono'))
    })
    expect(mockNavigate).toHaveBeenCalledWith('DietWeightPsychoDetail', {
      topicId: 't1',
      topicKey: 'sleep_chrono',
    })
  })

  it("affiche un message d'erreur en cas d'échec réseau", async () => {
    mockFetchTopics.mockRejectedValue(new Error('network'))
    render(<DietWeightPsychoScreen />)
    await waitFor(() => {
      expect(screen.getByTestId('dwp-error')).toBeTruthy()
    })
  })

  it('recharge les topics à chaque fois que le focus revient', async () => {
    mockFetchTopics.mockResolvedValue(ALL_TOPICS)
    render(<DietWeightPsychoScreen />)
    await waitFor(() => expect(mockFetchTopics).toHaveBeenCalledTimes(1))
  })
})

// ─── DietWeightPsychoDetailScreen ────────────────────────────────────────────

const MOCK_BLOCKS: PsyEduBlock[] = [
  {
    id: 'b1',
    topic_id: 'topic-uuid-1',
    section_key: 'why',
    block_type: 'paragraph',
    text_code: 'diet_weight_psycho.sleep_chrono.why.p1',
    items_codes: null,
    href: null,
    sort_order: 0,
  },
]

describe('DietWeightPsychoDetailScreen', () => {
  const routeMock = {
    key: 'DietWeightPsychoDetail',
    name: 'DietWeightPsychoDetail' as const,
    params: { topicId: 'topic-uuid-1', topicKey: 'sleep_chrono' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('affiche un indicateur de chargement initialement', () => {
    mockFetchBlocks.mockReturnValue(new Promise(() => {}))
    render(<DietWeightPsychoDetailScreen route={routeMock as never} navigation={undefined as never} />)
    expect(screen.getByTestId('dwp-detail-loading')).toBeTruthy()
  })

  it('affiche le contenu après chargement', async () => {
    mockFetchBlocks.mockResolvedValue(MOCK_BLOCKS)
    render(<DietWeightPsychoDetailScreen route={routeMock as never} navigation={undefined as never} />)
    await waitFor(() => {
      expect(screen.getByTestId('dwp-detail-screen')).toBeTruthy()
    })
  })

  it("affiche un message d'erreur en cas d'échec", async () => {
    mockFetchBlocks.mockRejectedValue(new Error('fail'))
    render(<DietWeightPsychoDetailScreen route={routeMock as never} navigation={undefined as never} />)
    await waitFor(() => {
      expect(screen.getByTestId('dwp-detail-error')).toBeTruthy()
    })
  })

  it('appelle fetchBlocksByTopic avec le topicId correct', async () => {
    mockFetchBlocks.mockResolvedValue(MOCK_BLOCKS)
    render(<DietWeightPsychoDetailScreen route={routeMock as never} navigation={undefined as never} />)
    await waitFor(() => {
      expect(mockFetchBlocks).toHaveBeenCalledWith('topic-uuid-1')
    })
  })
})
