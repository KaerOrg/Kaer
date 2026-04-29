import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectField } from './SelectField'

function renderSexField(overrides = {}) {
  return render(
    <SelectField label="Sexe" value="" onChange={() => {}} {...overrides}>
      <option value="">—</option>
      <option value="M">Homme</option>
      <option value="F">Femme</option>
    </SelectField>,
  )
}

// ── Rendu de base ─────────────────────────────────────────────────────────────

describe('SelectField — rendu de base', () => {
  it('affiche le label', () => {
    renderSexField()
    expect(screen.getByText('Sexe')).toBeInTheDocument()
  })

  it('associe le label au select via htmlFor', () => {
    renderSexField()
    expect(screen.getByLabelText('Sexe')).toBeInTheDocument()
  })

  it('rend les options enfants', () => {
    renderSexField()
    expect(screen.getByRole('option', { name: 'Homme' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Femme' })).toBeInTheDocument()
  })

  it('applique la valeur courante', () => {
    renderSexField({ value: 'F' })
    expect(screen.getByLabelText('Sexe')).toHaveValue('F')
  })
})

// ── Interaction ───────────────────────────────────────────────────────────────

describe('SelectField — interaction', () => {
  it('appelle onChange à la sélection', async () => {
    const onChange = vi.fn()
    renderSexField({ onChange })
    await userEvent.selectOptions(screen.getByLabelText('Sexe'), 'M')
    expect(onChange).toHaveBeenCalledOnce()
  })
})

// ── Erreur ────────────────────────────────────────────────────────────────────

describe('SelectField — état erreur', () => {
  it('affiche le message d\'erreur', () => {
    renderSexField({ error: 'Champ requis' })
    expect(screen.getByText('Champ requis')).toBeInTheDocument()
  })

  it('n\'affiche pas d\'erreur si la prop est absente', () => {
    renderSexField()
    expect(screen.queryByText('Champ requis')).toBeNull()
  })

  it('applique la classe d\'erreur sur le select', () => {
    renderSexField({ error: 'Erreur' })
    expect(screen.getByLabelText('Sexe')).toHaveClass('input-field__input--error')
  })

  it('n\'applique pas la classe d\'erreur sans erreur', () => {
    renderSexField()
    expect(screen.getByLabelText('Sexe')).not.toHaveClass('input-field__input--error')
  })
})

// ── ID personnalisé ───────────────────────────────────────────────────────────

describe('SelectField — id personnalisé', () => {
  it('utilise l\'id fourni', () => {
    renderSexField({ id: 'custom-id' })
    expect(document.getElementById('custom-id')).toBeInTheDocument()
  })

  it('génère un id depuis le label si absent', () => {
    renderSexField()
    expect(document.getElementById('sexe')).toBeInTheDocument()
  })
})
