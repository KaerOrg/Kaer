import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown } from './Dropdown'

function renderSexField(overrides = {}) {
  return render(
    <Dropdown label="Sexe" value="" onChange={() => {}} {...overrides}>
      <option value="">—</option>
      <option value="M">Homme</option>
      <option value="F">Femme</option>
    </Dropdown>,
  )
}

// ── Rendu de base ─────────────────────────────────────────────────────────────

describe('Dropdown — rendu de base', () => {
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

describe('Dropdown — interaction', () => {
  it('appelle onChange à la sélection', async () => {
    const onChange = vi.fn()
    renderSexField({ onChange })
    await userEvent.selectOptions(screen.getByLabelText('Sexe'), 'M')
    expect(onChange).toHaveBeenCalledOnce()
  })
})

// ── Erreur ────────────────────────────────────────────────────────────────────

describe('Dropdown — état erreur', () => {
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

// ── Variante compacte ─────────────────────────────────────────────────────────

describe('Dropdown — variante compacte', () => {
  it('applique la classe compacte avec compact', () => {
    renderSexField({ compact: true })
    expect(screen.getByLabelText('Sexe')).toHaveClass('input-field__input--sm')
  })

  it('n\'applique pas la classe compacte par défaut', () => {
    renderSexField()
    expect(screen.getByLabelText('Sexe')).not.toHaveClass('input-field__input--sm')
  })
})

// ── ID personnalisé ───────────────────────────────────────────────────────────

describe('Dropdown — id personnalisé', () => {
  it('utilise l\'id fourni', () => {
    renderSexField({ id: 'custom-id' })
    expect(document.getElementById('custom-id')).toBeInTheDocument()
  })

  it('génère un id depuis le label si absent', () => {
    renderSexField()
    expect(document.getElementById('sexe')).toBeInTheDocument()
  })
})
