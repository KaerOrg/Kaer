import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  const stub = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children)
  return {
    __esModule: true,
    default: stub,
    Svg: stub, Polyline: stub, Circle: stub, Line: stub,
    Text: ({ children }: { children?: React.ReactNode }) => React.createElement(Text, null, children),
  }
})

jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

const mockNavigate = jest.fn()
const mockSetOptions = jest.fn()
jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: mockNavigate, setOptions: mockSetOptions }),
    useFocusEffect: (cb: () => () => void) => {
      React.useEffect(() => cb(), [])
    },
  }
})

jest.mock('../../../lib/database', () => ({
  getAllScaleEntries: jest.fn().mockResolvedValue([]),
}))

jest.mock('../../../services/scaleEntryService', () => ({
  deleteScaleEntry: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../services/homeService', () => ({
  fetchModuleEvents: jest.fn().mockResolvedValue([]),
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (sel: (s: { patient: null }) => unknown) => sel({ patient: null }),
}))

jest.mock('../../../components/features/TeenAccent', () => ({
  TeenAccent: () => null,
}))

import MedicationSideEffectsHistoryScreen from './MedicationSideEffectsHistoryScreen'
import { getAllScaleEntries } from '../../../lib/database'
import { deleteScaleEntry } from '../../../services/scaleEntryService'
import { useConfirmDialog } from '../../../contexts/ConfirmDialogContext'

beforeEach(() => jest.clearAllMocks())

describe('MedicationSideEffectsHistoryScreen', () => {
  it('affiche l\'état vide après chargement sans entrées', async () => {
    render(<MedicationSideEffectsHistoryScreen />)
    expect(await screen.findByText('modules.medication_side_effects.empty_title')).toBeTruthy()
  })

  it('affiche une entrée avec ses chips après chargement', async () => {
    const entry = {
      id: 'e1',
      scale_id: 'medication_side_effects',
      total_score: 6,
      subscale_scores: { sedation: 2, akathisia: 1, notes: 'test note' },
      created_at: '2026-06-01T10:00:00Z',
    }
    ;(getAllScaleEntries as jest.Mock).mockResolvedValue([entry])

    render(<MedicationSideEffectsHistoryScreen />)

    expect(await screen.findByText('modules.medication_side_effects.chip_sedation')).toBeTruthy()
    expect(screen.getByText('modules.medication_side_effects.chip_akathisia')).toBeTruthy()
  })

  it('affiche le badge streak quand streak > 0', async () => {
    const today = new Date().toISOString()
    const entry = {
      id: 'e1',
      scale_id: 'medication_side_effects',
      total_score: 3,
      subscale_scores: { sedation: 1 },
      created_at: today,
    }
    ;(getAllScaleEntries as jest.Mock).mockResolvedValue([entry])

    render(<MedicationSideEffectsHistoryScreen />)

    expect(await screen.findByText('1')).toBeTruthy()
  })

  it('appelle showConfirm (pas Alert.alert) lors de la suppression', async () => {
    const entry = {
      id: 'e1',
      scale_id: 'medication_side_effects',
      total_score: 3,
      subscale_scores: { sedation: 1 },
      created_at: '2026-06-01T10:00:00Z',
    }
    ;(getAllScaleEntries as jest.Mock).mockResolvedValue([entry])
    ;(deleteScaleEntry as jest.Mock).mockResolvedValue(undefined)

    render(<MedicationSideEffectsHistoryScreen />)

    const deleteBtn = await screen.findByLabelText('common.delete')
    fireEvent.press(deleteBtn)

    // Le mock global jest.setup.ts auto-invoque onConfirm — deleteScaleEntry doit être appelé
    const { showConfirm } = useConfirmDialog()
    expect(showConfirm).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }))
    expect(deleteScaleEntry).toHaveBeenCalledWith('e1')
  })

  it('navigue vers ScaleEntry au clic sur une entrée', async () => {
    const entry = {
      id: 'e1',
      scale_id: 'medication_side_effects',
      total_score: 3,
      subscale_scores: { sedation: 1 },
      created_at: '2026-06-01T10:00:00Z',
    }
    ;(getAllScaleEntries as jest.Mock).mockResolvedValue([entry])

    render(<MedicationSideEffectsHistoryScreen />)

    const card = await screen.findByLabelText('common.modify')
    fireEvent.press(card)

    expect(mockNavigate).toHaveBeenCalledWith('ScaleEntry', { scale_id: 'medication_side_effects', entry_id: 'e1' })
  })
})
