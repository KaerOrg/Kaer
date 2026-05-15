import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { InlineText } from './InlineText'
import type { ContentField } from '../../../lib/moduleService'

const t = (key: string) => key

function field(field_type: string, props: Record<string, string> = {}): ContentField {
  return { id: 'f1', module_id: 'm1', section_id: null, parent_field_id: null, text_code: 'inline.key', sort_order: 0, props, children: [], field_type }
}

describe('InlineText', () => {
  it('props.bold=true rend <strong>', () => {
    const { container } = render(<p><InlineText field={field('card_inline', { bold: 'true' })} t={t} /></p>)
    expect(container.querySelector('strong')?.textContent).toBe('inline.key')
  })

  it('props.italic=true rend <em>', () => {
    const { container } = render(<p><InlineText field={field('card_inline', { italic: 'true' })} t={t} /></p>)
    expect(container.querySelector('em')?.textContent).toBe('inline.key')
  })

  it('défaut rend <span>', () => {
    const { container } = render(<p><InlineText field={field('card_inline')} t={t} /></p>)
    expect(container.querySelector('span')?.textContent).toBe('inline.key')
  })
})
