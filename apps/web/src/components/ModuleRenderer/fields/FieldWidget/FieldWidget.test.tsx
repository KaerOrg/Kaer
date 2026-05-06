import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FieldWidget } from '../FieldWidget'

describe('FieldWidget', () => {
  it('time → input[type=time] interactif', () => {
    const { container } = render(<FieldWidget widgetType="time" />)
    const input = container.querySelector('input[type="time"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.disabled).toBe(false)
  })

  it('slider:0:120:min → input[type=range] min=0 max=120 + valeur en min', () => {
    const { container } = render(<FieldWidget widgetType="slider:0:120:min" />)
    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.min).toBe('0')
    expect(input.max).toBe('120')
    expect(container.querySelector('.fw-slider__val')?.textContent).toContain('min')
  })

  it('slider:0:10 → input[type=range] min=0 max=10 sans unité', () => {
    const { container } = render(<FieldWidget widgetType="slider:0:10" />)
    const val = container.querySelector('.fw-slider__val')?.textContent ?? ''
    expect(val.includes('min')).toBe(false)
  })

  it('stars:5 → 5 éléments svg', () => {
    const { container } = render(<FieldWidget widgetType="stars:5" />)
    expect(container.querySelectorAll('.fw-stars svg').length).toBe(5)
  })

  it('boolean → deux options Non / Oui', () => {
    const { container } = render(<FieldWidget widgetType="boolean" />)
    const options = container.querySelectorAll('.fw-boolean__option')
    expect(options.length).toBe(2)
    expect(options[0].textContent).toBe('Non')
    expect(options[1].textContent).toBe('Oui')
  })

  it('radio:ok → pastille verte "Pris"', () => {
    const { container } = render(<FieldWidget widgetType="radio:ok" />)
    const el = container.querySelector('.fw-radio--ok')
    expect(el).toBeTruthy()
    expect(el?.textContent).toContain('Pris')
  })

  it('radio:miss → pastille rouge "Non pris"', () => {
    const { container } = render(<FieldWidget widgetType="radio:miss" />)
    expect(container.querySelector('.fw-radio--miss')).toBeTruthy()
  })

  it('date → input[type=date] interactif', () => {
    const { container } = render(<FieldWidget widgetType="date" />)
    const input = container.querySelector('input[type="date"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.disabled).toBe(false)
  })

  it('text → div.fw-text', () => {
    const { container } = render(<FieldWidget widgetType="text" />)
    expect(container.querySelector('.fw-text')).toBeTruthy()
  })

  it('checkbox → checkbox interactif', () => {
    const { container } = render(<FieldWidget widgetType="checkbox" />)
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input?.disabled).toBe(false)
  })

  it('textarea → div.fw-textarea', () => {
    const { container } = render(<FieldWidget widgetType="textarea" />)
    expect(container.querySelector('.fw-textarea')).toBeTruthy()
  })

  it('info → affiche le texte détail fourni', () => {
    const { container } = render(<FieldWidget widgetType="info" detailText="Texte info" />)
    expect(container.querySelector('.fw-info')?.textContent).toContain('Texte info')
  })

  it('type inconnu → ne rend rien', () => {
    const { container } = render(<FieldWidget widgetType="unknown_type" />)
    expect(container.firstChild).toBeNull()
  })
})
