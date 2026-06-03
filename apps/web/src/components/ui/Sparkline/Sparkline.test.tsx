import { render } from '@testing-library/react'
import { Sparkline } from './Sparkline'

describe('Sparkline', () => {
  it('rend une polyline avec un point par valeur', () => {
    const { container } = render(<Sparkline values={[1, 5, 10]} />)
    const poly = container.querySelector('polyline')
    expect(poly).toBeInTheDocument()
    expect(poly?.getAttribute('points')?.trim().split(' ')).toHaveLength(3)
  })

  it('applique la couleur de trait', () => {
    const { container } = render(<Sparkline values={[1, 2]} color="rgb(0, 128, 0)" />)
    expect(container.querySelector('polyline')?.getAttribute('stroke')).toBe('rgb(0, 128, 0)')
  })

  it('ajoute la className fournie', () => {
    const { container } = render(<Sparkline values={[1, 2]} className="sd-history__spark" />)
    expect(container.querySelector('svg')?.classList.contains('sd-history__spark')).toBe(true)
  })

  it('ne rend rien avec moins de 2 points', () => {
    const { container } = render(<Sparkline values={[5]} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
