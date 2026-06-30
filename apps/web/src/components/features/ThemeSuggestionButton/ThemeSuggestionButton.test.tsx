import { vi, beforeEach, describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSuggestionButton } from './ThemeSuggestionButton'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSubmit = vi.fn()
vi.mock('@services/themeSuggestionService', () => ({
  submitThemeSuggestion: (suggestion: string) => mockSubmit(suggestion),
  THEME_SUGGESTION_MAX: 1000,
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ThemeSuggestionButton', () => {
  it('rend le bouton déclencheur, modale fermée par défaut', () => {
    render(<ThemeSuggestionButton />)
    expect(screen.getByRole('button', { name: /suggérer/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('ouvre la modale avec un textarea au clic', async () => {
    render(<ThemeSuggestionButton />)
    await userEvent.click(screen.getByRole('button', { name: /suggérer/i }))
    const field = screen.getByRole('textbox')
    expect(field.tagName).toBe('TEXTAREA')
  })

  it('désactive le bouton Envoyer tant que le champ est vide', async () => {
    render(<ThemeSuggestionButton />)
    await userEvent.click(screen.getByRole('button', { name: /suggérer/i }))
    expect(screen.getByRole('button', { name: /envoyer/i })).toBeDisabled()
  })

  it('soumet la suggestion (texte trimmé) et affiche un toast de succès', async () => {
    mockSubmit.mockResolvedValue({ ok: true })
    render(<ThemeSuggestionButton />)
    await userEvent.click(screen.getByRole('button', { name: /suggérer/i }))
    await userEvent.type(screen.getByRole('textbox'), '  gérer le stress  ')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith('gérer le stress'))
    expect(mockToastSuccess).toHaveBeenCalledTimes(1)
    expect(mockToastError).not.toHaveBeenCalled()
    // Succès → la modale se ferme.
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull())
  })

  it('affiche un toast d’erreur si la soumission échoue', async () => {
    mockSubmit.mockResolvedValue({ ok: false })
    render(<ThemeSuggestionButton />)
    await userEvent.click(screen.getByRole('button', { name: /suggérer/i }))
    await userEvent.type(screen.getByRole('textbox'), 'sujet x')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1))
    expect(mockToastSuccess).not.toHaveBeenCalled()
    // Échec → la modale reste ouverte.
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
