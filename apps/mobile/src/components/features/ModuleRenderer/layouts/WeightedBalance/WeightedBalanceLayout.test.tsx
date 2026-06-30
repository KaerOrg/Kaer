const mockListEMValues = jest.fn()
const mockSaveEMValues = jest.fn().mockResolvedValue(undefined)
const mockListEMBalanceItems = jest.fn()
const mockSaveEMBalanceItem = jest.fn().mockResolvedValue(undefined)
const mockDeleteEMBalanceItem = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/motivationalBalanceService', () => ({
  listEMValues: (...a: unknown[]) => mockListEMValues(...a),
  saveEMValues: (...a: unknown[]) => mockSaveEMValues(...a),
  listEMBalanceItems: (...a: unknown[]) => mockListEMBalanceItems(...a),
  saveEMBalanceItem: (...a: unknown[]) => mockSaveEMBalanceItem(...a),
  deleteEMBalanceItem: (...a: unknown[]) => mockDeleteEMBalanceItem(...a),
}))

jest.mock('../../../../../lib/database', () => ({ generateId: () => 'gen-1' }))

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

jest.mock('../../../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: jest.fn() }),
}))

jest.mock('lucide-react-native', () => ({ Trash2: 'Trash2', Plus: 'Plus' }))
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { WeightedBalanceLayout } from './WeightedBalanceLayout'
import type { ContentField } from '@services/moduleService'

function configField(props: Record<string, string>): ContentField {
  return {
    id: 'wb.cfg', module_id: 'motivational_balance', section_id: null, parent_field_id: null,
    field_type: 'weighted_balance_config', text_code: null, sort_order: 0, props, children: [],
  }
}

const FIELDS = [configField({ value_1: 'family', value_2: 'health', value_3: 'work', max_values: '2' })]

describe('WeightedBalanceLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListEMValues.mockResolvedValue([])
    mockListEMBalanceItems.mockResolvedValue([])
  })

  it('rend les chips de valeurs depuis la config indexée', async () => {
    render(<WeightedBalanceLayout fields={FIELDS} moduleId="motivational_balance" />)
    await waitFor(() => expect(mockListEMValues).toHaveBeenCalled())
    expect(screen.getByTestId('value-chip-family')).toBeTruthy()
    expect(screen.getByTestId('value-chip-work')).toBeTruthy()
  })

  it('limite la sélection à max_values', async () => {
    render(<WeightedBalanceLayout fields={FIELDS} moduleId="motivational_balance" />)
    await waitFor(() => expect(mockListEMValues).toHaveBeenCalled())
    fireEvent.press(screen.getByTestId('value-chip-family'))
    fireEvent.press(screen.getByTestId('value-chip-health'))
    fireEvent.press(screen.getByTestId('value-chip-work')) // au-delà du max → ignoré
    fireEvent.press(screen.getByTestId('values-save-btn'))
    await waitFor(() => expect(mockSaveEMValues).toHaveBeenCalledWith(['family', 'health']))
  })

  it('ajoute une raison Pour via saveEMBalanceItem', async () => {
    render(<WeightedBalanceLayout fields={FIELDS} moduleId="motivational_balance" />)
    await waitFor(() => expect(mockListEMBalanceItems).toHaveBeenCalled())
    fireEvent.changeText(screen.getByTestId('balance-for-input'), 'Me sentir mieux')
    fireEvent.press(screen.getByTestId('balance-for-add'))
    await waitFor(() => expect(mockSaveEMBalanceItem).toHaveBeenCalledWith(
      expect.objectContaining({ side: 'for', text: 'Me sentir mieux', weight: 1 })
    ))
  })

  it('n\'ajoute pas une raison vide', async () => {
    render(<WeightedBalanceLayout fields={FIELDS} moduleId="motivational_balance" />)
    await waitFor(() => expect(mockListEMBalanceItems).toHaveBeenCalled())
    fireEvent.press(screen.getByTestId('balance-against-add'))
    expect(mockSaveEMBalanceItem).not.toHaveBeenCalled()
  })

  it('met à jour le poids d\'un item', async () => {
    mockListEMBalanceItems.mockResolvedValue([
      { id: 'i1', behavior_target: '', side: 'for', text: 'Raison', weight: 1, sort_order: 0,
        created_at: '2026-06-20T10:00:00Z' },
    ])
    render(<WeightedBalanceLayout fields={FIELDS} moduleId="motivational_balance" />)
    await waitFor(() => expect(screen.getByTestId('weight-i1-3')).toBeTruthy())
    fireEvent.press(screen.getByTestId('weight-i1-3'))
    await waitFor(() => expect(mockSaveEMBalanceItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'i1', weight: 3 })
    ))
  })
})
