import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { InlineText } from './InlineText'
import type { ContentField } from '../../../../lib/moduleService'

const t = (key: string) => key

function field(field_type: string, text_code: string | null, props: Record<string, string> = {}): ContentField {
  return {
    id: 'f1', module_id: 'mod1', section_id: null, parent_field_id: null,
    field_type, text_code, sort_order: 0, props, children: [],
  }
}

describe('InlineText', () => {
  it('affiche le texte par défaut', () => {
    render(<InlineText field={field('card_inline', 'inline.text')} t={t} />)
    expect(screen.getByText('inline.text')).toBeTruthy()
  })

  it('affiche le texte en gras avec props.bold=true', () => {
    render(<InlineText field={field('card_inline', 'bold.text', { bold: 'true' })} t={t} />)
    expect(screen.getByText('bold.text')).toBeTruthy()
  })

  it("n'affiche rien quand text_code est null", () => {
    render(<InlineText field={field('card_inline', null)} t={t} />)
    expect(screen.queryByText(/.+/)).toBeNull()
  })
})
