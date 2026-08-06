// Les deux portes du plan de sécurité (P-1, #316).
//
// Ce ne sont pas deux entrées vers le même contenu, c'est UNE ENTRÉE PAR INTENTION.
// Le bandeau déclare un état (« j'ai besoin d'aide maintenant ») et ouvre la Séquence ;
// la carte du module nomme un objet (« mon plan ») et ouvre la Consultation. Les faire
// arriver au même écran était le défaut que ce ticket corrige, et c'est exactement ce
// qu'un test de routage doit verrouiller.

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

const mockModules = jest.fn()
const mockRoutines = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryKey: readonly unknown[] }) =>
    (String(opts.queryKey[0]).includes('routine') ? mockRoutines() : mockModules()),
}))
jest.mock('../hooks/queries', () => ({
  homeQueries: {
    unlockedModules: () => ({ queryKey: ['home', 'modules'] }),
    todayRoutines: () => ({ queryKey: ['home', 'routines'] }),
  },
}))

jest.mock('../store/authStore', () => ({
  useAuthStore: (sel: (s: { patient: { id: string; first_name: string } | null }) => unknown) =>
    sel({ patient: { id: 'pat-1', first_name: 'Alex' } }),
}))
jest.mock('../hooks/useRefreshOnFocus', () => ({ useRefreshOnFocus: () => {} }))
jest.mock('../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: (k: string) => k, teenColor: () => undefined }),
}))
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// Les trois blocs de l'accueil ont leurs propres tests : stubbés pour isoler le routage.
jest.mock('../components/features/TodaySchedule', () => ({ TodaySchedule: () => null }))
jest.mock('../components/features/ModuleSections', () => {
  const R = require('react')
  const { Text } = require('react-native')
  return {
    ModuleSections: ({ onModulePress }: { onModulePress: (m: { module_type: string; module: { preview_kind: string } }) => void }) =>
      R.createElement(Text, {
        testID: 'module-crisis_plan',
        onPress: () => onModulePress({ module_type: 'crisis_plan', module: { preview_kind: 'safety_plan' } }),
      }, 'crisis_plan'),
  }
})
jest.mock('../components/features/CrisisBanner', () => {
  const R = require('react')
  const { Text } = require('react-native')
  return {
    CrisisBanner: ({ onPress }: { onPress: () => void }) =>
      R.createElement(Text, { testID: 'crisis-banner', onPress }, 'crise'),
  }
})
jest.mock('@ui/EmptyState', () => ({ EmptyState: () => null }))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import HomeScreen from './HomeScreen'

const CRISIS_MODULE = { module_type: 'crisis_plan', module: { preview_kind: 'safety_plan' } }

beforeEach(() => {
  jest.clearAllMocks()
  mockModules.mockReturnValue({ data: [CRISIS_MODULE], isLoading: false, isRefetching: false, refetch: jest.fn() })
  mockRoutines.mockReturnValue({ data: [], isLoading: false, isRefetching: false, refetch: jest.fn() })
})

describe('HomeScreen — les deux portes du plan de sécurité (P-1)', () => {
  it('« Je suis en crise » ouvre la Séquence, pas la Consultation', () => {
    render(<HomeScreen />)
    fireEvent.press(screen.getByTestId('crisis-banner'))
    expect(mockNavigate).toHaveBeenCalledWith('ModuleContent', {
      moduleType: 'crisis_plan',
      previewKindOverride: 'safety_sequence',
    })
  })

  it('la carte du module ouvre la Consultation, pas la Séquence', () => {
    render(<HomeScreen />)
    fireEvent.press(screen.getByTestId('module-crisis_plan'))
    expect(mockNavigate).toHaveBeenCalledWith('ModuleContent', { moduleType: 'crisis_plan' })
  })

  // L'Édition ne s'atteint que par « Modifier » depuis la Consultation : aucune porte
  // de l'accueil ne doit y mener, même avec un plan vide.
  it('aucune porte de l\'accueil n\'ouvre l\'Édition', () => {
    render(<HomeScreen />)
    fireEvent.press(screen.getByTestId('crisis-banner'))
    fireEvent.press(screen.getByTestId('module-crisis_plan'))
    for (const call of mockNavigate.mock.calls) {
      expect(JSON.stringify(call)).not.toContain('editable_steps')
    }
  })
})
