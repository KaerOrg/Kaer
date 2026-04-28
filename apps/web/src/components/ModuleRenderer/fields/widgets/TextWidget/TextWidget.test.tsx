import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TextWidget } from './TextWidget'

describe('TextWidget', () => {
  it('rend un div.fw-text', () => {
    const { container } = render(<TextWidget />)
    expect(container.querySelector('.fw-text')).toBeTruthy()
  })

  it("ne rend pas d'input interactif", () => {
    const { container } = render(<TextWidget />)
    expect(container.querySelector('input')).toBeNull()
  })
})
