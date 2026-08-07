jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_m: string, k: string) => k, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ScaleEntryScreen from './ScaleEntryScreen'
import * as database from '../../../lib/database'
import * as moduleService from '@services/moduleService'
import * as scaleScoring from '../../../lib/scaleScoring'
import * as draftService from '@services/scaleDraftService'

jest.setTimeout(15000)

const mockGoBack = jest.fn()

// Paramètre de route mutable : certains tests ouvrent une saisie EXISTANTE (édition),
// ce qu'un `params` figé au niveau module ne permet pas d'exprimer.
let mockEntryId: string | undefined
let mockResume: boolean | undefined

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, setOptions: jest.fn() }),
  useRoute: () => ({ params: { scale_id: 'phq9', entry_id: mockEntryId, resume: mockResume } }),
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

// Le brouillon (#412) est mocké au niveau du SERVICE, pas de la base : l'écran dépend
// du service, c'est cette frontière-là qu'un test d'écran doit tenir.
jest.mock('@services/scaleDraftService', () => ({
  loadDraft: jest.fn().mockResolvedValue(null),
  saveDraft: jest.fn().mockResolvedValue(undefined),
  discardDraft: jest.fn().mockResolvedValue(undefined),
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

/** Remet les mocks partagés dans leur état par défaut : nouvelle saisie, deux items. */
function resetScaleMocks(): void {
  jest.clearAllMocks()
  mockEntryId = undefined
  mockResume = undefined
  ;(database.getScaleEntryById as jest.Mock).mockResolvedValue(null)
  ;(draftService.loadDraft as jest.Mock).mockResolvedValue(null)
  ;(draftService.saveDraft as jest.Mock).mockResolvedValue(undefined)
  ;(draftService.discardDraft as jest.Mock).mockResolvedValue(undefined)
  ;(scaleScoring.SCALE_SCORING as Record<string, unknown>).phq9 = {
    score_decimals: 0, items_count: 2,
    computeScore: jest.fn().mockReturnValue(2), computeSubscaleScores: undefined,
  }
}

describe('ScaleEntryScreen', () => {
  beforeEach(() => {
    resetScaleMocks()
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
  beforeEach(resetScaleMocks)

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

// ── Brouillon local d'une saisie en cours (#412) ────────────────────────────

describe('ScaleEntryScreen : brouillon', () => {
  beforeEach(() => {
    resetScaleMocks()
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'questionnaire',
      fields: MOCK_FIELDS,
    })
  })

  it('enregistre la progression à chaque réponse', async () => {
    // À chaque appui : c'est peut-être le dernier avant un appel entrant.
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByTestId('answer_0')).toBeTruthy())
    fireEvent.press(screen.getByTestId('answer_0'))
    expect(draftService.saveDraft).toHaveBeenCalledWith('phq9', [1, null], 0)
    fireEvent.press(screen.getByTestId('answer_1'))
    expect(draftService.saveDraft).toHaveBeenCalledWith('phq9', [1, 1], 1)
  })

  it('reprend les réponses du brouillon quand la route le demande', async () => {
    mockResume = true
    ;(draftService.loadDraft as jest.Mock).mockResolvedValue({
      scaleId: 'phq9', answers: [2, null], position: 0, startedAt: '2026-08-01T21:40:00.000Z',
    })
    render(<ScaleEntryScreen />)
    // Une seule réponse restaurée sur deux items : l'envoi reste fermé.
    await waitFor(() => expect(screen.getByText('submit')).toBeTruthy())
    fireEvent.press(screen.getByText('submit'))
    expect(database.saveScaleEntry).not.toHaveBeenCalled()
    fireEvent.press(screen.getByTestId('answer_1'))
    fireEvent.press(screen.getByText('submit'))
    await waitFor(() => expect(database.saveScaleEntry).toHaveBeenCalled())
    expect(database.saveScaleEntry).toHaveBeenCalledWith(
      expect.objectContaining({ answers: [2, 1] })
    )
  })

  it('ignore le brouillon quand la route ne demande pas de reprise', async () => {
    // C'est ce que fait « Recommencer » : on repart d'un questionnaire vierge.
    ;(draftService.loadDraft as jest.Mock).mockResolvedValue({
      scaleId: 'phq9', answers: [2, 3], position: 1, startedAt: '2026-08-01T21:40:00.000Z',
    })
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByText('submit')).toBeTruthy())
    expect(draftService.loadDraft).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('submit'))
    expect(database.saveScaleEntry).not.toHaveBeenCalled()
  })

  it('purge le brouillon une fois la passation enregistrée', async () => {
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByTestId('answer_0')).toBeTruthy())
    fireEvent.press(screen.getByTestId('answer_0'))
    fireEvent.press(screen.getByTestId('answer_1'))
    fireEvent.press(screen.getByText('submit'))
    await waitFor(() => expect(draftService.discardDraft).toHaveBeenCalledWith('phq9'))
  })

  it('ne brouillonne pas la modification d\'une passation déjà envoyée', async () => {
    // Elle est en base : il n'y a rien à garder sur le téléphone.
    mockEntryId = 'entry-1'
    ;(database.getScaleEntryById as jest.Mock).mockResolvedValue({
      id: 'entry-1', scale_id: 'phq9', answers: [1, 1], total_score: 2,
      subscale_scores: null, created_at: '2026-01-15T10:00:00.000Z',
    })
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByTestId('answer_0')).toBeTruthy())
    fireEvent.press(screen.getByTestId('answer_0'))
    expect(draftService.saveDraft).not.toHaveBeenCalled()
    expect(draftService.loadDraft).not.toHaveBeenCalled()
  })
})

// ── Items POSÉS et items COTÉS sont deux notions distinctes (#410) ──────────
//
// Le PHQ-9 pose dix questions et n'en additionne que neuf : l'item 10 mesure le
// retentissement fonctionnel, il est stocké mais pas compté. La maquette de test
// reproduit ce rapport en petit : TROIS questions posées, DEUX cotées.

const THIRD_QUESTION: moduleService.ContentField = {
  id: 'phq9.q3', module_id: 'phq9', section_id: null, parent_field_id: null,
  field_type: 'scale_question', text_code: 'modules.phq9.q3', sort_order: 12,
  props: {}, children: [],
}

describe('ScaleEntryScreen : item posé mais non coté', () => {
  beforeEach(() => {
    resetScaleMocks()
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'questionnaire',
      fields: [...MOCK_FIELDS, THIRD_QUESTION],
    })
  })

  it('ne se croit pas complète quand seuls les items cotés sont remplis', async () => {
    // Deux réponses sur trois : c'est le nombre d'items COTÉS, mais la saisie n'est
    // pas finie pour autant. C'est exactement le bug silencieux que le ticket vise.
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByTestId('answer_0')).toBeTruthy())
    fireEvent.press(screen.getByTestId('answer_0'))
    fireEvent.press(screen.getByTestId('answer_1'))
    fireEvent.press(screen.getByText('submit'))
    expect(database.saveScaleEntry).not.toHaveBeenCalled()
  })

  it('n\'additionne que les items cotés, et stocke la réponse de l\'item non coté', async () => {
    const computeScore = jest.fn().mockReturnValue(2)
    ;(scaleScoring.SCALE_SCORING as Record<string, unknown>).phq9 = {
      score_decimals: 0, items_count: 2, computeScore, computeSubscaleScores: undefined,
    }

    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByTestId('answer_0')).toBeTruthy())
    fireEvent.press(screen.getByTestId('answer_0'))
    fireEvent.press(screen.getByTestId('answer_1'))
    fireEvent.press(screen.getByTestId('answer_2'))
    fireEvent.press(screen.getByText('submit'))

    await waitFor(() => expect(database.saveScaleEntry).toHaveBeenCalled())
    // Le calcul ne voit que les deux premières réponses…
    expect(computeScore).toHaveBeenCalledWith([1, 1])
    // …mais les trois sont persistées : l'item non coté remonte au praticien.
    expect(database.saveScaleEntry).toHaveBeenCalledWith(
      expect.objectContaining({ answers: [1, 1, 1], total_score: 2 })
    )
  })
})

// ── Rétrocompatibilité : une passation antérieure à l'item 10 (#410) ────────

describe('ScaleEntryScreen : passation enregistrée avant l\'ajout d\'un item', () => {
  beforeEach(() => {
    resetScaleMocks()
    // On ouvre une saisie EXISTANTE : c'est le cas d'une passation enregistrée quand
    // le questionnaire n'avait encore que deux items sur les trois d'aujourd'hui.
    mockEntryId = 'old-1'
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'questionnaire',
      fields: [...MOCK_FIELDS, THIRD_QUESTION],
    })
    ;(database.getScaleEntryById as jest.Mock).mockResolvedValue({
      id: 'old-1', scale_id: 'phq9', answers: [2, 1], total_score: 3,
      subscale_scores: null, created_at: '2026-01-15T10:00:00.000Z',
    })
    ;(scaleScoring.SCALE_SCORING as Record<string, unknown>).phq9 = {
      score_decimals: 0, items_count: 2,
      computeScore: jest.fn().mockReturnValue(3), computeSubscaleScores: undefined,
    }
  })

  it('ne se croit pas complète alors qu\'il manque le dernier item', async () => {
    // La saisie porte deux réponses pour trois items posés : les cases manquantes
    // restent nulles, elles ne décalent rien et n'autorisent pas l'envoi.
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByText('save_changes')).toBeTruthy())
    fireEvent.press(screen.getByText('save_changes'))
    expect(database.saveScaleEntry).not.toHaveBeenCalled()
  })

  it('conserve l\'horodatage d\'origine quand on complète une ancienne passation', async () => {
    render(<ScaleEntryScreen />)
    await waitFor(() => expect(screen.getByTestId('answer_2')).toBeTruthy())
    fireEvent.press(screen.getByTestId('answer_2'))
    fireEvent.press(screen.getByText('save_changes'))

    await waitFor(() => expect(database.saveScaleEntry).toHaveBeenCalled())
    expect(database.saveScaleEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'old-1', created_at: '2026-01-15T10:00:00.000Z' })
    )
  })
})
