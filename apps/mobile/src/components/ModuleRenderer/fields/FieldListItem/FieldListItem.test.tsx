import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { FieldListItem } from './FieldListItem'
import type { ContentField } from '../../../../services/moduleService'

const t = (key: string) => key

function field(field_type: string, extra: Partial<ContentField> = {}): ContentField {
  return {
    id: 'f1', module_id: 'mod1', section_id: null, parent_field_id: null,
    field_type, text_code: null, sort_order: 0, props: {}, children: [],
    ...extra,
  }
}

describe('FieldListItem', () => {
  it('card_list_item affiche le puce "•" et le texte', () => {
    render(<FieldListItem field={field('card_list_item', { text_code: 'item.text' })} t={t} />)
    expect(screen.getByText('•')).toBeTruthy()
    expect(screen.getByText('item.text')).toBeTruthy()
  })

  it('card_numbered_item affiche le numéro suivi de "." et le texte', () => {
    render(<FieldListItem
      field={field('card_numbered_item', { text_code: 'num.item', props: { item_number: '3' } })}
      t={t}
    />)
    expect(screen.getByText('3.')).toBeTruthy()
    expect(screen.getByText('num.item')).toBeTruthy()
  })

  it('préfère les children inline au text_code quand présents', () => {
    const child: ContentField = field('card_paragraph', { id: 'child1', text_code: 'child.text' })
    render(<FieldListItem
      field={field('card_list_item', { text_code: 'parent.text', children: [child] })}
      t={t}
    />)
    expect(screen.getByText('child.text')).toBeTruthy()
    expect(screen.queryByText('parent.text')).toBeNull()
  })

  it('card_numbered_item sans item_number utilise "•" comme numéro', () => {
    render(<FieldListItem field={field('card_numbered_item', { text_code: 'item' })} t={t} />)
    expect(screen.getByText('•.')).toBeTruthy()
  })
})
