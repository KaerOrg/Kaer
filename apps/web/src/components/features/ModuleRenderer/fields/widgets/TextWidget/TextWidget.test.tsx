import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TextWidget } from './TextWidget'

describe('TextWidget', () => {
  it('rend un input.fw-text interactif', () => {
    const { container } = render(<TextWidget />)
    const el = container.querySelector('input.fw-text')
    expect(el).toBeTruthy()
    expect((el as HTMLInputElement).disabled).toBe(false)
  })
})
