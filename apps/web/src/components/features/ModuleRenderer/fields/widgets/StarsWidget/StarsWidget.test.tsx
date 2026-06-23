import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StarsWidget } from './StarsWidget'

describe('StarsWidget', () => {
  it("rend le bon nombre d'étoiles SVG (5)", () => {
    const { container } = render(<StarsWidget count={5} />)
    expect(container.querySelectorAll('.rating-selector__icon svg').length).toBe(5)
  })

  it("rend le bon nombre d'étoiles SVG (3)", () => {
    const { container } = render(<StarsWidget count={3} />)
    expect(container.querySelectorAll('.rating-selector__icon svg').length).toBe(3)
  })

  it('rendu lecture seule : aucun bouton interactif', () => {
    const { container } = render(<StarsWidget count={5} />)
    expect(container.querySelectorAll('button').length).toBe(0)
    expect(container.querySelectorAll('.rating-selector__icon').length).toBe(5)
  })

  it('count=5 → la moitié (3) des étoiles sont remplies', () => {
    const { container } = render(<StarsWidget count={5} />)
    // ceil(5/2)=3 remplies (fill=currentColor), 2 vides (fill=none)
    expect(container.querySelectorAll('.rating-selector__icon svg[fill="currentColor"]').length).toBe(3)
    expect(container.querySelectorAll('.rating-selector__icon svg[fill="none"]').length).toBe(2)
  })
})
