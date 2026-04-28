import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TextareaWidget } from './TextareaWidget'

describe('TextareaWidget', () => {
  it('rend un div.fw-textarea', () => {
    const { container } = render(<TextareaWidget />)
    expect(container.querySelector('.fw-textarea')).toBeTruthy()
  })

  it('ne rend pas de textarea interactif', () => {
    const { container } = render(<TextareaWidget />)
    expect(container.querySelector('textarea')).toBeNull()
  })
})
