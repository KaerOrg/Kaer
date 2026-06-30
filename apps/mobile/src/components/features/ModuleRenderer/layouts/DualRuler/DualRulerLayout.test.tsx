const mockSaveEMRuler = jest.fn().mockResolvedValue(undefined)
const mockListEMRulers = jest.fn()
const mockDeleteEMRuler = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/motivationalBalanceService', () => ({
  saveEMRuler: (...a: unknown[]) => mockSaveEMRuler(...a),
  listEMRulers: (...a: unknown[]) => mockListEMRulers(...a),
  deleteEMRuler: (...a: unknown[]) => mockDeleteEMRuler(...a),
}))

jest.mock('../../../../../lib/database', () => ({ generateId: () => 'gen-1' }))

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

jest.mock('../../../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: jest.fn() }),
}))

jest.mock('lucide-react-native', () => ({ Trash2: 'Trash2' }))
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { DualRulerLayout } from './DualRulerLayout'

describe('DualRulerLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListEMRulers.mockResolvedValue([])
  })

  it('rend les deux échelles 0-10', async () => {
    render(<DualRulerLayout moduleId="motivational_balance" />)
    await waitFor(() => expect(mockListEMRulers).toHaveBeenCalled())
    expect(screen.getByTestId('importance-pip-0')).toBeTruthy()
    expect(screen.getByTestId('importance-pip-10')).toBeTruthy()
    expect(screen.getByTestId('confidence-pip-5')).toBeTruthy()
  })

  it('enregistre les scores saisis via saveEMRuler', async () => {
    render(<DualRulerLayout moduleId="motivational_balance" />)
    await waitFor(() => expect(mockListEMRulers).toHaveBeenCalled())

    fireEvent.press(screen.getByTestId('importance-pip-7'))
    fireEvent.press(screen.getByTestId('confidence-pip-4'))
    fireEvent.press(screen.getByTestId('rulers-save-btn'))

    await waitFor(() => expect(mockSaveEMRuler).toHaveBeenCalledWith(
      expect.objectContaining({ importance_score: 7, confidence_score: 4, stage: null })
    ))
  })

  it('n\'enregistre rien sans aucun score', async () => {
    render(<DualRulerLayout moduleId="motivational_balance" />)
    await waitFor(() => expect(mockListEMRulers).toHaveBeenCalled())
    fireEvent.press(screen.getByTestId('rulers-save-btn'))
    expect(mockSaveEMRuler).not.toHaveBeenCalled()
  })

  it('affiche l\'historique des thermomètres', async () => {
    mockListEMRulers.mockResolvedValue([
      { id: 'r1', stage: null, behavior_target: 'Arrêter', importance_score: 8, importance_why: null,
        confidence_score: 6, confidence_why: null, commitment_text: 'Je commence demain',
        created_at: '2026-06-20T10:00:00Z' },
    ])
    render(<DualRulerLayout moduleId="motivational_balance" />)
    await waitFor(() => expect(screen.getByTestId('ruler-delete-r1')).toBeTruthy())
  })
})
