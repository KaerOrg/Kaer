import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TimeWidget } from './TimeWidget'

describe('TimeWidget', () => {
  it('rend un input[type=time]', () => {
    const { container } = render(<TimeWidget />)
    expect(container.querySelector('input[type="time"]')).toBeTruthy()
  })

  it('est interactif (non désactivé)', () => {
    const { container } = render(<TimeWidget />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.disabled).toBe(false)
  })

  it('a une valeur par défaut visible', () => {
    const { container } = render(<TimeWidget />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.defaultValue).toBe('22:00')
  })

  it('porte la classe fw-time', () => {
    const { container } = render(<TimeWidget />)
    expect(container.querySelector('.fw-time')).toBeTruthy()
  })
})
