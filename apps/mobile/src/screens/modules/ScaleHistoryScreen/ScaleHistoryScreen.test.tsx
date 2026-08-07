jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_m: string, k: string) => k, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ScaleHistoryScreen from './ScaleHistoryScreen'
import * as database from '../../../lib/database'
import * as draftService from '@services/scaleDraftService'
import { useConfirmDialog } from '../../../contexts/ConfirmDialogContext'

jest.setTimeout(15000)

const mockNavigate = jest.fn()
// mutable so the SNAP-IV test can switch scale_id
let mockScaleId = 'phq9'

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: mockNavigate, setOptions: jest.fn() }),
    useRoute: () => ({ params: { scale_id: mockScaleId } }),
    useFocusEffect: (cb: () => () => void) => {
      React.useEffect(() => cb(), [])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../../components/features/TeenAccent', () => ({
  TeenAccent: () => null,
}))

const stableT = (key: string) => key.split('.').pop() ?? key
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: stableT, i18n: { language: 'fr' } }),
}))

jest.mock('../../../navigation/AppStack', () => ({}))

jest.mock('../../../lib/database', () => ({
  getAllScaleEntries: jest.fn().mockResolvedValue([]),
  deleteScaleEntry: jest.fn().mockResolvedValue(undefined),
}))

// Brouillon (#412) mocké au niveau du SERVICE : l'écran en dépend, pas de la base.
jest.mock('@services/scaleDraftService', () => ({
  loadDraft: jest.fn().mockResolvedValue(null),
  discardDraft: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../lib/scaleScoring', () => ({
  SCALE_SCORING: {
    phq9: { score_decimals: 0, items_count: 9 },
    snap_iv: {
      score_decimals: 0,
      items_count: 26,
      chips: ['chip_i', 'chip_hi', 'chip_tod'],
      chipSubscaleKeys: { chip_i: 'inattention', chip_hi: 'hyperactivite', chip_tod: 'tod' },
    },
  },
}))

const PHQ9_ENTRY: database.ScaleEntry = {
  id: 'phq9-1',
  scale_id: 'phq9',
  answers: Array(9).fill(1),
  total_score: 9,
  subscale_scores: null,
  created_at: '2026-04-20T10:00:00.000Z',
}

const SNAPIV_ENTRY: database.ScaleEntry = {
  id: 'snap-1',
  scale_id: 'snap_iv',
  answers: Array(26).fill(1),
  total_score: 26,
  subscale_scores: { inattention: 9, hyperactivite: 9, tod: 8 },
  created_at: '2026-04-20T10:00:00.000Z',
}

describe('ScaleHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockScaleId = 'phq9'
    ;(database.getAllScaleEntries as jest.Mock).mockResolvedValue([])
    ;(draftService.loadDraft as jest.Mock).mockResolvedValue(null)
  })

  it('navigue vers ScaleEntry au clic sur le bouton nouveau', async () => {
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByText('new_btn')).toBeTruthy())
    fireEvent.press(screen.getByText('new_btn'))
    expect(mockNavigate).toHaveBeenCalledWith('ScaleEntry', { scale_id: 'phq9' })
  })

  it('affiche l\'état vide quand aucune entrée', async () => {
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByText('empty_title')).toBeTruthy())
    expect(screen.getByText('empty_text')).toBeTruthy()
  })

  it('affiche le score total d\'une entrée', async () => {
    ;(database.getAllScaleEntries as jest.Mock).mockResolvedValue([PHQ9_ENTRY])
    render(<ScaleHistoryScreen />)
    // scoreValue and scoreMax are siblings in a compound Text → full text is "9 score_max"
    await waitFor(() => expect(screen.getByText('9 score_max')).toBeTruthy())
    expect(screen.getByText('score_label')).toBeTruthy()
  })

  it('n\'affiche pas de chips pour une échelle sans sous-scores', async () => {
    ;(database.getAllScaleEntries as jest.Mock).mockResolvedValue([PHQ9_ENTRY])
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByText('9 score_max')).toBeTruthy())
    expect(screen.queryByText('chip_i')).toBeNull()
  })

  it('déclenche une confirmation avant suppression', async () => {
    ;(database.getAllScaleEntries as jest.Mock).mockResolvedValue([PHQ9_ENTRY])
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByText('9 score_max')).toBeTruthy())
    fireEvent.press(screen.getByLabelText('delete'))
    expect(useConfirmDialog().showConfirm).toHaveBeenCalled()
  })

  it('supprime une entrée après confirmation', async () => {
    ;(database.getAllScaleEntries as jest.Mock).mockResolvedValue([PHQ9_ENTRY])
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByText('9 score_max')).toBeTruthy())
    fireEvent.press(screen.getByLabelText('delete'))
    await waitFor(() => expect(database.deleteScaleEntry).toHaveBeenCalledWith('phq9-1'))
  })

  it('affiche les chips de sous-échelles pour SNAP-IV', async () => {
    mockScaleId = 'snap_iv'
    ;(database.getAllScaleEntries as jest.Mock).mockResolvedValue([SNAPIV_ENTRY])
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByText('chip_i')).toBeTruthy())
    expect(screen.getByText('chip_hi')).toBeTruthy()
  })
})

// ── Carte de reprise d'un brouillon (#412) ──────────────────────────────────

describe('ScaleHistoryScreen : brouillon en cours', () => {
  const DRAFT = {
    scaleId: 'phq9', answers: [1, 2, null], position: 5, startedAt: '2026-08-01T21:40:00.000Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockScaleId = 'phq9'
    ;(database.getAllScaleEntries as jest.Mock).mockResolvedValue([])
    ;(draftService.loadDraft as jest.Mock).mockResolvedValue(DRAFT)
  })

  it('remplace le bouton de nouvelle saisie par la carte de reprise', async () => {
    // Une saisie est déjà en cours : proposer « Nouveau questionnaire » à côté
    // inviterait à en ouvrir une seconde et à perdre la première.
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByTestId('draft-resume-card')).toBeTruthy())
    expect(screen.queryByText('new_btn')).toBeNull()
  })

  it('reprend la saisie là où elle s\'est arrêtée', async () => {
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByText('draft_resume')).toBeTruthy())
    fireEvent.press(screen.getByText('draft_resume'))
    expect(mockNavigate).toHaveBeenCalledWith('ScaleEntry', { scale_id: 'phq9', resume: true })
  })

  it('efface le brouillon avant de repartir de zéro', async () => {
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByText('draft_restart')).toBeTruthy())
    fireEvent.press(screen.getByText('draft_restart'))
    await waitFor(() => expect(draftService.discardDraft).toHaveBeenCalledWith('phq9'))
    // Sans `resume` : la saisie s'ouvre vierge.
    expect(mockNavigate).toHaveBeenCalledWith('ScaleEntry', { scale_id: 'phq9' })
  })

  it('ne montre aucune carte quand il n\'y a pas de brouillon', async () => {
    ;(draftService.loadDraft as jest.Mock).mockResolvedValue(null)
    render(<ScaleHistoryScreen />)
    await waitFor(() => expect(screen.getByText('new_btn')).toBeTruthy())
    expect(screen.queryByTestId('draft-resume-card')).toBeNull()
  })
})
