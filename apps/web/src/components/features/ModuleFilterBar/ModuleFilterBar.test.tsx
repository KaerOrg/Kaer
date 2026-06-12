import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key} ${params.shown}/${params.total}` : key,
  }),
}))

import { ModuleFilterBar } from './ModuleFilterBar'
import type { ModuleTaxonomy } from '../../../services/moduleCatalogService'

const taxonomy: ModuleTaxonomy = {
  dimensions: [
    { id: 'indication', sort_order: 1 },
    { id: 'population', sort_order: 2 },
    { id: 'approach', sort_order: 3 }, // sans tags → rangée omise
  ],
  tagsByDimension: new Map([
    ['indication', [
      { id: 'anxiety', dimension_id: 'indication', sort_order: 10 },
      { id: 'ocd', dimension_id: 'indication', sort_order: 20 },
    ]],
    ['population', [{ id: 'teen', dimension_id: 'population', sort_order: 10 }]],
  ]),
  tagsByModule: new Map(),
}

const onToggleTag = vi.fn()
const onReset = vi.fn()

function renderBar(activeFilters: ReadonlyMap<string, ReadonlySet<string>> = new Map()) {
  return render(
    <ModuleFilterBar
      taxonomy={taxonomy}
      activeFilters={activeFilters}
      onToggleTag={onToggleTag}
      onReset={onReset}
      resultCount={4}
      totalCount={12}
    />,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('ModuleFilterBar — rendu', () => {
  it('affiche une rangée par dimension ayant des tags, dans l ordre', () => {
    renderBar()
    expect(screen.getByText('tag_dimensions.indication.label')).toBeInTheDocument()
    expect(screen.getByText('tag_dimensions.population.label')).toBeInTheDocument()
    // dimension sans tags → omise
    expect(screen.queryByText('tag_dimensions.approach.label')).not.toBeInTheDocument()
  })

  it('affiche une puce par tag', () => {
    renderBar()
    expect(screen.getByText('tags.anxiety.label')).toBeInTheDocument()
    expect(screen.getByText('tags.ocd.label')).toBeInTheDocument()
    expect(screen.getByText('tags.teen.label')).toBeInTheDocument()
  })

  it('affiche le compteur résultats/total', () => {
    renderBar()
    expect(screen.getByText('modules.filter_count 4/12')).toBeInTheDocument()
  })

  it('reflète la sélection via aria-pressed', () => {
    renderBar(new Map([['indication', new Set(['anxiety'])]]))
    expect(screen.getByText('tags.anxiety.label')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('tags.ocd.label')).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('ModuleFilterBar — interactions', () => {
  it('clic sur une puce → onToggleTag(dimension, tag)', () => {
    renderBar()
    fireEvent.click(screen.getByText('tags.ocd.label'))
    expect(onToggleTag).toHaveBeenCalledWith('indication', 'ocd')
  })

  it('le bouton reset n apparaît que si un filtre est actif, et déclenche onReset', () => {
    const { unmount } = renderBar()
    expect(screen.queryByText('modules.filter_reset')).not.toBeInTheDocument()
    unmount()

    renderBar(new Map([['population', new Set(['teen'])]]))
    const reset = screen.getByText('modules.filter_reset')
    fireEvent.click(reset)
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
