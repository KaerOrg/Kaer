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

  it('rend un <input> par défaut (non multiline)', () => {
    render(<InputField label="Nom" />)
    expect(screen.getByRole('textbox').tagName).toBe('INPUT')
  })

  it('rend un <textarea> quand multiline', () => {
    render(<InputField label="Note" multiline />)
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA')
  })

  it('forwarde les attributs textarea (rows, maxLength) en multiline', () => {
    render(<InputField label="Note" multiline rows={4} maxLength={500} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '4')
    expect(textarea).toHaveAttribute('maxlength', '500')
  })

  it('associe le label au textarea et accepte la saisie en multiline', async () => {
    render(<InputField label="Note" multiline />)
    const textarea = screen.getByLabelText('Note')
    await userEvent.type(textarea, 'Bonjour')
    expect(textarea).toHaveValue('Bonjour')
  })

  it("applique la classe d'erreur sur le textarea en multiline", () => {
    render(<InputField label="Note" multiline error="Erreur" />)
    expect(screen.getByRole('textbox')).toHaveClass('input-field__input--error')
  })
})
