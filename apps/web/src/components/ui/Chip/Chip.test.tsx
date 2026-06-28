import { render, screen, fireEvent } from '@testing-library/react'
import { Chip } from './Chip'

describe('Chip', () => {
  it('affiche le label', () => {
    render(<Chip label="Sommeil" />)
    expect(screen.getByText('Sommeil')).toBeInTheDocument()
  })

  it('utilise le ton neutral par défaut', () => {
    const { container } = render(<Chip label="L" />)
    expect(container.firstChild).toHaveClass('chip--neutral')
  })

  it('applique la classe de ton', () => {
    const { container } = render(<Chip label="L" tone="info" />)
    expect(container.firstChild).toHaveClass('chip--info')
  })

  it("affiche l'icône si fournie", () => {
    render(<Chip label="L" icon={<span>★</span>} />)
    expect(screen.getByText('★')).toBeInTheDocument()
  })

  it('rend un bouton de suppression et appelle onRemove', () => {
    const onRemove = vi.fn()
    render(<Chip label="ASE" onRemove={onRemove} removeLabel="Retirer ASE" />)
    fireEvent.click(screen.getByLabelText('Retirer ASE'))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('ne rend pas de bouton de suppression sans onRemove', () => {
    const { container } = render(<Chip label="L" />)
    expect(container.querySelector('.chip__remove')).toBeNull()
  })

  it('rend un bouton-bascule sélectionnable avec aria-pressed', () => {
    const onClick = vi.fn()
    render(<Chip label="Important" selectable selected onClick={onClick} />)
    const btn = screen.getByRole('button', { pressed: true })
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(btn).toHaveClass('chip--selected')
  })

  it('reflète aria-pressed=false quand non sélectionné', () => {
    render(<Chip label="Important" selectable selected={false} onClick={vi.fn()} />)
    expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument()
  })

  it('applique l\'accent piloté par la donnée à l\'état sélectionné (hex → bordure + fond translucide)', () => {
    // jsdom normalise les hex en rgb()/rgba().
    render(<Chip label="Joie" selectable selected accentColor="#F59E0B" onClick={vi.fn()} />)
    const btn = screen.getByRole('button', { pressed: true })
    expect(btn.style.borderColor).toBe('rgb(245, 158, 11)')
    expect(btn.style.color).toBe('rgb(245, 158, 11)')
    expect(btn.style.background).toContain('rgba(245, 158, 11')
  })

  it('n\'applique pas l\'accent quand la puce sélectionnable n\'est pas sélectionnée', () => {
    render(<Chip label="Joie" selectable selected={false} accentColor="#F59E0B" onClick={vi.fn()} />)
    const btn = screen.getByRole('button', { pressed: false })
    expect(btn.style.borderColor).toBe('')
    expect(btn.style.background).toBe('')
  })

  it('accent non-hex (token CSS) : bordure + texte sans fond translucide', () => {
    render(<Chip label="Joie" selectable selected accentColor="var(--color-primary)" onClick={vi.fn()} />)
    const btn = screen.getByRole('button', { pressed: true })
    expect(btn.style.borderColor).toBe('var(--color-primary)')
    expect(btn.style.background).toBe('')
  })

  it('rend une puce d\'action (bouton sans aria-pressed) avec onClick hors selectable', () => {
    const onClick = vi.fn()
    const { container } = render(<Chip label="+2" tone="info" onClick={onClick} />)
    const btn = screen.getByRole('button', { name: '+2' })
    expect(btn).toHaveClass('chip--action', 'chip--info')
    expect(btn).not.toHaveAttribute('aria-pressed')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.chip__remove')).toBeNull()
  })

  it('rend une puce icône seule : label en aria-label + tooltip, sans texte visible', () => {
    render(<Chip label="PHQ-9" iconOnly icon={<span data-testid="ic">★</span>} />)
    const chip = screen.getByLabelText('PHQ-9')
    expect(chip).toHaveClass('chip--icon-only')
    expect(chip).toHaveAttribute('title', 'PHQ-9')
    expect(chip).not.toHaveTextContent('PHQ-9')
    expect(screen.getByTestId('ic')).toBeInTheDocument()
  })

  it('priorise la suppression : onRemove + onClick reste une puce non-action', () => {
    const { container } = render(
      <Chip label="ASE" onRemove={vi.fn()} removeLabel="Retirer" onClick={vi.fn()} />
    )
    expect(container.firstChild).not.toHaveClass('chip--action')
    expect(container.querySelector('.chip__remove')).not.toBeNull()
  })
})
