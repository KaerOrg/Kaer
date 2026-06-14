import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params?.shown !== undefined ? `${key} ${params.shown}/${params.total}` : key,
  }),
}))

import { ModuleFilterBar } from './ModuleFilterBar'
import type { ModuleTaxonomy } from '../../../services/moduleCatalogService'

const taxonomy: ModuleTaxonomy = {
  dimensions: [
    { id: 'indication', sort_order: 1 },
    { id: 'population', sort_order: 2 },
    { id: 'approach', sort_order: 3 }, // sans tags → aucune option
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

describe('ModuleFilterBar — un filtre par axe', () => {
  it('affiche une combobox par dimension ayant des tags (axe sans tag omis)', () => {
    renderBar()
    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes).toHaveLength(2) // indication + population, approach omis
    expect(screen.getByText('tag_dimensions.indication.label')).toBeInTheDocument()
    expect(screen.getByText('tag_dimensions.population.label')).toBeInTheDocument()
    expect(screen.queryByText('tag_dimensions.approach.label')).not.toBeInTheDocument()
  })

  it('chaque combobox ne propose que les tags de son axe', () => {
    renderBar()
    const indication = screen.getByLabelText('tag_dimensions.indication.label')
    fireEvent.focus(indication)
    expect(screen.getByRole('option', { name: 'tags.anxiety.label' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'tags.ocd.label' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'tags.teen.label' })).not.toBeInTheDocument()
  })

  it('sélectionner une option → onToggleTag(dimension, tag)', () => {
    renderBar()
    fireEvent.focus(screen.getByLabelText('tag_dimensions.indication.label'))
    fireEvent.pointerDown(screen.getByRole('option', { name: 'tags.ocd.label' }))
    expect(onToggleTag).toHaveBeenCalledWith('indication', 'ocd')
  })

  it('reflète la sélection courante de l axe via aria-selected', () => {
    renderBar(new Map([['indication', new Set(['anxiety'])]]))
    fireEvent.focus(screen.getByLabelText('tag_dimensions.indication.label'))
    expect(screen.getByRole('option', { name: 'tags.anxiety.label' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'tags.ocd.label' })).toHaveAttribute('aria-selected', 'false')
  })
})

describe('ModuleFilterBar — puces de sélection', () => {
  it('résume la sélection en puces, regroupées sous le titre du critère', () => {
    const { unmount } = renderBar()
    expect(screen.queryByRole('button', { name: /filter_remove/ })).not.toBeInTheDocument()
    unmount()

    renderBar(new Map([['indication', new Set(['anxiety'])], ['population', new Set(['teen'])]]))
    const selected = document.querySelector('.module-filter-bar__selected') as HTMLElement
    // titre du critère rappelé dans la zone de synthèse
    expect(within(selected).getByText('tag_dimensions.indication.label')).toBeInTheDocument()
    expect(within(selected).getByText('tag_dimensions.population.label')).toBeInTheDocument()
    expect(within(selected).getByText('tags.anxiety.label')).toBeInTheDocument()
    expect(within(selected).getByText('tags.teen.label')).toBeInTheDocument()
  })

  it('retirer une puce → onToggleTag(dimension, tag)', () => {
    renderBar(new Map([['indication', new Set(['anxiety'])]]))
    fireEvent.click(screen.getByRole('button', { name: 'modules.filter_remove' }))
    expect(onToggleTag).toHaveBeenCalledWith('indication', 'anxiety')
  })
})

describe('ModuleFilterBar — pied', () => {
  it('affiche le compteur résultats/total', () => {
    renderBar()
    expect(screen.getByText('modules.filter_count 4/12')).toBeInTheDocument()
  })

  it('le bouton reset n apparaît que si un filtre est actif, et déclenche onReset', () => {
    const { unmount } = renderBar()
    expect(screen.queryByText('modules.filter_reset')).not.toBeInTheDocument()
    unmount()

    renderBar(new Map([['population', new Set(['teen'])]]))
    fireEvent.click(screen.getByText('modules.filter_reset'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
