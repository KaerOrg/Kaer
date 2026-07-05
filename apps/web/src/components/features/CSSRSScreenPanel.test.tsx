import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithClient } from '../../test/renderWithClient'
import { CSSRSScreenPanel } from './CSSRSScreenPanel'

const mockFetch = vi.fn()
const mockSave = vi.fn()
const mockDelete = vi.fn()
vi.mock('@services/cssrsService', () => ({
  fetchCSSRSAssessments: (...a: unknown[]) => mockFetch(...a),
  saveCSSRSAssessment: (...a: unknown[]) => mockSave(...a),
  deleteCSSRSAssessment: (...a: unknown[]) => mockDelete(...a),
}))

beforeEach(() => vi.clearAllMocks())

describe('CSSRSScreenPanel — couche données', () => {
  it('fetche les évaluations au montage avec (patient, praticien)', async () => {
    mockFetch.mockResolvedValue([])
    renderWithClient(<CSSRSScreenPanel patientId="pt1" practitionerId="pr1" />)

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('pt1', 'pr1'))
  })

  it('affiche l\'état vide quand aucune évaluation', async () => {
    mockFetch.mockResolvedValue([])
    renderWithClient(<CSSRSScreenPanel patientId="pt1" practitionerId="pr1" />)

    expect(await screen.findByText(/aucune évaluation/i)).toBeInTheDocument()
  })
})
