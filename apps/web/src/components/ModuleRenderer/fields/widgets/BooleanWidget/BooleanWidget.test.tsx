import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BooleanWidget } from './BooleanWidget'

describe('BooleanWidget', () => {
  it('rend deux options', () => {
    const { container } = render(<BooleanWidget />)
    expect(container.querySelectorAll('.fw-boolean__option').length).toBe(2)
  })

  it('la première option est "Non"', () => {
    const { container } = render(<BooleanWidget />)
    expect(container.querySelectorAll('.fw-boolean__option')[0].textContent).toBe('Non')
  })

  it('la seconde option est "Oui"', () => {
    const { container } = render(<BooleanWidget />)
    expect(container.querySelectorAll('.fw-boolean__option')[1].textContent).toBe('Oui')
  })

  it('"Non" porte la classe active', () => {
    const { container } = render(<BooleanWidget />)
    expect(container.querySelectorAll('.fw-boolean__option')[0].classList.contains('fw-boolean__option--active')).toBe(true)
  })

  it('"Oui" ne porte pas la classe active', () => {
    const { container } = render(<BooleanWidget />)
    expect(container.querySelectorAll('.fw-boolean__option')[1].classList.contains('fw-boolean__option--active')).toBe(false)
  })
})
