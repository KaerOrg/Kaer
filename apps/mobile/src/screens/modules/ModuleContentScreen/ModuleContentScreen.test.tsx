// FieldRenderer stubbé : rend le preview_kind reçu → on vérifie quel layout le
// screen sélectionne (celui du module, ou l'override de la roue crantée).
jest.mock('../../../components/features/ModuleRenderer', () => {
  const R = require('react')
  const { Text } = require('react-native')
  return {
    FieldRenderer: ({ preview_kind }: { preview_kind: string }) =>
      R.createElement(Text, null, `renderer:${preview_kind}`),
  }
})

jest.mock('../../../components/features/TeenAccent', () => ({ TeenAccent: () => null }))
jest.mock('../../../hooks/useTeen', () => ({ useTeen: () => ({ teenColor: () => undefined }) }))
jest.mock('../../../hooks/useRefreshOnFocus', () => ({ useRefreshOnFocus: () => {} }))
jest.mock('../../../store/authStore', () => ({
  useAuthStore: (sel: (s: { patient: { id: string } | null }) => unknown) => sel({ patient: { id: 'p1' } }),
}))
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ isSuccess: false, data: undefined, refetch: jest.fn() }),
}))

const mockFetchModuleFields = jest.fn()
jest.mock('@services/moduleService', () => ({
  fetchModuleFields: (...a: unknown[]) => mockFetchModuleFields(...a),
}))
jest.mock('../../../hooks/queries', () => ({
  moduleQueries: { patientModuleConfig: () => ({ queryKey: ['x'], queryFn: () => null }) },
}))

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
import ModuleContentScreen from './ModuleContentScreen'

type Params = { moduleType: string; previewKindOverride?: string }

function renderScreen(params: Params) {
  const route = { params } as never
  const navigation = { setOptions: jest.fn() } as never
  return render(<ModuleContentScreen route={route} navigation={navigation} />)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchModuleFields.mockResolvedValue({ preview_kind: 'safety_plan', fields: [] })
})

describe('ModuleContentScreen — previewKindOverride', () => {
  it('rend le layout du module par défaut (sans override)', async () => {
    renderScreen({ moduleType: 'crisis_plan' })
    await waitFor(() => expect(screen.getByText('renderer:safety_plan')).toBeTruthy())
  })

  it('force le layout de l\'override quand fourni (roue crantée → édition)', async () => {
    renderScreen({ moduleType: 'crisis_plan', previewKindOverride: 'editable_steps' })
    await waitFor(() => expect(screen.getByText('renderer:editable_steps')).toBeTruthy())
    expect(screen.queryByText('renderer:safety_plan')).toBeNull()
  })
})
