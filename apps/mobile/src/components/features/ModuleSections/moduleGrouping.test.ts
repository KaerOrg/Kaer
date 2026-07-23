import { groupModulesByCategory } from './moduleGrouping'
import type { UnlockedModule } from '@services/homeService'

function mk(id: string, category_id: string | null): UnlockedModule {
  return {
    id,
    module_type: id,
    config: {},
    unlocked_at: '2026-01-01',
    module: category_id === null
      ? null
      : { mobile_icon: 'help-circle-outline', color: '#000', preview_kind: 'form', category_id },
  }
}

describe('groupModulesByCategory', () => {
  it('regroupe les modules par catégorie', () => {
    const groups = groupModulesByCategory([mk('a', 'safety'), mk('b', 'safety'), mk('c', 'emotion')])
    expect(groups.map(g => g.catId)).toEqual(['safety', 'emotion'])
    expect(groups[0].items.map(i => i.id)).toEqual(['a', 'b'])
    expect(groups[1].items.map(i => i.id)).toEqual(['c'])
  })

  it('respecte CATEGORY_ORDER quel que soit l\'ordre d\'entrée', () => {
    const groups = groupModulesByCategory([mk('c', 'cognitive'), mk('s', 'safety'), mk('i', 'iatrogenic')])
    expect(groups.map(g => g.catId)).toEqual(['safety', 'iatrogenic', 'cognitive'])
  })

  it('place les catégories inconnues à la fin, dans leur ordre d\'apparition', () => {
    const groups = groupModulesByCategory([mk('x', 'unknown_b'), mk('s', 'safety'), mk('y', 'unknown_a')])
    expect(groups.map(g => g.catId)).toEqual(['safety', 'unknown_b', 'unknown_a'])
  })

  it('affecte les modules sans catégorie au groupe "other"', () => {
    const groups = groupModulesByCategory([mk('n', null)])
    expect(groups).toHaveLength(1)
    expect(groups[0].catId).toBe('other')
  })

  it('retourne un tableau vide pour une liste vide', () => {
    expect(groupModulesByCategory([])).toEqual([])
  })
})
