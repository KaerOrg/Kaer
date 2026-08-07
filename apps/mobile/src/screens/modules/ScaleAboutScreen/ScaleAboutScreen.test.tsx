jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { readFileSync } from 'fs'
import { join } from 'path'
import ScaleAboutScreen from './ScaleAboutScreen'
import * as moduleService from '@services/moduleService'
import * as homeService from '@services/homeService'

const mockNavigate = jest.fn()
const mockSetOptions = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, setOptions: mockSetOptions }),
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

const META: moduleService.ContentField = {
  id: 'phq9.scale_meta', module_id: 'phq9', section_id: null, parent_field_id: null,
  field_type: 'scale_meta', text_code: null, sort_order: 0,
  props: {
    instrument_citation: 'PHQ-9, Kroenke, Spitzer & Williams, 2001',
    reference_label: 'NICE NG222, dépression adulte',
  },
  children: [],
}

function unlocked(types: string[]) {
  return types.map(module_type => ({
    id: `pm-${module_type}`, module_type, config: {}, unlocked_at: '2026-01-01',
    module: { mobile_icon: 'x', color: '#000', preview_kind: 'form', category_id: 'c', is_hidden: false },
  }))
}

describe('ScaleAboutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'questionnaire', fields: [META],
    })
    ;(homeService.fetchUnlockedModules as jest.Mock).mockResolvedValue(unlocked(['phq9']))
  })

  it('rend les trois blocs titrés', async () => {
    render(<ScaleAboutScreen />)
    await waitFor(() => expect(screen.getByText('what_title')).toBeTruthy())
    expect(screen.getByText('not_title')).toBeTruthy()
    expect(screen.getByText('who_title')).toBeTruthy()
    expect(screen.getByText('about_what')).toBeTruthy()
    expect(screen.getByText('about_not')).toBeTruthy()
    expect(screen.getByText('about_who')).toBeTruthy()
  })

  it('affiche la note de l\'instrument en permanence, sans condition', async () => {
    // Reproduire cette phrase, c'est citer l'outil. La conditionner à une réponse
    // serait produire une interprétation.
    render(<ScaleAboutScreen />)
    await waitFor(() => expect(screen.getByTestId('instrument-note')).toBeTruthy())
    expect(screen.getByText('about_instrument_note')).toBeTruthy()
  })

  it('rend la mention de source en pied, pas un texte local', async () => {
    render(<ScaleAboutScreen />)
    await waitFor(() => expect(screen.getByTestId('source-citation')).toBeTruthy())
    expect(screen.getByText('PHQ-9, Kroenke, Spitzer & Williams, 2001')).toBeTruthy()
  })
})

describe('ScaleAboutScreen : renvoi vers le plan de sécurité', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'questionnaire', fields: [META],
    })
  })

  it('propose le renvoi quand le plan est déverrouillé, et l\'ouvre au tap', async () => {
    ;(homeService.fetchUnlockedModules as jest.Mock).mockResolvedValue(unlocked(['phq9', 'crisis_plan']))
    render(<ScaleAboutScreen />)
    await waitFor(() => expect(screen.getByTestId('about-plan-link')).toBeTruthy())
    fireEvent.press(screen.getByLabelText('plan_action'))
    expect(mockNavigate).toHaveBeenCalledWith('ModuleContent', { moduleType: 'crisis_plan' })
  })

  it('retire le renvoi quand le plan n\'est pas déverrouillé, sans le griser', async () => {
    ;(homeService.fetchUnlockedModules as jest.Mock).mockResolvedValue(unlocked(['phq9']))
    render(<ScaleAboutScreen />)
    await waitFor(() => expect(screen.getByText('what_title')).toBeTruthy())
    expect(screen.queryByTestId('about-plan-link')).toBeNull()
  })
})

// ── Invariants de la fiche ─────────────────────────────────────────────────

describe('ScaleAboutScreen : invariants', () => {
  const source = readFileSync(join(__dirname, 'ScaleAboutScreen.tsx'), 'utf8')

  it('ne lit aucune réponse et ne porte aucun seuil', () => {
    for (const forbidden of ['answers', 'total_score', 'computeScore', 'threshold', 'severity']) {
      expect(source).not.toContain(forbidden)
    }
  })

  it('n\'écrit aucun texte en dur : tout passe par i18n ou par la base', () => {
    // Le corps de la fiche ne contient aucune chaîne de prose entre balises.
    expect(source).not.toMatch(/>\s*[A-ZÀ-Ü][a-zà-ü]{3,}[^<{]*</)
  })

  it('ne fait pas apparaître le sigle de la recommandation dans le corps', async () => {
    // « NICE NG222 » ne dit rien à personne hors du métier : il reste disponible au
    // pied technique, pour qui le cherche, jamais dans le corps de la fiche.
    ;(homeService.fetchUnlockedModules as jest.Mock).mockResolvedValue(unlocked(['phq9']))
    ;(moduleService.fetchModuleFields as jest.Mock).mockResolvedValue({
      preview_kind: 'questionnaire', fields: [META],
    })
    render(<ScaleAboutScreen />)
    await waitFor(() => expect(screen.getByText('what_title')).toBeTruthy())
    expect(screen.queryByText(/NICE/)).toBeNull()
  })
})
