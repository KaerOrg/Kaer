jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_m: string, k: string) => k, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ScaleEntryScreen from './ScaleEntryScreen'
import * as database from '../../../lib/database'
import * as moduleService from '@services/moduleService'

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
jest.mock('../../../navigation/AppStack', () => ({}))

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react')
  const { View } = require('react-native')
  return { __esModule: true, default: () => React.createElement(View, null) }
})

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (sel?: (s: { patient: null }) => unknown) =>
    sel ? sel({ patient: null }) : { patient: null },
}))

jest.mock('@services/notificationService', () => ({
  logScaleSubmission: jest.fn(),
}))

jest.mock('@theme', () => ({
  colors: {
    primary: '#000', primaryLight: '#eef', danger: '#f00', neutral: '#f3f4f6',
    background: '#fff', border: '#ccc', white: '#fff', text: '#111', textMuted: '#999',
    card: '#fff',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 8, lg: 16, full: 999 },
  fontSize: { xxs: 11, xs: 12, sm: 13, caption: 14, label: 15, body: 16, h3: 18, h2: 22, h1: 28, display: 32 },
  typography: {},
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../../components/features/ModuleRenderer/FieldRenderer', () => {
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

jest.mock('@services/moduleService', () => ({
  fetchModuleFields: jest.fn(),
}))

jest.mock('../../../lib/database', () => ({
  saveScaleEntry: jest.fn().mockResolvedValue(undefined),
  getScaleEntryById: jest.fn().mockResolvedValue(null),
  getLatestScaleEntry: jest.fn().mockResolvedValue(null),
  generateId: jest.fn().mockReturnValue('test-id'),
}))

jest.mock('../../../lib/scaleScoring', () => ({
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

  // #409. Deux mécanismes fabriquaient de faux points et ont été retirés.
  it('ne propose plus de reprendre les valeurs de la passation précédente', async () => {
    // Pré-remplir avec la saisie précédente est un biais d'ancrage sur un instrument
    // de mesure : le patient valide ce qui est déjà coché au lieu de répondre.
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByText('submit')).toBeTruthy())
    expect(screen.queryByText('reuse_last_values')).toBeNull()
  })

  it('ne propose plus de choisir la date de la saisie', async () => {
    // Déplacer une passation au 12 juillet ne recrée pas la fenêtre du 28 juin au
    // 12 juillet : la passation porte la date de son envoi, point.
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByText('submit')).toBeTruthy())
    expect(screen.queryByText('entry_date')).toBeNull()
  })
})

// ── Mode de saisie piloté par la configuration ──────────────────────────────
//
// Le critère du ticket : basculer `scale_meta.entry_mode` change le mode SANS
// toucher au composant. Les deux tests ci-dessous ne diffèrent que par la valeur de
// cette prop, jamais par un identifiant de module.

const META = (entryMode: string): moduleService.ContentField => ({
  id: 'phq9.scale_meta', module_id: 'phq9', section_id: null, parent_field_id: null,
  field_type: 'scale_meta', text_code: null, sort_order: 0,
  props: { entry_mode: entryMode }, children: [],
})

describe('ScaleEntryScreen : mode de saisie configuré', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rend la liste défilante quand entry_mode vaut scrolling_list', async () => {
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'questionnaire',
      fields: [META('scrolling_list'), ...MOCK_FIELDS],
    })
    render(<ScaleEntryScreen />)
    // La liste rend TOUTES les questions d'un coup, plus le compteur global.
    await waitFor(() => expect(screen.getByTestId('answer_0')).toBeTruthy())
    expect(screen.getByTestId('answer_1')).toBeTruthy()
    expect(screen.getByText('progress')).toBeTruthy()
  })

  it('rend un item par écran quand entry_mode vaut one_per_screen', async () => {
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'questionnaire',
      fields: [META('one_per_screen'), ...MOCK_FIELDS],
    })
    render(<ScaleEntryScreen />)
    // Un seul item à l'écran : le second n'est pas rendu.
    await waitFor(() => expect(screen.getByText('q1')).toBeTruthy())
    expect(screen.queryByText('q2')).toBeNull()
    expect(screen.getByTestId('stepper-progress')).toBeTruthy()
  })
})
