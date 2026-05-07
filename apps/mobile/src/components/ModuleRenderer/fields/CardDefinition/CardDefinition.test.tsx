import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { CardDefinition } from './CardDefinition'
import type { ContentField } from '../../../../services/moduleService'

const t = (key: string) => key

function field(props: Record<string, string> = {}, text_code: string | null = null): ContentField {
  return {
    id: 'f1', module_id: 'mod1', section_id: null, parent_field_id: null,
    field_type: 'card_definition', text_code, sort_order: 0, props, children: [],
  }
}

describe('CardDefinition', () => {
  it('affiche le terme et la définition', () => {
    render(<CardDefinition field={field({ term_code: 'term.key' }, 'def.key')} t={t} />)
    expect(screen.getByText('term.key')).toBeTruthy()
    expect(screen.getByText('def.key')).toBeTruthy()
  })

  it('affiche le terme seul quand text_code est null', () => {
    render(<CardDefinition field={field({ term_code: 'only.term' }, null)} t={t} />)
    expect(screen.getByText('only.term')).toBeTruthy()
    expect(screen.queryAllByText(/.+/)).toHaveLength(1)
  })

  it('ne rend aucun texte quand les deux codes sont absents', () => {
    render(<CardDefinition field={field({}, null)} t={t} />)
    expect(screen.queryByText(/.+/)).toBeNull()
  })
})
