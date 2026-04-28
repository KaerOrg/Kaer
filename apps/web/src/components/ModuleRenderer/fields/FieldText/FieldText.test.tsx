import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FieldText } from './FieldText'
import type { ContentField } from '../../../lib/moduleService'

const t = (key: string) => key

function field(field_type: string, overrides: Partial<ContentField> = {}): ContentField {
  return { id: 'f1', module_id: 'm1', section_id: null, parent_field_id: null, text_code: 'some.key', sort_order: 0, props: {}, children: [], field_type, ...overrides }
}

function inlineChild(variant: 'bold' | 'text', text_code: string): ContentField {
  return { id: 'c1', module_id: 'm1', section_id: null, parent_field_id: 'f1', field_type: 'card_inline', text_code, sort_order: 0, props: variant === 'bold' ? { bold: 'true' } : {}, children: [] }
}

describe('FieldText — headings', () => {
  it.each([
    ['card_heading_2', 'h2'],
    ['card_heading_3', 'h3'],
    ['card_heading_4', 'h4'],
  ] as const)('%s rend <%s> avec le texte traduit', (fieldType, tag) => {
    const { container } = render(<FieldText field={field(fieldType)} t={t} />)
    const el = container.querySelector(tag)
    expect(el).toBeTruthy()
    expect(el?.textContent).toBe('some.key')
  })
})

describe('FieldText — paragraphes', () => {
  it('card_paragraph rend <p>', () => {
    const { container } = render(<FieldText field={field('card_paragraph')} t={t} />)
    expect(container.querySelector('p')).toBeTruthy()
  })

  it('card_paragraph_bold rend <p><strong>', () => {
    const { container } = render(<FieldText field={field('card_paragraph_bold')} t={t} />)
    expect(container.querySelector('p > strong')).toBeTruthy()
    expect(container.querySelector('p > strong')?.textContent).toBe('some.key')
  })

  it('card_italic_note rend <p><em>', () => {
    const { container } = render(<FieldText field={field('card_italic_note')} t={t} />)
    expect(container.querySelector('p > em')).toBeTruthy()
  })

  it('card_callout rend <p> avec border-left', () => {
    const { container } = render(<FieldText field={field('card_callout')} t={t} />)
    const p = container.querySelector('p')
    expect(p).toBeTruthy()
    expect(p?.getAttribute('style')).toContain('border-left')
  })

  it('footer_note rend <p class="preview-panel__footer">', () => {
    const { container } = render(<FieldText field={field('footer_note')} t={t} />)
    expect(container.querySelector('p.preview-panel__footer')).toBeTruthy()
  })

  it('card_paragraph avec enfants inline rend les enfants dans <p>', () => {
    const children = [inlineChild('bold', 'bold.key'), inlineChild('text', 'plain.key')]
    const { container } = render(<FieldText field={field('card_paragraph', { children })} t={t} />)
    expect(container.querySelector('p > strong')?.textContent).toBe('bold.key')
    expect(container.querySelector('p > span')?.textContent).toBe('plain.key')
  })
})

describe('FieldText — step', () => {
  it('step_title rend <div class="preview-step__title">', () => {
    const { container } = render(<FieldText field={field('step_title')} t={t} />)
    expect(container.querySelector('div.preview-step__title')?.textContent).toBe('some.key')
  })

  it('step_hint rend le texte entre guillemets', () => {
    const { container } = render(<FieldText field={field('step_hint', { text_code: 'hint.key' })} t={t} />)
    expect(container.querySelector('div.preview-step__hint')?.textContent).toBe('"hint.key"')
  })
})

describe('FieldText — quadrant', () => {
  it('quadrant_title applique la couleur depuis props.color', () => {
    const { container } = render(
      <FieldText field={field('quadrant_title', { props: { color: '#FF0000' } })} t={t} />
    )
    expect(container.querySelector('div.preview-quadrant__title')?.style.color).toBe('rgb(255, 0, 0)')
  })

  it('quadrant_title utilise la couleur par défaut si props.color absent', () => {
    const { container } = render(<FieldText field={field('quadrant_title')} t={t} />)
    expect(container.querySelector('div.preview-quadrant__title')?.style.color).toBe('rgb(99, 102, 241)')
  })

  it('quadrant_subtitle rend <div class="preview-quadrant__subtitle">', () => {
    const { container } = render(<FieldText field={field('quadrant_subtitle')} t={t} />)
    expect(container.querySelector('div.preview-quadrant__subtitle')).toBeTruthy()
  })
})

describe('FieldText — card labels', () => {
  it('card_title rend <span class="preview-card__title">', () => {
    const { container } = render(<FieldText field={field('card_title')} t={t} />)
    expect(container.querySelector('span.preview-card__title')?.textContent).toBe('some.key')
  })

  it('card_summary rend <span class="preview-card__summary">', () => {
    const { container } = render(<FieldText field={field('card_summary')} t={t} />)
    expect(container.querySelector('span.preview-card__summary')).toBeTruthy()
  })
})

describe('FieldText — cas limites', () => {
  it('field_type inconnu rend null', () => {
    const { container } = render(<FieldText field={field('unknown_type')} t={t} />)
    expect(container.firstChild).toBeNull()
  })

  it('text_code null rend une chaîne vide', () => {
    const { container } = render(<FieldText field={field('card_paragraph', { text_code: null })} t={t} />)
    expect(container.querySelector('p')?.textContent).toBe('')
  })
})
