import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FieldListItem } from './FieldListItem'
import type { ContentField } from '../../../lib/moduleService'

const t = (key: string) => key

function field(field_type: string, overrides: Partial<ContentField> = {}): ContentField {
  return { id: 'f1', module_id: 'm1', section_id: null, parent_field_id: null, text_code: 'item.key', sort_order: 0, props: {}, children: [], field_type, ...overrides }
}

describe('FieldListItem', () => {
  it('rend un <li> avec le texte', () => {
    const { container } = render(<ul><FieldListItem field={field('card_list_item')} t={t} /></ul>)
    expect(container.querySelector('li')?.textContent).toBe('item.key')
  })

  it('card_numbered_item applique value depuis props.item_number', () => {
    const { container } = render(
      <ol><FieldListItem field={field('card_numbered_item', { props: { item_number: '3' } })} t={t} /></ol>
    )
    expect(container.querySelector('li')?.getAttribute('value')).toBe('3')
  })

  it('sans item_number value est undefined (pas d attribut value)', () => {
    const { container } = render(<ol><FieldListItem field={field('card_numbered_item')} t={t} /></ol>)
    expect(container.querySelector('li')?.getAttribute('value')).toBeNull()
  })

  it('avec enfants inline les rend dans le <li>', () => {
    const child: ContentField = { id: 'c1', module_id: 'm1', section_id: null, parent_field_id: 'f1', field_type: 'card_inline', text_code: 'bold.key', sort_order: 0, props: { bold: 'true' }, children: [] }
    const { container } = render(<ul><FieldListItem field={field('card_list_item', { children: [child] })} t={t} /></ul>)
    expect(container.querySelector('li > strong')?.textContent).toBe('bold.key')
  })
})
