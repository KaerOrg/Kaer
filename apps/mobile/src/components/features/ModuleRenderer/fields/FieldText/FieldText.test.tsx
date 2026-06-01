import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { FieldText } from './FieldText'
import type { ContentField } from '../../../../../services/moduleService'

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleT: () => (key: string) => key,
}))

function field(field_type: string, text_code?: string, extra: Partial<ContentField> = {}): ContentField {
  return {
    id: 'f1', module_id: 'mod1', section_id: null, parent_field_id: null,
    field_type, text_code: text_code ?? null, sort_order: 0, props: {}, children: [],
    ...extra,
  }
}

describe('FieldText', () => {
  const VARIANTS: [string, string][] = [
    ['card_heading',     'heading text'],
    ['card_paragraph',   'paragraph text'],
    ['footer_note',      'footer text'],
    ['step_title',       'step title'],
    ['card_title',       'card title'],
    ['card_summary',     'card summary'],
  ]

  it.each(VARIANTS)('%s affiche son texte', (type, code) => {
    render(<FieldText field={field(type, code)} />)
    expect(screen.getByText(code)).toBeTruthy()
  })

  it.each([['2', 'h2 text'], ['3', 'h3 text'], ['4', 'h4 text']] as const)(
    'card_heading level=%s affiche son texte', (level, code) => {
      render(<FieldText field={field('card_heading', code, { props: { level } })} />)
      expect(screen.getByText(code)).toBeTruthy()
    }
  )

  it('card_paragraph avec bold=true affiche son texte', () => {
    render(<FieldText field={field('card_paragraph', 'bold text', { props: { bold: 'true' } })} />)
    expect(screen.getByText('bold text')).toBeTruthy()
  })

  it('card_paragraph avec italic=true affiche son texte', () => {
    render(<FieldText field={field('card_paragraph', 'italic text', { props: { italic: 'true' } })} />)
    expect(screen.getByText('italic text')).toBeTruthy()
  })

  it('card_callout affiche son texte', () => {
    render(<FieldText field={field('card_callout', 'callout text')} />)
    expect(screen.getByText('callout text')).toBeTruthy()
  })

  it('step_hint entoure le texte de guillemets', () => {
    render(<FieldText field={field('step_hint', 'hint text')} />)
    expect(screen.getByText('"hint text"')).toBeTruthy()
  })

  it('field_type inconnu → null', () => {
    const { toJSON } = render(<FieldText field={field('type_inconnu', 'texte')} />)
    expect(toJSON()).toBeNull()
  })

  it('préfère les children inline au text_code', () => {
    const child: ContentField = field('card_paragraph', 'child.text', { id: 'child1' })
    render(<FieldText field={field('card_paragraph', 'parent.text', { children: [child] })} />)
    expect(screen.getByText('child.text')).toBeTruthy()
    expect(screen.queryByText('parent.text')).toBeNull()
  })

  it("n'affiche rien quand text_code est null et pas de children", () => {
    render(<FieldText field={field('card_paragraph', undefined)} />)
    expect(screen.queryByText(/.+/)).toBeNull()
  })
})
