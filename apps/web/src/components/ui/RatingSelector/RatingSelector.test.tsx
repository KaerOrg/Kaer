import { render, screen, fireEvent } from '@testing-library/react'
import { RatingSelector } from './RatingSelector'

const STEPS = [1, 2, 3, 4, 5]

describe('RatingSelector', () => {
  describe('en-tête', () => {
    it('affiche label, sublabel et valeur avec suffixe', () => {
      render(<RatingSelector label="Humeur" sublabel="0 = bas" value={7} valueSuffix="/10" steps={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} />)
      expect(screen.getByText('Humeur')).toBeInTheDocument()
      expect(screen.getByText('0 = bas')).toBeInTheDocument()
      expect(screen.getByText('7/10')).toBeInTheDocument()
    })

    it('masque l’en-tête quand showHeader=false', () => {
      render(<RatingSelector label="X" value={3} steps={STEPS} showHeader={false} />)
      expect(screen.queryByText('X')).toBeNull()
    })
  })

  describe('variante numbered', () => {
    it('rend un pas par valeur et marque le sélectionné', () => {
      render(<RatingSelector label="X" value={3} steps={STEPS} testIdPrefix="num" />)
      STEPS.forEach(n => expect(screen.getByTestId(`num-${n}`)).toBeInTheDocument())
      expect(screen.getByTestId('num-3').className).toContain('rating-selector__step--selected')
      expect(screen.getByTestId('num-2').className).not.toContain('--selected')
    })

    it('appelle onChange au clic et rend des boutons radio quand interactif', () => {
      const onChange = vi.fn()
      render(<RatingSelector label="X" value={null} steps={STEPS} onChange={onChange} testIdPrefix="num" />)
      const step = screen.getByTestId('num-4')
      expect(step.tagName).toBe('BUTTON')
      expect(step).toHaveAttribute('role', 'radio')
      fireEvent.click(step)
      expect(onChange).toHaveBeenCalledWith(4)
    })

    it('rend des span non cliquables sans onChange (lecture seule)', () => {
      render(<RatingSelector label="X" value={2} steps={STEPS} testIdPrefix="num" />)
      expect(screen.getByTestId('num-2').tagName).toBe('SPAN')
    })
  })

  describe('variante track', () => {
    it('remplit tous les segments jusqu’à la valeur', () => {
      render(<RatingSelector variant="track" label="X" value={3} steps={STEPS} testIdPrefix="trk" />)
      expect(screen.getByTestId('trk-1').className).toContain('--filled')
      expect(screen.getByTestId('trk-3').className).toContain('--filled')
      expect(screen.getByTestId('trk-4').className).not.toContain('--filled')
    })
  })

  describe('variante icon', () => {
    it('rend une icône par pas', () => {
      const { container } = render(<RatingSelector variant="icon" label="Qualité" value={2} steps={[1, 2, 3]} />)
      expect(container.querySelectorAll('.rating-selector__icon')).toHaveLength(3)
    })
  })

  describe('variante bar', () => {
    it('positionne le remplissage selon value dans [min, max]', () => {
      const { container } = render(<RatingSelector variant="bar" label="X" value={5} min={1} max={9} />)
      const fill = container.querySelector<HTMLElement>('.rating-selector__bar-fill')
      expect(fill?.style.width).toBe('50%') // (5-1)/(9-1)
    })

    it('borne à 100 % au-dessus et 0 % en dessous de la plage', () => {
      const { container, rerender } = render(<RatingSelector variant="bar" label="X" value={99} min={1} max={10} />)
      expect(container.querySelector<HTMLElement>('.rating-selector__bar-fill')?.style.width).toBe('100%')
      rerender(<RatingSelector variant="bar" label="X" value={-4} min={1} max={10} />)
      expect(container.querySelector<HTMLElement>('.rating-selector__bar-fill')?.style.width).toBe('0%')
    })

    it('rend les trois repères (low/mid/high) quand fournis', () => {
      render(<RatingSelector variant="bar" label="X" value={5} lowHint="bas" midHint="moyen" highHint="haut" />)
      expect(screen.getByText('bas')).toBeInTheDocument()
      expect(screen.getByText('moyen')).toBeInTheDocument()
      expect(screen.getByText('haut')).toBeInTheDocument()
    })

    it('disposition inline : label, jauge et valeur sans en-tête ni pouce', () => {
      const { container } = render(<RatingSelector variant="bar" label="Pic" value={60} min={0} max={100} layout="inline" />)
      expect(container.querySelector('.rating-selector--bar-inline')).toBeInTheDocument()
      expect(container.querySelector('.rating-selector__bar-thumb')).toBeNull()
      expect(screen.getByText('Pic')).toBeInTheDocument()
      expect(screen.getByText('60')).toBeInTheDocument()
    })
  })

  it('applique la couleur d’accent sur la pastille de l’en-tête', () => {
    const { container } = render(<RatingSelector label="X" value={5} steps={STEPS} color="rgb(255, 0, 0)" />)
    expect(container.querySelector<HTMLElement>('.rating-selector__dot')?.style.background).toBe('rgb(255, 0, 0)')
  })
})
