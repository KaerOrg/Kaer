import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DateWidget } from './DateWidget'

describe('DateWidget', () => {
  it('rend un input[type=date]', () => {
    const { container } = render(<DateWidget />)
    expect(container.querySelector('input[type="date"]')).toBeTruthy()
  })

  it('est interactif (non désactivé)', () => {
    const { container } = render(<DateWidget />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.disabled).toBe(false)
  })

  it('porte la classe fw-date', () => {
    const { container } = render(<DateWidget />)
    expect(container.querySelector('.fw-date')).toBeTruthy()
  })
})
