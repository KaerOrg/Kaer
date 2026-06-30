import { vi, describe, it, expect, beforeEach } from 'vitest'

const fetchModuleTaxonomy = vi.fn()

vi.mock('@services/moduleCatalogService', () => ({
  fetchModuleTaxonomy: (...a: unknown[]) => fetchModuleTaxonomy(...a),
}))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useTagFilters } from './useTagFilters'
import type { ModuleTaxonomy } from '@services/moduleCatalogService'

const taxonomy: ModuleTaxonomy = {
  dimensions: [{ id: 'indication', sort_order: 1 }],
  tagsByDimension: new Map([['indication', [{ id: 'anxiety', dimension_id: 'indication', sort_order: 10 }]]]),
  tagsByModule: new Map([['fear_thermometer', new Set(['anxiety'])]]),
}

describe('useTagFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchModuleTaxonomy.mockResolvedValue(taxonomy)
  })

  it('charge la taxonomie au mount', async () => {
    const { result } = renderHook(() => useTagFilters())
    expect(result.current.taxonomy.dimensions).toEqual([])
    await waitFor(() => expect(result.current.taxonomy).toBe(taxonomy))
    expect(fetchModuleTaxonomy).toHaveBeenCalledTimes(1)
  })

  it('toggleTag coche puis décoche un tag, en nettoyant la dimension vidée', async () => {
    const { result } = renderHook(() => useTagFilters())

    act(() => result.current.toggleTag('indication', 'anxiety'))
    expect(result.current.activeFilters.get('indication')).toEqual(new Set(['anxiety']))

    act(() => result.current.toggleTag('indication', 'ocd'))
    expect(result.current.activeFilters.get('indication')).toEqual(new Set(['anxiety', 'ocd']))

    act(() => result.current.toggleTag('indication', 'anxiety'))
    act(() => result.current.toggleTag('indication', 'ocd'))
    // dimension vidée → retirée de la Map (hasAnyActiveFilter reste cohérent)
    expect(result.current.activeFilters.has('indication')).toBe(false)
  })

  it('resetFilters vide toute la sélection', async () => {
    const { result } = renderHook(() => useTagFilters())

    act(() => result.current.toggleTag('indication', 'anxiety'))
    act(() => result.current.toggleTag('population', 'teen'))
    expect(result.current.activeFilters.size).toBe(2)

    act(() => result.current.resetFilters())
    expect(result.current.activeFilters.size).toBe(0)
  })

  it('toggleTag ne mute pas la Map précédente (immutabilité)', async () => {
    const { result } = renderHook(() => useTagFilters())

    act(() => result.current.toggleTag('indication', 'anxiety'))
    const before = result.current.activeFilters

    act(() => result.current.toggleTag('indication', 'ocd'))
    expect(result.current.activeFilters).not.toBe(before)
    expect(before.get('indication')).toEqual(new Set(['anxiety']))
  })
})
