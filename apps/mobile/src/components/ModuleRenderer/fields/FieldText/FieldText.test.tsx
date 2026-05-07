import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { FieldText } from './FieldText'
import type { ContentField } from '../../../../services/moduleService'

const t = (key: string) => key

function field(field_type: string, text_code?: string, extra: Partial<ContentField> = {}): ContentField {
  return {
    id: 'f1', module_id: 'mod1', section_id: null, parent_field_id: null,
    field_type, text_code: text_code ?? null, sort_order: 0, props: {}, children: [],
    ...extra,
  }
}

describe('FieldText', () => {
  const VARIANTS: [string, string][] = [
    ['card_heading_2',   'h2 text'],
    ['card_heading_3',   'h3 text'],
    ['card_heading_4',   'h4 text'],
    ['card_paragraph',   'paragraph text'],
    ['footer_note',      'footer text'],
    ['step_title',       'step title'],
    ['quadrant_title',   'quadrant title'],
    ['quadrant_subtitle','quadrant subtitle'],
    ['card_title',       'card title'],
    ['card_summary',     'card summary'],
  ]

  it.each(VARIANTS)('%s affiche son texte', (type, code) => {
    render(<FieldText field={field(type, code)} t={t} />)
    expect(screen.getByText(code)).toBeTruthy()
  })

  it('card_paragraph avec bold=true affiche son texte', () => {
    render(<FieldText field={field('card_paragraph', 'bold text', { props: { bold: 'true' } })} t={t} />)
    expect(screen.getByText('bold text')).toBeTruthy()
  })

  it('card_paragraph avec italic=true affiche son texte', () => {
    render(<FieldText field={field('card_paragraph', 'italic text', { props: { italic: 'true' } })} t={t} />)
    expect(screen.getByText('italic text')).toBeTruthy()
  })

  it('card_callout affiche son texte', () => {
    render(<FieldText field={field('card_callout', 'callout text')} t={t} />)
    expect(screen.getByText('callout text')).toBeTruthy()
  })

  it('step_hint entoure le texte de guillemets', () => {
    render(<FieldText field={field('step_hint', 'hint text')} t={t} />)
    expect(screen.getByText('"hint text"')).toBeTruthy()
  })

  it('field_type inconnu → null', () => {
    const { toJSON } = render(<FieldText field={field('type_inconnu', 'texte')} t={t} />)
    expect(toJSON()).toBeNull()
  })

  it('préfère les children inline au text_code', () => {
    const child: ContentField = field('card_paragraph', 'child.text', { id: 'child1' })
    render(<FieldText field={field('card_paragraph', 'parent.text', { children: [child] })} t={t} />)
    expect(screen.getByText('child.text')).toBeTruthy()
    expect(screen.queryByText('parent.text')).toBeNull()
  })

  it('quadrant_title accepte une prop color', () => {
    render(<FieldText field={field('quadrant_title', 'titre coloré', { props: { color: '#FF0000' } })} t={t} />)
    expect(screen.getByText('titre coloré')).toBeTruthy()
  })

  it("n'affiche rien quand text_code est null et pas de children", () => {
    render(<FieldText field={field('card_paragraph', undefined)} t={t} />)
    expect(screen.queryByText(/.+/)).toBeNull()
  })
})
