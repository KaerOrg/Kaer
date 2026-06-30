jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@services/psyeduService', () => ({
  fetchTopicsByIds: jest.fn(),
  fetchThemes: jest.fn(),
  fetchBlocksByTopic: jest.fn(),
  markTopicRead: jest.fn(),
}))

jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { teenMode: boolean; patient: { id: string } }) => unknown) =>
    selector({ teenMode: false, patient: { id: 'pat-1' } }),
}))

jest.mock('../../../PsyEduBlockRenderer', () => ({
  PsyEduBlockRenderer: () => null,
}))

jest.mock('lucide-react-native', () => {
  const React = require('react')
  const Stub = (name: string) => (props: { size?: number; color?: string }) =>
    React.createElement('Icon', { ...props, name })
  return new Proxy({}, { get: (_, key) => Stub(String(key)) })
})

jest.mock('i18next', () => {
  const dict: Record<string, string> = {
    'diet_weight_psycho.general.title': 'Psychotropes et alimentation',
    'diet_weight_psycho.general.summary': 'Effets sur l\'appétit',
    'psyedu_sleep.sleep_chrono.title': 'Le sommeil',
    'psyedu_sleep.sleep_chrono.summary': 'Récupération',
    'theme.treatment': 'Mon traitement',
    'theme.lifestyle': 'Hygiène de vie',
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
import { PsyEduLibraryLayout } from './PsyEduLibraryLayout'
import * as psyeduService from '@services/psyeduService'
import type { PsyEduTopic, PsyEduTheme } from '@kaer/shared'

jest.setTimeout(15000)

const THEMES: PsyEduTheme[] = [
  { id: 'treatment', icon_name: 'Pill', sort_order: 1 },
  { id: 'lifestyle', icon_name: 'Moon', sort_order: 2 },
]

const TOPICS: PsyEduTopic[] = [
  { id: 't1', module_key: 'diet_weight_psycho', theme_id: 'treatment', topic_key: 'general', icon_name: 'Pill', sort_order: 1, is_active: true, reviewed_at: null },
  { id: 't2', module_key: 'psyedu_sleep', theme_id: 'lifestyle', topic_key: 'sleep_chrono', icon_name: 'Moon', sort_order: 6, is_active: true, reviewed_at: null },
]

const CONFIG = {
  unlocked_topics: [
    { topic_id: 't1', is_read: false, unlocked_at: '2026-06-01T00:00:00Z' },
    { topic_id: 't2', is_read: true, unlocked_at: '2026-06-01T00:00:00Z' },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(psyeduService.fetchTopicsByIds as jest.Mock).mockResolvedValue(TOPICS)
  ;(psyeduService.fetchThemes as jest.Mock).mockResolvedValue(THEMES)
  ;(psyeduService.fetchBlocksByTopic as jest.Mock).mockResolvedValue([])
  ;(psyeduService.markTopicRead as jest.Mock).mockResolvedValue(undefined)
})

describe('PsyEduLibraryLayout', () => {
  it('affiche les fiches débloquées groupées par thème', async () => {
    render(<PsyEduLibraryLayout patientConfig={CONFIG} />)

    await waitFor(() => expect(screen.getByTestId('psyedu-library-topic-general')).toBeTruthy())
    expect(screen.getByTestId('psyedu-library-topic-sleep_chrono')).toBeTruthy()
    expect(psyeduService.fetchTopicsByIds).toHaveBeenCalledWith(['t1', 't2'])
  })

  it('affiche un badge « lu » pour les fiches déjà lues', async () => {
    render(<PsyEduLibraryLayout patientConfig={CONFIG} />)

    // t2 (is_read=true) a le badge lu ; t1 ne l'a pas.
    await waitFor(() => expect(screen.getByTestId('psyedu-library-read-sleep_chrono')).toBeTruthy())
    expect(screen.queryByTestId('psyedu-library-read-general')).toBeNull()
  })

  it('ouvre une fiche et permet de la marquer comme lue', async () => {
    render(<PsyEduLibraryLayout patientConfig={CONFIG} />)

    await waitFor(() => expect(screen.getByTestId('psyedu-library-topic-general')).toBeTruthy())
    await act(async () => {
      fireEvent.press(screen.getByTestId('psyedu-library-topic-general'))
    })

    await waitFor(() => expect(screen.getByTestId('psyedu-library-mark-read')).toBeTruthy())
    await act(async () => {
      fireEvent.press(screen.getByTestId('psyedu-library-mark-read'))
    })

    expect(psyeduService.markTopicRead).toHaveBeenCalledWith('pat-1', 't1')
  })

  it('affiche un état vide si aucune fiche débloquée', async () => {
    ;(psyeduService.fetchTopicsByIds as jest.Mock).mockResolvedValueOnce([])
    render(<PsyEduLibraryLayout patientConfig={{ unlocked_topics: [] }} />)

    await waitFor(() => expect(screen.getByTestId('psyedu-library-empty')).toBeTruthy())
  })
})
