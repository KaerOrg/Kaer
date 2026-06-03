jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_m: string, k: string) => k, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ScaleEntryScreen from './ScaleEntryScreen'
import * as database from '../../lib/database'
import * as moduleService from '../../services/moduleService'

jest.setTimeout(15000)

const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, setOptions: jest.fn() }),
  useRoute: () => ({ params: { scale_id: 'phq9' } }),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

const stableT = (key: string) => key.split('.').pop() ?? key
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: stableT, i18n: { language: 'fr' } }),
}))

// Prevent AppStack from importing all 30+ screen components (OOM)
jest.mock('../../navigation/AppStack', () => ({}))

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react')
  const { View } = require('react-native')
  return { __esModule: true, default: () => React.createElement(View, null) }
})

jest.mock('../../store/authStore', () => ({
  useAuthStore: (sel?: (s: { patient: null }) => unknown) =>
    sel ? sel({ patient: null }) : { patient: null },
}))

jest.mock('../../services/notificationService', () => ({
  logScaleSubmission: jest.fn(),
}))

jest.mock('../../theme', () => ({
  colors: { primary: '#000', background: '#fff', border: '#ccc', white: '#fff', textMuted: '#999' },
  spacing: { sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8 },
  typography: {},
}))

jest.mock('../../components/features/ModuleRenderer/FieldRenderer', () => {
  const React = require('react')
  const { View, TouchableOpacity, Text } = require('react-native')
  return {
    FieldRenderer: function MockFieldRenderer({ questionnaire }: {
      preview_kind?: string
      fields?: unknown[]
      questionnaire?: { answers: (number | null)[]; onAnswer: (index: number, value: number) => void }
    }) {
      if (!questionnaire) return null
      return React.createElement(
        View,
        null,
        questionnaire.answers.map(function(_: number | null, i: number) {
          return React.createElement(
            TouchableOpacity,
            { key: String(i), testID: `answer_${i}`, onPress: function() { questionnaire.onAnswer(i, 1) } },
            React.createElement(Text, null, `answer_${i}`)
          )
        })
      )
    },
  }
})

jest.mock('../../services/moduleService', () => ({
  fetchModuleFields: jest.fn(),
}))

jest.mock('../../lib/database', () => ({
  saveScaleEntry: jest.fn().mockResolvedValue(undefined),
  getScaleEntryById: jest.fn().mockResolvedValue(null),
  getLatestScaleEntry: jest.fn().mockResolvedValue(null),
  generateId: jest.fn().mockReturnValue('test-id'),
}))

jest.mock('../../lib/scaleScoring', () => ({
  SCALE_SCORING: {
    phq9: {
      score_decimals: 0,
      items_count: 2,
      computeScore: jest.fn().mockReturnValue(2),
      computeSubscaleScores: undefined,
    },
  },
}))

const MOCK_FIELDS: moduleService.ContentField[] = [
  {
    id: 'phq9.instr1', module_id: 'phq9', section_id: null, parent_field_id: null,
    field_type: 'scale_instruction', text_code: 'modules.phq9.instr1', sort_order: 1,
    props: {}, children: [],
  },
  {
    id: 'phq9.q1', module_id: 'phq9', section_id: null, parent_field_id: null,
    field_type: 'scale_question', text_code: 'modules.phq9.q1', sort_order: 10,
    props: {}, children: [],
  },
  {
    id: 'phq9.q2', module_id: 'phq9', section_id: null, parent_field_id: null,
    field_type: 'scale_question', text_code: 'modules.phq9.q2', sort_order: 11,
    props: {}, children: [],
  },
]

describe('ScaleEntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'questionnaire',
      fields: MOCK_FIELDS,
    })
  })

  it('affiche le compteur de progression après chargement', async () => {
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByText('progress')).toBeTruthy())
  })

  it('affiche un message d\'erreur si fetchModuleFields rejette', async () => {
    ;(moduleService.fetchModuleFields as jest.Mock).mockRejectedValue(new Error('network'))
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByText('error')).toBeTruthy())
    expect(screen.getByText('back')).toBeTruthy()
  })

  it('n\'appelle pas saveScaleEntry si le questionnaire est incomplet', async () => {
    render(<ScaleEntryScreen />)
    // Button is disabled when questions remain unanswered — press has no effect
    await waitFor(() => expect(screen.getByText('submit')).toBeTruthy())
    fireEvent.press(screen.getByText('submit'))
    expect(database.saveScaleEntry).not.toHaveBeenCalled()
  })

  it('sauvegarde et revient en arrière après réponses complètes', async () => {
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByTestId('answer_0')).toBeTruthy())
    fireEvent.press(screen.getByTestId('answer_0'))
    fireEvent.press(screen.getByTestId('answer_1'))
    // After all answers, the button is enabled — press triggers save + navigation
    fireEvent.press(screen.getByText('submit'))
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled())
    expect(database.saveScaleEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-id',
        scale_id: 'phq9',
        answers: [1, 1],
        total_score: 2,
        subscale_scores: null,
      })
    )
  })
})
