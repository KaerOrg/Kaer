jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { readFileSync } from 'fs'
import { join } from 'path'
import ScaleSubmittedScreen from './ScaleSubmittedScreen'
import * as moduleService from '@services/moduleService'
import * as homeService from '@services/homeService'

const mockGoBack = jest.fn()
const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate, setOptions: jest.fn() }),
  useRoute: () => ({ params: { scale_id: 'phq9' } }),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

const stableT = (key: string) => key.split('.').pop() ?? key
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: stableT, i18n: { language: 'fr' } }),
}))

jest.mock('../../../navigation/AppStack', () => ({}))

jest.mock('@services/moduleService', () => ({ fetchModuleFields: jest.fn() }))
jest.mock('@services/homeService', () => ({ fetchUnlockedModules: jest.fn() }))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (sel: (s: { patient: { id: string } }) => unknown) => sel({ patient: { id: 'pat-1' } }),
}))

const SAFETY_FIELDS: moduleService.ContentField[] = [
  {
    id: 'crisis_plan.emergency_3114', module_id: 'crisis_plan', section_id: null, parent_field_id: null,
    field_type: 'exercise_safety', text_code: 'modules.crisis_plan.emergency_3114', sort_order: 130,
    props: { phone: '3114', tone: 'primary', action_label_code: 'modules.crisis_plan.call_3114' }, children: [],
  },
  {
    id: 'crisis_plan.emergency_114', module_id: 'crisis_plan', section_id: null, parent_field_id: null,
    field_type: 'exercise_safety', text_code: 'modules.crisis_plan.emergency_114', sort_order: 150,
    props: { phone: '114', tone: 'danger', action: 'sms', action_label_code: 'modules.crisis_plan.write_114' }, children: [],
  },
]

function unlocked(types: string[]) {
  return types.map(module_type => ({
    id: `pm-${module_type}`, module_type, config: {}, unlocked_at: '2026-01-01',
    module: { mobile_icon: 'x', color: '#000', preview_kind: 'form', category_id: 'c', is_hidden: false },
  }))
}

describe('ScaleSubmittedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'safety_plan', fields: SAFETY_FIELDS,
    })
    ;(homeService.fetchUnlockedModules as jest.Mock).mockResolvedValue(unlocked(['phq9']))
  })

  it('confirme l\'envoi et dit qui le lira', async () => {
    render(<ScaleSubmittedScreen />)
    await waitFor(() => expect(screen.getByText('title')).toBeTruthy())
    expect(screen.getByText('seen_by')).toBeTruthy()
  })

  it('propose les ressources d\'aide sous la confirmation', async () => {
    render(<ScaleSubmittedScreen />)
    await waitFor(() => expect(screen.getByText('resources_hint')).toBeTruthy())
    expect(screen.getByTestId('emergency-3114')).toBeTruthy()
    expect(screen.getByTestId('emergency-114')).toBeTruthy()
  })

  it('ferme l\'écran sur « Terminé », et seulement là', async () => {
    render(<ScaleSubmittedScreen />)
    await waitFor(() => expect(screen.getByText('done')).toBeTruthy())
    expect(mockGoBack).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('done'))
    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })
})

describe('ScaleSubmittedScreen : tuile du plan de sécurité', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'safety_plan', fields: SAFETY_FIELDS,
    })
  })

  it('affiche la tuile quand le plan est déverrouillé, et l\'ouvre au tap', async () => {
    ;(homeService.fetchUnlockedModules as jest.Mock).mockResolvedValue(unlocked(['phq9', 'crisis_plan']))
    render(<ScaleSubmittedScreen />)
    await waitFor(() => expect(screen.getByTestId('safety-plan-tile')).toBeTruthy())
    fireEvent.press(screen.getByLabelText('plan_title'))
    expect(mockNavigate).toHaveBeenCalledWith('ModuleContent', { moduleType: 'crisis_plan' })
  })

  it('retire la tuile quand le plan n\'est pas déverrouillé, sans la griser', async () => {
    // Sans plan débloqué, il n'y a pas de plan à ouvrir : une tuile inerte ne ferait
    // que promettre ce qui n'existe pas.
    ;(homeService.fetchUnlockedModules as jest.Mock).mockResolvedValue(unlocked(['phq9']))
    render(<ScaleSubmittedScreen />)
    await waitFor(() => expect(screen.getByText('resources_hint')).toBeTruthy())
    expect(screen.queryByTestId('safety-plan-tile')).toBeNull()
    // Les numéros de secours, eux, restent proposés à tout le monde.
    expect(screen.getByTestId('emergency-3114')).toBeTruthy()
  })

  it('n\'affiche pas la tuile tant que l\'attribution est inconnue', async () => {
    ;(homeService.fetchUnlockedModules as jest.Mock).mockRejectedValue(new Error('offline'))
    render(<ScaleSubmittedScreen />)
    await waitFor(() => expect(screen.getByText('resources_hint')).toBeTruthy())
    expect(screen.queryByTestId('safety-plan-tile')).toBeNull()
  })
})

// ── L'invariant qui rend cet écran licite (MDR 2017/745) ────────────────────

describe('ScaleSubmittedScreen : aucune lecture des réponses', () => {
  const source = readFileSync(join(__dirname, 'ScaleSubmittedScreen.tsx'), 'utf8')

  it('ne reçoit pas les réponses et n\'y touche jamais', () => {
    // Les mêmes ressources fixes, à tout le monde, à chaque envoi, sans lire une seule
    // réponse. Un écran conditionné par l'item 9 ferait de Kær un dispositif médical,
    // et vu le risque en jeu, pas même en classe IIa. Ce test est le garde-fou : il
    // échoue si quelqu'un branche un jour la moindre réponse sur cet écran.
    for (const forbidden of ['answers', 'total_score', 'subscale_scores', 'item_9', 'computeScore']) {
      expect(source).not.toContain(forbidden)
    }
  })

  it('ne porte aucune couleur de gravité ni aucun seuil', () => {
    for (const forbidden of ['colors.danger', 'colors.warning', 'severity', '>= ', 'threshold']) {
      expect(source).not.toContain(forbidden)
    }
  })

  it('rend les mêmes ressources quelles que soient les réponses', async () => {
    // La route ne transporte que `scale_id` : il n'existe aucun chemin par lequel une
    // réponse pourrait atteindre cet écran.
    ;(homeService.fetchUnlockedModules as jest.Mock).mockResolvedValue(unlocked(['phq9']))
    render(<ScaleSubmittedScreen />)
    await waitFor(() => expect(screen.getByTestId('emergency-3114')).toBeTruthy())
    expect(screen.getByTestId('emergency-114')).toBeTruthy()
  })
})
