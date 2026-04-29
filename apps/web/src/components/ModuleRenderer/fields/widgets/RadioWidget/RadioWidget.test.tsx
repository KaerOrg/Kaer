import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RadioWidget } from './RadioWidget'

describe('RadioWidget', () => {
  it('ok → pastille verte avec le texte "Pris"', () => {
    const { container } = render(<RadioWidget variant="ok" />)
    const el = container.querySelector('.fw-radio--ok')
    expect(el).toBeTruthy()
    expect(el?.textContent).toContain('Pris')
  })

  it('partial → pastille orange avec le texte "Partiel"', () => {
    const { container } = render(<RadioWidget variant="partial" />)
    const el = container.querySelector('.fw-radio--partial')
    expect(el).toBeTruthy()
    expect(el?.textContent).toContain('Partiel')
  })

  it('miss → pastille rouge avec le texte "Non pris"', () => {
    const { container } = render(<RadioWidget variant="miss" />)
    const el = container.querySelector('.fw-radio--miss')
    expect(el).toBeTruthy()
    expect(el?.textContent).toContain('Non pris')
  })

  it('variante inconnue → repli sur ok', () => {
    const { container } = render(<RadioWidget variant="inconnu" />)
    expect(container.querySelector('.fw-radio--ok')).toBeTruthy()
  })

  it('porte la classe fw-radio', () => {
    const { container } = render(<RadioWidget variant="ok" />)
    expect(container.querySelector('.fw-radio')).toBeTruthy()
  })
})
