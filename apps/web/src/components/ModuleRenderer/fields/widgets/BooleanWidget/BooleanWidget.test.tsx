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

  it('aucune option n\'est active par défaut', () => {
    const { container } = render(<BooleanWidget />)
    expect(container.querySelectorAll('.fw-boolean__option--active').length).toBe(0)
  })

  it('les options sont des boutons interactifs', () => {
    const { container } = render(<BooleanWidget />)
    const buttons = container.querySelectorAll('button.fw-boolean__option')
    expect(buttons.length).toBe(2)
  })
})
