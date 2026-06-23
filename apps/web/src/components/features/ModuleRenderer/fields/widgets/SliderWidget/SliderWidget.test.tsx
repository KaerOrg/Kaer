import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SliderWidget } from './SliderWidget'

describe('SliderWidget', () => {
  it('rend un input[type=range]', () => {
    const { container } = render(<SliderWidget min={0} max={10} />)
    expect(container.querySelector('input[type="range"]')).toBeTruthy()
  })

  it('est interactif (non désactivé)', () => {
    const { container } = render(<SliderWidget min={0} max={10} />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.disabled).toBe(false)
  })

  it('applique min et max', () => {
    const { container } = render(<SliderWidget min={0} max={120} unit="min" />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.min).toBe('0')
    expect(input.max).toBe('120')
  })

  it('affiche la valeur médiane calculée', () => {
    const { container } = render(<SliderWidget min={0} max={10} />)
    expect(container.querySelector('.fw-slider__val')?.textContent).toBe('5')
  })

  it("affiche l'unité quand elle est fournie", () => {
    const { container } = render(<SliderWidget min={0} max={120} unit="min" />)
    expect(container.querySelector('.fw-slider__val')?.textContent).toContain('min')
  })

  it("n'affiche pas d'unité quand elle est absente", () => {
    const { container } = render(<SliderWidget min={0} max={3} />)
    const val = container.querySelector('.fw-slider__val')?.textContent ?? ''
    expect(val.includes('min')).toBe(false)
  })

  it('valeur médiane arrondie correctement (0–3 → 2)', () => {
    const { container } = render(<SliderWidget min={0} max={3} />)
    expect(container.querySelector('.fw-slider__val')?.textContent).toBe('2')
  })

  it('valeur médiane (1–10 → 6)', () => {
    const { container } = render(<SliderWidget min={1} max={10} />)
    expect(container.querySelector('.fw-slider__val')?.textContent).toBe('6')
  })
})
