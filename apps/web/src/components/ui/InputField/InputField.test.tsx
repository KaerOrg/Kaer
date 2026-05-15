import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputField } from './InputField'

describe('InputField', () => {
  it('affiche le label', () => {
    render(<InputField label="Email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it("associe le label à l'input via htmlFor", () => {
    render(<InputField label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it("affiche le message d'erreur", () => {
    render(<InputField label="Email" error="Champ requis" />)
    expect(screen.getByText('Champ requis')).toBeInTheDocument()
  })

  it("n'affiche pas l'erreur si absente", () => {
    render(<InputField label="Email" />)
    expect(screen.queryByText('Champ requis')).toBeNull()
  })

  it("applique la classe d'erreur sur l'input", () => {
    render(<InputField label="Email" error="Erreur" />)
    expect(screen.getByRole('textbox')).toHaveClass('input-field__input--error')
  })

  it('accepte la saisie utilisateur', async () => {
    render(<InputField label="Nom" />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'Guillaume')
    expect(input).toHaveValue('Guillaume')
  })

  it("utilise l'id fourni en prop", () => {
    render(<InputField label="Email" id="custom-id" />)
    expect(document.getElementById('custom-id')).toBeInTheDocument()
  })
})
