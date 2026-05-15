import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StarsWidget } from './StarsWidget'

describe('StarsWidget', () => {
  it("rend le bon nombre d'étoiles SVG (5)", () => {
    const { container } = render(<StarsWidget spec="stars:5" />)
    expect(container.querySelectorAll('.fw-stars svg').length).toBe(5)
  })

  it("rend le bon nombre d'étoiles SVG (3)", () => {
    const { container } = render(<StarsWidget spec="stars:3" />)
    expect(container.querySelectorAll('.fw-stars svg').length).toBe(3)
  })

  it('toutes les étoiles sont éteintes par défaut', () => {
    const { container } = render(<StarsWidget spec="stars:5" />)
    expect(container.querySelectorAll('.fw-star--on').length).toBe(0)
    expect(container.querySelectorAll('.fw-star--off').length).toBe(5)
  })

  it('porte la classe fw-stars', () => {
    const { container } = render(<StarsWidget spec="stars:5" />)
    expect(container.querySelector('.fw-stars')).toBeTruthy()
  })
})
