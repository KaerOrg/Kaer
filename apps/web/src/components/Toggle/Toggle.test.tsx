import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from './Toggle'

// ── Mode visuel (sans label) ──────────────────────────────────────────────────

describe('Toggle — mode visuel (sans label)', () => {
  it('rend un span avec la classe toggle', () => {
    const { container } = render(<Toggle checked={false} />)
    expect(container.querySelector('.toggle')).toBeInTheDocument()
  })

  it('est aria-hidden (décoratif)', () => {
    const { container } = render(<Toggle checked={false} />)
    expect(container.querySelector('.toggle')).toHaveAttribute('aria-hidden', 'true')
  })

  it('n\'a pas la classe toggle--on quand checked=false', () => {
    const { container } = render(<Toggle checked={false} />)
    expect(container.querySelector('.toggle')).not.toHaveClass('toggle--on')
  })

  it('a la classe toggle--on quand checked=true', () => {
    const { container } = render(<Toggle checked={true} />)
    expect(container.querySelector('.toggle')).toHaveClass('toggle--on')
  })

  it('ne rend pas de checkbox', () => {
    render(<Toggle checked={false} />)
    expect(screen.queryByRole('checkbox')).toBeNull()
  })
})

// ── Mode interactif (avec label) ─────────────────────────────────────────────

describe('Toggle — mode interactif (avec label)', () => {
  it('affiche le texte du label', () => {
    render(<Toggle checked={false} label="Mode ado" />)
    expect(screen.getByText('Mode ado')).toBeInTheDocument()
  })

  it('associe le label au checkbox (accessible via getByLabelText)', () => {
    render(<Toggle checked={false} label="Mode ado" onChange={() => {}} />)
    expect(screen.getByLabelText('Mode ado')).toBeInTheDocument()
  })

  it('la checkbox est décochée quand checked=false', () => {
    render(<Toggle checked={false} label="Mode ado" onChange={() => {}} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('la checkbox est cochée quand checked=true', () => {
    render(<Toggle checked={true} label="Mode ado" onChange={() => {}} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('appelle onChange(true) au clic quand décochée', async () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} label="Mode ado" onChange={onChange} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('appelle onChange(false) au clic quand cochée', async () => {
    const onChange = vi.fn()
    render(<Toggle checked={true} label="Mode ado" onChange={onChange} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('n\'appelle pas onChange si onChange est absent (clic sans erreur)', async () => {
    render(<Toggle checked={false} label="Mode ado" />)
    await userEvent.click(screen.getByRole('checkbox'))
  })
})

// ── Désactivé ─────────────────────────────────────────────────────────────────

describe('Toggle — désactivé', () => {
  it('le checkbox est disabled', () => {
    render(<Toggle checked={false} label="Mode ado" onChange={() => {}} disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('applique la classe toggle-field--disabled', () => {
    const { container } = render(
      <Toggle checked={false} label="Mode ado" onChange={() => {}} disabled />,
    )
    expect(container.querySelector('.toggle-field')).toHaveClass('toggle-field--disabled')
  })
})
