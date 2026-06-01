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
    ['2', 'h2'],
    ['3', 'h3'],
    ['4', 'h4'],
  ] as const)('card_heading level=%s rend <%s>', (level, tag) => {
    const { container } = render(<FieldText field={field('card_heading', { props: { level } })} t={t} />)
    const el = container.querySelector(tag)
    expect(el).toBeTruthy()
    expect(el?.textContent).toBe('some.key')
  })

  it('card_heading sans level rend <h2> par défaut', () => {
    const { container } = render(<FieldText field={field('card_heading')} t={t} />)
    expect(container.querySelector('h2')).toBeTruthy()
  })
})

describe('FieldText — paragraphes', () => {
  it('card_paragraph rend <p>', () => {
    const { container } = render(<FieldText field={field('card_paragraph')} t={t} />)
    expect(container.querySelector('p')).toBeTruthy()
  })

  it('card_paragraph avec bold=true rend <p><strong>', () => {
    const { container } = render(<FieldText field={field('card_paragraph', { props: { bold: 'true' } })} t={t} />)
    expect(container.querySelector('p > strong')).toBeTruthy()
    expect(container.querySelector('p > strong')?.textContent).toBe('some.key')
  })

  it('card_paragraph avec italic=true rend <p><em>', () => {
    const { container } = render(<FieldText field={field('card_paragraph', { props: { italic: 'true' } })} t={t} />)
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
  it('field_type inconnu rend une erreur visible', () => {
    const { container } = render(<FieldText field={field('unknown_type')} t={t} />)
    const err = container.querySelector('.field-error')
    expect(err).toBeTruthy()
    expect(err?.textContent).toContain('unknown_type')
  })

  it('text_code null rend une chaîne vide', () => {
    const { container } = render(<FieldText field={field('card_paragraph', { text_code: null })} t={t} />)
    expect(container.querySelector('p')?.textContent).toBe('')
  })
})
