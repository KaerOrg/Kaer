import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('affiche le label', () => {
    render(<StatusBadge label="Actif" />)
    expect(screen.getByText('Actif')).toBeInTheDocument()
  })

  it('affiche la valeur si fournie', () => {
    render(<StatusBadge label="Score" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it("n'affiche pas la valeur si absente", () => {
    render(<StatusBadge label="L" />)
    expect(document.querySelector('.status-badge__value')).toBeNull()
  })

  it('applique la classe de variante', () => {
    const { container } = render(<StatusBadge label="L" variant="danger" />)
    expect(container.firstChild).toHaveClass('status-badge--danger')
  })

  it('utilise la variante neutral par défaut', () => {
    const { container } = render(<StatusBadge label="L" />)
    expect(container.firstChild).toHaveClass('status-badge--neutral')
  })

  it("affiche l'icône si fournie", () => {
    render(<StatusBadge label="L" icon="⚠️" />)
    expect(screen.getByText('⚠️')).toBeInTheDocument()
  })
})
