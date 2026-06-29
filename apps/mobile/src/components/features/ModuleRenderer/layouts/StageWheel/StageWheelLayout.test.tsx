const mockSaveEMRuler = jest.fn().mockResolvedValue(undefined)
const mockListEMRulers = jest.fn()
const mockDeleteEMRuler = jest.fn().mockResolvedValue(undefined)
jest.mock('../../../../../services/motivationalBalanceService', () => ({
  saveEMRuler: (...a: unknown[]) => mockSaveEMRuler(...a),
  listEMRulers: (...a: unknown[]) => mockListEMRulers(...a),
  deleteEMRuler: (...a: unknown[]) => mockDeleteEMRuler(...a),
}))

jest.mock('../../../../../lib/database', () => ({ generateId: () => 'gen-1' }))

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

const mockShowConfirm = jest.fn()
jest.mock('../../../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: mockShowConfirm }),
}))

jest.mock('lucide-react-native', () => ({ Trash2: 'Trash2' }))
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { StageWheelLayout } from './StageWheelLayout'

describe('StageWheelLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListEMRulers.mockResolvedValue([])
  })

  it('rend 6 cartes de stade par défaut', async () => {
    render(<StageWheelLayout moduleId="motivational_balance" />)
    await waitFor(() => expect(mockListEMRulers).toHaveBeenCalled())
    expect(screen.getByTestId('stage-card-1')).toBeTruthy()
    expect(screen.getByTestId('stage-card-6')).toBeTruthy()
    expect(screen.queryByTestId('stage-card-7')).toBeNull()
  })

  it('respecte stageCount', async () => {
    render(<StageWheelLayout moduleId="m" stageCount={3} />)
    await waitFor(() => expect(mockListEMRulers).toHaveBeenCalled())
    expect(screen.getByTestId('stage-card-3')).toBeTruthy()
    expect(screen.queryByTestId('stage-card-4')).toBeNull()
  })

  it('enregistre le stade sélectionné via saveEMRuler', async () => {
    render(<StageWheelLayout moduleId="motivational_balance" />)
    await waitFor(() => expect(mockListEMRulers).toHaveBeenCalled())

    fireEvent.press(screen.getByTestId('stage-card-2'))
    fireEvent.press(screen.getByTestId('stage-save-btn'))

    await waitFor(() => expect(mockSaveEMRuler).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'gen-1', stage: 2, importance_score: null })
    ))
  })

  it('affiche l\'historique des stades', async () => {
    mockListEMRulers.mockResolvedValue([
      { id: 'r1', stage: 3, behavior_target: null, importance_score: null, importance_why: null,
        confidence_score: null, confidence_why: null, commitment_text: null, created_at: '2026-06-20T10:00:00Z' },
    ])
    render(<StageWheelLayout moduleId="motivational_balance" />)
    await waitFor(() => expect(screen.getByTestId('stage-delete-r1')).toBeTruthy())
  })

  it('demande confirmation avant suppression', async () => {
    mockListEMRulers.mockResolvedValue([
      { id: 'r1', stage: 3, behavior_target: null, importance_score: null, importance_why: null,
        confidence_score: null, confidence_why: null, commitment_text: null, created_at: '2026-06-20T10:00:00Z' },
    ])
    render(<StageWheelLayout moduleId="motivational_balance" />)
    await waitFor(() => expect(screen.getByTestId('stage-delete-r1')).toBeTruthy())
    fireEvent.press(screen.getByTestId('stage-delete-r1'))
    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ destructive: true })
    )
  })
})
