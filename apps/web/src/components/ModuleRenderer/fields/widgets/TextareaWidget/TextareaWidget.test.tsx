import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TextareaWidget } from './TextareaWidget'

describe('TextareaWidget', () => {
  it('rend un textarea.fw-textarea interactif', () => {
    const { container } = render(<TextareaWidget />)
    const el = container.querySelector('textarea.fw-textarea')
    expect(el).toBeTruthy()
    expect((el as HTMLTextAreaElement).disabled).toBe(false)
  })
})
