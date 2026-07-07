import { render, screen } from '@testing-library/react'
import { ModuleCard } from './ModuleCard'

describe('ModuleCard', () => {
  it('affiche le titre, la description, les tags et les actions', () => {
    render(
      <ModuleCard
        title="Journal du sommeil"
        description="Suivi des nuits"
        tags={<span>chips</span>}
        actions={<button>Aperçu</button>}
      />,
    )
    expect(screen.getByText('Journal du sommeil')).toBeInTheDocument()
    expect(screen.getByText('Suivi des nuits')).toBeInTheDocument()
    expect(screen.getByText('chips')).toBeInTheDocument()
    expect(screen.getByText('Aperçu')).toBeInTheDocument()
  })

  it('rend la description en tête du body avec la classe partagée', () => {
    const { container } = render(<ModuleCard title="X" description="desc" />)
    const desc = container.querySelector('.module-card__description')
    expect(desc).not.toBeNull()
    expect(desc).toHaveTextContent('desc')
  })

  it('n’affiche pas de paragraphe de description quand elle est absente', () => {
    render(<ModuleCard title="X" />)
    expect(document.querySelector('.module-card__description')).toBeNull()
  })

  it('rend le contrôle headerRight dans le header', () => {
    render(<ModuleCard title="X" headerRight={<button>toggle</button>} />)
    expect(screen.getByText('toggle')).toBeInTheDocument()
  })

  it('applique toujours module-card-item et les classes additionnelles', () => {
    const { container } = render(<ModuleCard title="X" className="catalog-card--disabled" />)
    const card = container.querySelector('.card')
    expect(card).toHaveClass('module-card-item')
    expect(card).toHaveClass('catalog-card--disabled')
  })

  it('rend les children additionnels sous la description', () => {
    render(
      <ModuleCard title="X" description="desc">
        <div className="module-card__date">Déverrouillé le…</div>
      </ModuleCard>,
    )
    expect(screen.getByText('Déverrouillé le…')).toBeInTheDocument()
  })
})
