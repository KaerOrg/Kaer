import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FieldWidget } from '../FieldWidget'

describe('FieldWidget', () => {
  it('text → div.fw-text', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'text' }} />)
    expect(container.querySelector('.fw-text')).toBeTruthy()
  })

  it('info → affiche le texte détail fourni', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'info' }} detailText="Texte info" />)
    expect(container.querySelector('.fw-info')?.textContent).toContain('Texte info')
  })

  it('type inconnu → ne rend rien', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'unknown_type' }} />)
    expect(container.firstChild).toBeNull()
  })
})
