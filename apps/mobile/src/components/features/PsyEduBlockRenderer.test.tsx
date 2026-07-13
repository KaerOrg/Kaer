jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { teenMode: boolean }) => unknown) => selector({ teenMode: false }),
}))

jest.mock('./InlineText', () => ({
  InlineText: ({ code }: { code: string }) => {
    const { Text } = require('react-native')
    return <Text>{code}</Text>
  },
}))

jest.mock('lucide-react-native', () => {
  const React = require('react')
  const Stub = (name: string) => (props: { size?: number; color?: string }) =>
    React.createElement('Icon', { ...props, name })
  return new Proxy({}, { get: (_: unknown, key: string) => Stub(String(key)) })
})

jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    exists: () => false,
    t: (key: string) => key,
  },
}))

import { render, screen } from '@testing-library/react-native'
import { PsyEduBlockRenderer } from './PsyEduBlockRenderer'
import type { PsyEduBlock } from '@kaer/shared'

function block(over: Partial<PsyEduBlock> & Pick<PsyEduBlock, 'id' | 'block_type'>): PsyEduBlock {
  return {
    topic_id: 't1', section_key: 'why', text_code: null, items_codes: null, href: null, sort_order: 0,
    ...over,
  } as PsyEduBlock
}

describe('PsyEduBlockRenderer', () => {
  it('rend un titre de section (heading)', () => {
    render(<PsyEduBlockRenderer blocks={[block({ id: 'h1', block_type: 'heading', text_code: 'sec.title' })]} />)
    expect(screen.getByText('sec.title')).toBeTruthy()
  })

  it('numérote les étapes d’un action_list', () => {
    render(
      <PsyEduBlockRenderer
        blocks={[block({ id: 'a1', block_type: 'action_list', items_codes: ['step.a', 'step.b', 'step.c'] })]}
      />,
    )
    // Numéros d'étape 1..3 rendus.
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('step.a')).toBeTruthy()
  })

  it('rend une référence cliquable (source_link)', () => {
    render(
      <PsyEduBlockRenderer
        blocks={[block({ id: 's1', block_type: 'source_link', text_code: 'ref.has', href: 'https://has.fr' })]}
      />,
    )
    expect(screen.getByText('ref.has')).toBeTruthy()
  })

  it('rend un encart astuce (tip)', () => {
    render(<PsyEduBlockRenderer blocks={[block({ id: 't1b', block_type: 'tip', text_code: 'tip.hydrate' })]} />)
    expect(screen.getByText('tip.hydrate')).toBeTruthy()
  })
})
