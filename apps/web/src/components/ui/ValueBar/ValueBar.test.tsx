import { render, screen } from '@testing-library/react'
import { ValueBar } from './ValueBar'

describe('ValueBar', () => {
  it('affiche le libellé et la valeur', () => {
    render(<ValueBar label="Humeur" value={7} />)
    expect(screen.getByText('Humeur')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('positionne le remplissage selon value dans [min, max]', () => {
    const { container } = render(<ValueBar label="X" value={5} min={1} max={9} />)
    const fill = container.querySelector<HTMLElement>('.value-bar__fill')
    expect(fill?.style.width).toBe('50%') // (5-1)/(9-1) = 0.5
  })

  it('borne le remplissage à 100 % au-dessus de la plage', () => {
    const { container } = render(<ValueBar label="X" value={99} min={1} max={10} />)
    expect(container.querySelector<HTMLElement>('.value-bar__fill')?.style.width).toBe('100%')
  })

  it('borne le remplissage à 0 % en dessous de la plage', () => {
    const { container } = render(<ValueBar label="X" value={-4} min={1} max={10} />)
    expect(container.querySelector<HTMLElement>('.value-bar__fill')?.style.width).toBe('0%')
  })

  it('rend les repères quand fournis, les masque sinon', () => {
    const { container, rerender } = render(<ValueBar label="X" value={5} lowHint="bas" highHint="haut" />)
    expect(container.querySelector('.value-bar__hints')).toBeInTheDocument()
    expect(screen.getByText('bas')).toBeInTheDocument()
    rerender(<ValueBar label="X" value={5} />)
    expect(container.querySelector('.value-bar__hints')).toBeNull()
  })

  it('applique la couleur d’accent sur la pastille', () => {
    const { container } = render(<ValueBar label="X" value={5} color="rgb(255, 0, 0)" />)
    expect(container.querySelector<HTMLElement>('.value-bar__dot')?.style.background).toBe('rgb(255, 0, 0)')
  })
})
