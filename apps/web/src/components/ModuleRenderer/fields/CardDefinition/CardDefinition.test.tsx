import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CardDefinition } from '../CardDefinition'
import type { ContentField } from '../../../services/moduleService'

const t = (key: string) => key

function field(overrides: Partial<ContentField> = {}): ContentField {
  return { id: 'f1', module_id: 'm1', section_id: null, parent_field_id: null, field_type: 'card_definition', text_code: 'term.key', sort_order: 0, props: {}, children: [], ...overrides }
}

describe('CardDefinition', () => {
  it('rend le terme dans <strong>', () => {
    const { container } = render(<CardDefinition field={field()} t={t} />)
    expect(container.querySelector('p > strong')?.textContent).toBe('term.key')
  })

  it('sans definition_text_code ne rend pas le séparateur', () => {
    const { container } = render(<CardDefinition field={field()} t={t} />)
    expect(container.querySelector('p')?.textContent).toBe('term.key')
  })

  it('avec definition_text_code rend "terme — définition"', () => {
    const { container } = render(
      <CardDefinition field={field({ props: { definition_text_code: 'def.key' } })} t={t} />
    )
    expect(container.querySelector('p')?.textContent).toBe('term.key — def.key')
  })
})
