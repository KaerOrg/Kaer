jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: (_m: string, k: string) => k, tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import MedicationSideEffectsEntryScreen from './MedicationSideEffectsEntryScreen'
import * as database from '../../../lib/database'

jest.setTimeout(15000)

const mockGoBack = jest.fn()
const routeParams: { effects: { key: string; label: string; color: string }[]; entry_id?: string } = {
  effects: [
    { key: 'sedation', label: 'Somnolence', color: '#8B5CF6' },
    { key: 'nausea', label: 'Nausées', color: '#10B981' },
  ],
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, setOptions: jest.fn() }),
  useRoute: () => ({ params: routeParams }),
}))

jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: { children: React.ReactNode }) => children }))
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('../../../components/features/TeenAccent', () => ({ TeenAccent: () => null }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key.split('.').pop() ?? key, i18n: { language: 'fr' } }),
}))
jest.mock('../../../navigation/AppStack', () => ({}))
jest.mock('@theme', () => ({
  colors: { primary: '#000', background: '#fff', border: '#ccc', white: '#fff', textMuted: '#999', card: '#f5f5f5', text: '#111' },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, full: 999 },
  shadows: { sm: {}, md: {} },
}))
jest.mock('../../../store/authStore', () => ({ useAuthStore: (sel: (s: unknown) => unknown) => sel({ patient: { id: 'patient-1' } }) }))
jest.mock('../../../lib/database', () => ({
  saveScaleEntry: jest.fn().mockResolvedValue(undefined),
  getScaleEntryById: jest.fn().mockResolvedValue(null),
  generateId: () => 'new-id',
}))
jest.mock('@services/notificationService', () => ({ logScaleSubmission: jest.fn() }))

const mockSave = jest.mocked(database.saveScaleEntry)

// Décale la valeur d'un curseur d'effet via son action d'accessibilité (le geste
// PanResponder n'est pas simulable sans layout). increment part de min (0).
const step = (key: string, action: 'increment' | 'decrement', times = 1) => {
  for (let i = 0; i < times; i++) {
    fireEvent(screen.getByTestId(`effect-${key}-track`), 'accessibilityAction', {
      nativeEvent: { actionName: action },
    })
  }
}

describe('MedicationSideEffectsEntryScreen', () => {
  beforeEach(() => { jest.clearAllMocks(); routeParams.entry_id = undefined })

  it('affiche un curseur par effet actif + le sélecteur de jour', () => {
    render(<MedicationSideEffectsEntryScreen />)
    expect(screen.getByText('Somnolence')).toBeTruthy()
    expect(screen.getByText('Nausées')).toBeTruthy()
    expect(screen.getByText('entry_date_label')).toBeTruthy()
    // Curseurs du design system (ui/Slider), plus aucun « pip » ad hoc.
    expect(screen.getByTestId('effect-sedation-track')).toBeTruthy()
    expect(screen.getByTestId('effect-nausea-track')).toBeTruthy()
  })

  it('enregistre les valeurs par clé d’effet une fois tous les effets renseignés', async () => {
    render(<MedicationSideEffectsEntryScreen />)
    step('sedation', 'increment', 3) // null → 1 → 2 → 3
    step('nausea', 'decrement', 1)   // null → 0
    await act(async () => { fireEvent.press(screen.getByText('save')) })
    await waitFor(() => expect(mockSave).toHaveBeenCalled())
    const entry = mockSave.mock.calls[0][0]
    expect(entry.scale_id).toBe('medication_side_effects')
    expect(entry.subscale_scores).toMatchObject({ sedation: 3, nausea: 0 })
    expect(entry.answers).toEqual([3, 0])
  })

  it('ne sauvegarde pas tant qu’un effet n’est pas renseigné', () => {
    render(<MedicationSideEffectsEntryScreen />)
    step('sedation', 'increment', 3)
    // nausea non renseigné → le bouton affiche la progression, pas "save"
    expect(screen.queryByText('save')).toBeNull()
    expect(mockSave).not.toHaveBeenCalled()
  })
})
