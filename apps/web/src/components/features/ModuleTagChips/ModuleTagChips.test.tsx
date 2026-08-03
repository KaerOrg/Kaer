import { vi, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ModuleTagChips } from './ModuleTagChips'
import type { Tag } from '@services/moduleCatalogService'

const taxonomy = {
  tagsByDimension: new Map<string, Tag[]>([
    ['indication', [
      { id: 'anxiety', dimension_id: 'indication', sort_order: 10 },
      { id: 'trauma', dimension_id: 'indication', sort_order: 50 },
    ]],
    ['population', [{ id: 'teen', dimension_id: 'population', sort_order: 20 }]],
    ['approach', [{ id: 'cbt', dimension_id: 'approach', sort_order: 10 }]],
  ]),
}

describe('ModuleTagChips', () => {
  it('affiche les tags indication du module, pas la population ni l approche', () => {
    render(<ModuleTagChips tagIds={new Set(['anxiety', 'trauma', 'teen', 'cbt'])} taxonomy={taxonomy} />)
    expect(screen.getByText('tags.anxiety.label')).toBeInTheDocument()
    expect(screen.getByText('tags.trauma.label')).toBeInTheDocument()
    // population (âge) et approche ne s'affichent pas sur les cartes (CARD_DIMENSIONS)
    expect(screen.queryByText('tags.teen.label')).not.toBeInTheDocument()
    expect(screen.queryByText('tags.cbt.label')).not.toBeInTheDocument()
  })

  it('omet les tags non portés par le module', () => {
    render(<ModuleTagChips tagIds={new Set(['anxiety'])} taxonomy={taxonomy} />)
    expect(screen.getByText('tags.anxiety.label')).toBeInTheDocument()
    expect(screen.queryByText('tags.trauma.label')).not.toBeInTheDocument()
    expect(screen.queryByText('tags.teen.label')).not.toBeInTheDocument()
  })

  it('tronque à maxChips et résume le surplus par une puce +N', () => {
    render(<ModuleTagChips tagIds={new Set(['anxiety', 'trauma'])} taxonomy={taxonomy} maxChips={1} />)
    expect(screen.getByText('tags.anxiety.label')).toBeInTheDocument()
    // trauma est au-delà de la limite → masqué, résumé par « +1 »
    expect(screen.queryByText('tags.trauma.label')).not.toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('n affiche pas de puce +N quand le nombre de tags tient dans maxChips', () => {
    render(<ModuleTagChips tagIds={new Set(['anxiety', 'trauma'])} taxonomy={taxonomy} maxChips={2} />)
    expect(screen.getByText('tags.anxiety.label')).toBeInTheDocument()
    expect(screen.getByText('tags.trauma.label')).toBeInTheDocument()
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
  })

  it('ne rend rien pour un module sans tags', () => {
    const { container: c1 } = render(<ModuleTagChips tagIds={undefined} taxonomy={taxonomy} />)
    expect(c1).toBeEmptyDOMElement()

    const { container: c2 } = render(<ModuleTagChips tagIds={new Set()} taxonomy={taxonomy} />)
    expect(c2).toBeEmptyDOMElement()
  })
})
