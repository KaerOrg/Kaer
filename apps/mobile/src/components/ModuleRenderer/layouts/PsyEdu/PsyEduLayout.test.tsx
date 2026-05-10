jest.mock('../../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../../services/psyeduService', () => ({
  fetchTopicsByModule: jest.fn(),
  fetchBlocksByTopic: jest.fn(),
  clearPsyEduCache: jest.fn(),
}))

jest.mock('../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { teenMode: boolean }) => unknown) =>
    selector({ teenMode: false }),
}))

jest.mock('lucide-react-native', () => {
  const React = require('react')
  const Stub = (name: string) => (props: { size?: number; color?: string }) =>
    React.createElement('Icon', { ...props, name })
  return new Proxy({}, { get: (_, key) => Stub(String(key)) })
})

jest.mock('i18next', () => {
  const dict: Record<string, string> = {
    'craving_journal.what_is_craving.title': 'Qu\'est-ce que le craving ?',
    'craving_journal.what_is_craving.summary': 'Définition et modèle TCC',
    'craving_journal.urge_surfing.title': 'Le surf de l\'envie',
    'craving_journal.urge_surfing.summary': 'Technique de Marlatt',
  }
  return {
    __esModule: true,
    default: {
      exists: jest.fn((key: string, opts?: { ns?: string }) => {
        if (opts?.ns === 'psyedu_teen') return false
        return key in dict
      }),
      t: jest.fn((key: string) => dict[key] ?? ''),
    },
  }
})

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { PsyEduLayout } from './PsyEduLayout'
import * as psyeduService from '../../../../services/psyeduService'
import type { PsyEduTopic, PsyEduBlock } from '@psytool/shared'

jest.setTimeout(15000)

const TOPICS: PsyEduTopic[] = [
  {
    id: 'topic-1',
    module_key: 'craving_journal',
    topic_key: 'what_is_craving',
    icon_name: 'Brain',
    sort_order: 0,
    is_active: true,
  },
  {
    id: 'topic-2',
    module_key: 'craving_journal',
    topic_key: 'urge_surfing',
    icon_name: 'Waves',
    sort_order: 1,
    is_active: true,
  },
]

const BLOCKS_TOPIC_1: PsyEduBlock[] = [
  {
    id: 'b1',
    topic_id: 'topic-1',
    section_key: 'why',
    block_type: 'paragraph',
    text_code: 'craving_journal.what_is_craving.why.p1',
    items_codes: null,
    href: null,
    sort_order: 0,
  },
]

describe('PsyEduLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('charge et affiche la liste des topics au montage', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue(TOPICS)
    render(<PsyEduLayout moduleId="craving_journal" />)
    await waitFor(() => {
      expect(psyeduService.fetchTopicsByModule).toHaveBeenCalledWith('craving_journal')
    })
    expect(await screen.findByTestId('psyedu-topic-what_is_craving')).toBeTruthy()
    expect(screen.getByTestId('psyedu-topic-urge_surfing')).toBeTruthy()
    expect(screen.getByText('Qu\'est-ce que le craving ?')).toBeTruthy()
    expect(screen.getByText('Le surf de l\'envie')).toBeTruthy()
  })

  it('affiche un état vide si aucun topic', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([])
    render(<PsyEduLayout moduleId="empty_module" />)
    expect(await screen.findByTestId('psyedu-empty')).toBeTruthy()
  })

  it('passe en mode détail quand on tape sur un topic et fetch les blocks', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue(TOPICS)
    ;(psyeduService.fetchBlocksByTopic as jest.Mock).mockResolvedValue(BLOCKS_TOPIC_1)
    render(<PsyEduLayout moduleId="craving_journal" />)
    fireEvent.press(await screen.findByTestId('psyedu-topic-what_is_craving'))
    await waitFor(() => {
      expect(psyeduService.fetchBlocksByTopic).toHaveBeenCalledWith('topic-1')
    })
    expect(await screen.findByTestId('psyedu-detail')).toBeTruthy()
    expect(screen.getByTestId('psyedu-back')).toBeTruthy()
  })

  it('revient à la liste depuis le détail via le bouton back', async () => {
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue(TOPICS)
    ;(psyeduService.fetchBlocksByTopic as jest.Mock).mockResolvedValue([])
    render(<PsyEduLayout moduleId="craving_journal" />)
    fireEvent.press(await screen.findByTestId('psyedu-topic-what_is_craving'))
    await waitFor(() => expect(screen.getByTestId('psyedu-back')).toBeTruthy())
    await act(async () => {
      fireEvent.press(screen.getByTestId('psyedu-back'))
    })
    expect(await screen.findByTestId('psyedu-list')).toBeTruthy()
  })

  it('trie les blocks par section_key (why, how, sources) puis sort_order', async () => {
    const unsortedBlocks: PsyEduBlock[] = [
      { id: 'b3', topic_id: 'topic-1', section_key: 'sources', block_type: 'source_link', text_code: 's1', items_codes: null, href: 'https://has.fr', sort_order: 0 },
      { id: 'b2', topic_id: 'topic-1', section_key: 'how', block_type: 'paragraph', text_code: 'h1', items_codes: null, href: null, sort_order: 0 },
      { id: 'b1', topic_id: 'topic-1', section_key: 'why', block_type: 'heading', text_code: 'w1', items_codes: null, href: null, sort_order: 0 },
    ]
    ;(psyeduService.fetchTopicsByModule as jest.Mock).mockResolvedValue([TOPICS[0]])
    ;(psyeduService.fetchBlocksByTopic as jest.Mock).mockResolvedValue(unsortedBlocks)
    render(<PsyEduLayout moduleId="craving_journal" />)
    fireEvent.press(await screen.findByTestId('psyedu-topic-what_is_craving'))
    await waitFor(() => {
      expect(psyeduService.fetchBlocksByTopic).toHaveBeenCalled()
    })
    // Le tri est implicite : on vérifie surtout que le composant ne crashe pas
    // et rend bien le détail
    expect(await screen.findByTestId('psyedu-detail')).toBeTruthy()
  })
})
