import { describe, it, expect } from 'vitest'
import {
  hasAnyActiveFilter,
  moduleMatchesTagFilters,
  filterCategoriesByTags,
  selectCardTagRows,
} from './moduleFilter'
import type { ModuleCategory, Tag } from '@services/moduleCatalogService'

const mod = (id: string) => ({ id, icon: '', mobile_icon: '', color: '#000' })

const categories: ModuleCategory[] = [
  {
    id: 'anxiety',
    icon: '',
    labelKey: 'category.anxiety.label',
    subtitleKey: 'category.anxiety.subtitle',
    modules: [mod('fear_thermometer'), mod('breathing_techniques')],
  },
  {
    id: 'emotion',
    icon: '',
    labelKey: 'category.emotion.label',
    subtitleKey: 'category.emotion.subtitle',
    modules: [mod('behavioral_activation')],
  },
]

const tagsByModule = new Map<string, Set<string>>([
  ['fear_thermometer', new Set(['anxiety', 'ocd', 'trauma', 'child', 'teen', 'adult', 'cbt'])],
  ['breathing_techniques', new Set(['anxiety', 'child', 'teen', 'adult', 'senior', 'relaxation'])],
  ['behavioral_activation', new Set(['depression', 'anxiety', 'teen', 'adult', 'senior', 'cbt'])],
])

describe('hasAnyActiveFilter', () => {
  it('false quand aucune dimension n a de tag coché', () => {
    expect(hasAnyActiveFilter(new Map())).toBe(false)
    expect(hasAnyActiveFilter(new Map([['indication', new Set()]]))).toBe(false)
  })

  it('true dès qu un tag est coché', () => {
    expect(hasAnyActiveFilter(new Map([['indication', new Set(['anxiety'])]]))).toBe(true)
  })
})

describe('moduleMatchesTagFilters', () => {
  const tags = tagsByModule.get('fear_thermometer')

  it('matche sans filtre actif', () => {
    expect(moduleMatchesTagFilters(tags, new Map())).toBe(true)
  })

  it('OU à l intérieur d une dimension', () => {
    // l un OU l autre suffit
    const filters = new Map([['indication', new Set(['anxiety', 'addiction'])]])
    expect(moduleMatchesTagFilters(tags, filters)).toBe(true)
  })

  it('ET entre dimensions', () => {
    const ok = new Map([
      ['indication', new Set(['ocd'])],
      ['population', new Set(['child'])],
    ])
    expect(moduleMatchesTagFilters(tags, ok)).toBe(true)

    const ko = new Map([
      ['indication', new Set(['ocd'])],
      ['population', new Set(['senior'])], // fear_thermometer n est pas sujet âgé
    ])
    expect(moduleMatchesTagFilters(tags, ko)).toBe(false)
  })

  it('exclut un module sans tags dès qu un filtre est actif', () => {
    const filters = new Map([['indication', new Set(['anxiety'])]])
    expect(moduleMatchesTagFilters(undefined, filters)).toBe(false)
  })
})

describe('filterCategoriesByTags', () => {
  it('renvoie tout sans filtre actif', () => {
    const result = filterCategoriesByTags(categories, tagsByModule, new Map())
    expect(result).toHaveLength(2)
    expect(result[0].modules).toHaveLength(2)
  })

  it('retire les modules non concernés et les catégories vidées', () => {
    const filters = new Map([['indication', new Set(['ocd'])]])
    const result = filterCategoriesByTags(categories, tagsByModule, filters)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('anxiety')
    expect(result[0].modules.map(m => m.id)).toEqual(['fear_thermometer'])
  })

  it('croise indication et population', () => {
    const filters = new Map([
      ['indication', new Set(['anxiety'])],
      ['population', new Set(['senior'])],
    ])
    const result = filterCategoriesByTags(categories, tagsByModule, filters)
    const ids = result.flatMap(c => c.modules.map(m => m.id))
    expect(ids).toEqual(['breathing_techniques', 'behavioral_activation'])
  })

  it('ne mute pas les catégories d entrée', () => {
    const filters = new Map([['indication', new Set(['ocd'])]])
    filterCategoriesByTags(categories, tagsByModule, filters)
    expect(categories[0].modules).toHaveLength(2)
  })
})

describe('selectCardTagRows', () => {
  const tag = (id: string, dimension_id: string, sort_order: number): Tag => ({ id, dimension_id, sort_order })
  const taxonomy = {
    tagsByDimension: new Map<string, Tag[]>([
      ['indication', [tag('anxiety', 'indication', 10), tag('ocd', 'indication', 20), tag('trauma', 'indication', 50)]],
      ['population', [tag('child', 'population', 10), tag('teen', 'population', 20), tag('adult', 'population', 30)]],
      ['approach', [tag('cbt', 'approach', 10)]],
    ]),
  }

  it('affiche uniquement l indication, en excluant population et approche', () => {
    const ids = new Set(['cbt', 'adult', 'anxiety', 'trauma', 'teen'])
    const rows = selectCardTagRows(ids, taxonomy)
    expect(rows.map(r => r.dimensionId)).toEqual(['indication'])
    expect(rows[0].tags.map(t => t.id)).toEqual(['anxiety', 'trauma'])
  })

  it('omet une dimension sans tag pour ce module', () => {
    const rows = selectCardTagRows(new Set(['anxiety']), taxonomy)
    expect(rows.map(r => r.dimensionId)).toEqual(['indication'])
  })

  it('renvoie [] pour un module sans tags', () => {
    expect(selectCardTagRows(undefined, taxonomy)).toEqual([])
    expect(selectCardTagRows(new Set(), taxonomy)).toEqual([])
  })
})
