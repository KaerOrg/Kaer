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
})
