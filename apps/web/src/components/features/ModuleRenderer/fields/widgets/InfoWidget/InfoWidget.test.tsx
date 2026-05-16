import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { InfoWidget } from './InfoWidget'

describe('InfoWidget', () => {
  it('rend un span.fw-info', () => {
    const { container } = render(<InfoWidget />)
    expect(container.querySelector('.fw-info')).toBeTruthy()
  })

  it('affiche le texte fourni', () => {
    const { container } = render(<InfoWidget text="Détail de technique" />)
    expect(container.querySelector('.fw-info')?.textContent).toContain('Détail de technique')
  })

  it('sans texte ne plante pas', () => {
    const { container } = render(<InfoWidget />)
    expect(container.querySelector('.fw-info')).toBeTruthy()
  })

  it('contient une icône SVG', () => {
    const { container } = render(<InfoWidget />)
    expect(container.querySelector('.fw-info svg')).toBeTruthy()
  })
})
