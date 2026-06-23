import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FieldWidget } from '../FieldWidget'

describe('FieldWidget', () => {
  it('time → input[type=time] interactif', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'time' }} />)
    const input = container.querySelector('input[type="time"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.disabled).toBe(false)
  })

  it('slider (props frères min/max/unit) → input[type=range] min=0 max=120 + unité', () => {
    const { container } = render(
      <FieldWidget props={{ widget_type: 'slider', slider_min: '0', slider_max: '120', slider_unit: 'min' }} />
    )
    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.min).toBe('0')
    expect(input.max).toBe('120')
    expect(container.querySelector('.fw-slider__val')?.textContent).toContain('min')
  })

  it('slider sans unité → pas de suffixe d\'unité', () => {
    const { container } = render(
      <FieldWidget props={{ widget_type: 'slider', slider_min: '0', slider_max: '10' }} />
    )
    const val = container.querySelector('.fw-slider__val')?.textContent ?? ''
    expect(val.includes('min')).toBe(false)
  })

  it('stars (stars_count=5) → 5 éléments svg', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'stars', stars_count: '5' }} />)
    expect(container.querySelectorAll('.rating-selector__icon svg').length).toBe(5)
  })

  it('stars sans stars_count → défaut 5', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'stars' }} />)
    expect(container.querySelectorAll('.rating-selector__icon svg').length).toBe(5)
  })

  it('boolean → deux options Non / Oui', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'boolean' }} />)
    const options = container.querySelectorAll('.fw-boolean__option')
    expect(options.length).toBe(2)
    expect(options[0].textContent).toBe('Non')
    expect(options[1].textContent).toBe('Oui')
  })

  it('radio (radio_variant=ok) → pastille verte "Pris"', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'radio', radio_variant: 'ok' }} />)
    const el = container.querySelector('.fw-radio--ok')
    expect(el).toBeTruthy()
    expect(el?.textContent).toContain('Pris')
  })

  it('radio (radio_variant=miss) → pastille rouge "Non pris"', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'radio', radio_variant: 'miss' }} />)
    expect(container.querySelector('.fw-radio--miss')).toBeTruthy()
  })

  it('radio sans radio_variant → repli sur ok', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'radio' }} />)
    expect(container.querySelector('.fw-radio--ok')).toBeTruthy()
  })

  it('date → input[type=date] interactif', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'date' }} />)
    const input = container.querySelector('input[type="date"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.disabled).toBe(false)
  })

  it('text → div.fw-text', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'text' }} />)
    expect(container.querySelector('.fw-text')).toBeTruthy()
  })

  it('checkbox → checkbox interactif', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'checkbox' }} />)
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input?.disabled).toBe(false)
  })

  it('textarea → div.fw-textarea', () => {
    const { container } = render(<FieldWidget props={{ widget_type: 'textarea' }} />)
    expect(container.querySelector('.fw-textarea')).toBeTruthy()
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
