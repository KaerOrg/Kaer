import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('affiche le titre et le sous-titre du header', () => {
    render(<Card header={{ title: 'Titre', subtitle: 'Sous-titre' }} />)
    expect(screen.getByText('Titre')).toBeInTheDocument()
    expect(screen.getByText('Sous-titre')).toBeInTheDocument()
  })

  it('affiche les children dans le body', () => {
    render(<Card><p>Contenu</p></Card>)
    expect(screen.getByText('Contenu')).toBeInTheDocument()
  })

  it('affiche les actions', () => {
    render(<Card actions={<button>Action</button>} />)
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('affiche le footer entre le body et les actions', () => {
    const { container } = render(
      <Card footer={<span>Chips</span>} actions={<button>Action</button>}>
        <p>Contenu</p>
      </Card>
    )
    const footer = container.querySelector('.card__footer')
    expect(footer).not.toBeNull()
    expect(footer).toHaveTextContent('Chips')
    // ordre dans le DOM : body → footer → actions
    const sections = Array.from(container.querySelectorAll('.card__body, .card__footer, .card__actions'))
    expect(sections.map(s => s.className)).toEqual(['card__body', 'card__footer', 'card__actions'])
  })

  it("n'affiche pas le footer si absent", () => {
    render(<Card><p>body</p></Card>)
    expect(document.querySelector('.card__footer')).toBeNull()
  })

  it('applique la variante CSS', () => {
    const { container } = render(<Card variant="elevated" />)
    expect(container.firstChild).toHaveClass('card--elevated')
  })

  it('applique le state disabled', () => {
    const { container } = render(<Card state="disabled" />)
    expect(container.firstChild).toHaveClass('card--disabled')
  })

  it("n'affiche pas le header si absent", () => {
    render(<Card><p>body</p></Card>)
    expect(document.querySelector('.card__header')).toBeNull()
  })

  it("n'affiche pas l'icône si absente", () => {
    render(<Card header={{ title: 'T' }} />)
    expect(document.querySelector('.card__icon')).toBeNull()
  })
})
