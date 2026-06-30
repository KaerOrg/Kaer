import {
  parseIntOr, intensityValuesFor, buildStepLabels,
  buildRawNodes, buildNodeMap, toUiNodes, reconstructPath, toEntryVM,
} from './helpers'
import type { ContentField } from '@services/moduleService'
import type { TreeSelection } from '../../../../../lib/database'

// `t` déterministe : préfixe la clé pour rendre la résolution observable.
const t = (key: string) => `T:${key}`

function field(over: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: over.id ?? 'f',
    module_id: 'emotion_wheel',
    section_id: null,
    parent_field_id: over.parent_field_id ?? null,
    field_type: over.field_type ?? 'tree_node',
    text_code: over.text_code ?? null,
    sort_order: over.sort_order ?? 0,
    props: over.props ?? {},
    children: over.children ?? [],
  }
}

describe('TreeSelector helpers (feature layer)', () => {
  describe('parseIntOr', () => {
    it('parse une valeur numérique', () => {
      expect(parseIntOr('7', 1)).toBe(7)
    })
    it('renvoie le fallback si absent ou non numérique', () => {
      expect(parseIntOr(undefined, 3)).toBe(3)
      expect(parseIntOr('abc', 5)).toBe(5)
      expect(parseIntOr('', 10)).toBe(10)
    })
  })

  describe('intensityValuesFor', () => {
    it('génère la plage inclusive [min, max]', () => {
      expect(intensityValuesFor(1, 5)).toEqual([1, 2, 3, 4, 5])
      expect(intensityValuesFor(0, 3)).toEqual([0, 1, 2, 3])
    })
    it('renvoie un tableau vide si min > max', () => {
      expect(intensityValuesFor(5, 1)).toEqual([])
    })
  })

  describe('buildStepLabels', () => {
    const props = {
      step_1_title: 'm.s1t', step_1_hint: 'm.s1h',
      step_3_title: 'm.s3t', step_4_title: 'm.s4t', step_4_hint: 'm.s4h',
      intensity_min: '1',
    }
    it('résout les titres pour TOUS les niveaux présents (profondeur libre)', () => {
      expect(buildStepLabels(props, t, 'title')).toEqual({ 1: 'T:m.s1t', 3: 'T:m.s3t', 4: 'T:m.s4t' })
    })
    it('résout les indices indépendamment des titres', () => {
      expect(buildStepLabels(props, t, 'hint')).toEqual({ 1: 'T:m.s1h', 4: 'T:m.s4h' })
    })
    it('ignore les clés sans code et les clés étrangères', () => {
      expect(buildStepLabels({ step_2_title: '' }, t, 'title')).toEqual({})
    })
  })

  describe('buildRawNodes', () => {
    const fields: ContentField[] = [
      field({ id: 'cfg', field_type: 'tree_selector_config' }),
      field({ id: 'b', text_code: 'n.b', sort_order: 2, props: { color: '#000' } }),
      field({
        id: 'a', text_code: 'n.a', sort_order: 1,
        children: [field({ id: 'a1', parent_field_id: 'a', text_code: 'n.a1', sort_order: 1 })],
      }),
    ]
    it('ne garde que les tree_node racines, triés par sort_order', () => {
      const nodes = buildRawNodes(fields)
      expect(nodes.map(n => n.id)).toEqual(['a', 'b'])
    })
    it('convertit récursivement les enfants', () => {
      const nodes = buildRawNodes(fields)
      expect(nodes[0].children.map(c => c.id)).toEqual(['a1'])
    })
  })

  describe('buildNodeMap', () => {
    it('indexe tous les nœuds (récursif) par id', () => {
      const nodes = buildRawNodes([
        field({ id: 'a', text_code: 'n.a', children: [field({ id: 'a1', parent_field_id: 'a', text_code: 'n.a1' })] }),
      ])
      const map = buildNodeMap(nodes)
      expect([...map.keys()].sort()).toEqual(['a', 'a1'])
    })
  })

  describe('toUiNodes', () => {
    it('résout les libellés et préserve couleur/emoji/icon', () => {
      const ui = toUiNodes(buildRawNodes([
        field({ id: 'a', text_code: 'n.a', props: { color: '#F00', emoji: '😊', icon: 'star' } }),
      ]), t)
      expect(ui[0]).toMatchObject({ id: 'a', label: 'T:n.a', color: '#F00', emoji: '😊', icon: 'star' })
    })
  })

  describe('reconstructPath', () => {
    const map = buildNodeMap(buildRawNodes([
      field({ id: 'a', text_code: 'n.a', props: { color: '#F00' }, children: [
        field({ id: 'a1', parent_field_id: 'a', text_code: 'n.a1' }),
      ] }),
    ]))
    it('reconstruit le chemin avec text_code/couleur depuis les ids', () => {
      const path = reconstructPath(['a', 'a1'], map)
      expect(path).toEqual([
        { id: 'a', text_code: 'n.a', color: '#F00', icon: undefined, emoji: undefined },
        { id: 'a1', text_code: 'n.a1', color: undefined, icon: undefined, emoji: undefined },
      ])
    })
    it('ignore silencieusement un id inconnu', () => {
      expect(reconstructPath(['a', 'ghost'], map).map(n => n.id)).toEqual(['a'])
    })
  })

  describe('toEntryVM', () => {
    const entry: TreeSelection = {
      id: 'sel-1', module_id: 'emotion_wheel', selected_id: 'a1', selected_label: 'n.a1',
      path: [
        { id: 'a', text_code: 'n.a', color: '#F59E0B', icon: 'star' },
        { id: 'a1', text_code: 'n.a1' },
      ],
      intensity: 6, notes: 'note', context: ['c.work'], created_at: '2026-05-05T10:00:00Z',
    }
    it('mappe libellés, badge d\'intensité, contexte et date', () => {
      const vm = toEntryVM(entry, t, 10, iso => `D:${iso}`)
      expect(vm).toMatchObject({
        id: 'sel-1', accentColor: '#F59E0B', icon: 'star',
        primaryLabel: 'T:n.a', secondaryLabel: 'T:n.a1',
        intensityLabel: '6/10', contextLabels: ['T:c.work'],
        notes: 'note', dateLabel: 'D:2026-05-05T10:00:00Z',
      })
    })
    it('intensityLabel null quand pas d\'intensité', () => {
      const vm = toEntryVM({ ...entry, intensity: null }, t, 10, iso => iso)
      expect(vm.intensityLabel).toBeNull()
    })
  })
})
