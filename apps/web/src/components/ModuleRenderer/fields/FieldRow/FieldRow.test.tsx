import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FieldRow } from '../FieldRow'
import type { ContentField } from '../../../lib/moduleService'

const t = (key: string) => key

function field(overrides: Partial<ContentField> = {}): ContentField {
  return { id: 'f1', module_id: 'm1', section_id: null, parent_field_id: null, field_type: 'field_row', text_code: 'label.key', sort_order: 0, props: {}, children: [], ...overrides }
}

describe('FieldRow', () => {
  it('rend un <li class="preview-field"> avec le label', () => {
    const { container } = render(<ul><FieldRow field={field()} t={t} /></ul>)
    expect(container.querySelector('li.preview-field')).toBeTruthy()
    expect(container.querySelector('.preview-field__label')?.textContent).toBe('label.key')
  })

  it('sans icon ne rend pas le slot icône', () => {
    const { container } = render(<ul><FieldRow field={field()} t={t} /></ul>)
    expect(container.querySelector('.preview-field__icon')).toBeNull()
  })

  it('avec un nom lucide connu rend un SVG', () => {
    const { container } = render(<ul><FieldRow field={field({ props: { icon: 'moon' } })} t={t} /></ul>)
    expect(container.querySelector('.preview-field__icon svg')).toBeTruthy()
  })

  it('avec un nom non reconnu (M, P) rend le texte brut', () => {
    const { container } = render(<ul><FieldRow field={field({ props: { icon: 'M' } })} t={t} /></ul>)
    expect(container.querySelector('.preview-field__icon')?.textContent).toBe('M')
    expect(container.querySelector('.preview-field__icon svg')).toBeNull()
  })

  it('avec props.detail_code (sans widget_type) rend le slot détail via t()', () => {
    const { container } = render(<ul><FieldRow field={field({ props: { detail_code: 'detail.key' } })} t={t} /></ul>)
    expect(container.querySelector('.preview-field__detail')?.textContent).toBe('detail.key')
  })

  it('sans detail_code ne rend pas le slot détail', () => {
    const { container } = render(<ul><FieldRow field={field()} t={t} /></ul>)
    expect(container.querySelector('.preview-field__detail')).toBeNull()
  })

  it('avec widget_type=time rend un input[type=time] au lieu du texte détail', () => {
    const { container } = render(
      <ul><FieldRow field={field({ props: { widget_type: 'time', detail_code: 'detail.key' } })} t={t} /></ul>
    )
    expect(container.querySelector('input[type="time"]')).toBeTruthy()
    expect(container.querySelector('.preview-field__detail')).toBeNull()
  })

  it('avec widget_type=boolean rend le widget boolean', () => {
    const { container } = render(
      <ul><FieldRow field={field({ props: { widget_type: 'boolean' } })} t={t} /></ul>
    )
    expect(container.querySelector('.fw-boolean')).toBeTruthy()
  })

  it('avec widget_type=stars:5 rend 5 étoiles', () => {
    const { container } = render(
      <ul><FieldRow field={field({ props: { widget_type: 'stars:5' } })} t={t} /></ul>
    )
    expect(container.querySelectorAll('.fw-stars svg').length).toBe(5)
  })
})
