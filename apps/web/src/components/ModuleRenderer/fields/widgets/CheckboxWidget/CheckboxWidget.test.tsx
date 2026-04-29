import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CheckboxWidget } from './CheckboxWidget'

describe('CheckboxWidget', () => {
  it('rend un input[type=checkbox]', () => {
    const { container } = render(<CheckboxWidget />)
    expect(container.querySelector('input[type="checkbox"]')).toBeTruthy()
  })

  it('est désactivé', () => {
    const { container } = render(<CheckboxWidget />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it("n'est pas coché par défaut", () => {
    const { container } = render(<CheckboxWidget />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.checked).toBe(false)
  })

  it('affiche le libellé "Non accompli"', () => {
    const { container } = render(<CheckboxWidget />)
    expect(container.querySelector('.fw-checkbox__label')?.textContent).toBe('Non accompli')
  })
})
