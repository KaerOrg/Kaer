import { describe, it, expect } from 'vitest'
// Cœur pur de l'audit de dérive (scripts/lib) — testé depuis le job vitest web.
import { CONFIG_TABLES, diffTable, hasDrift } from '../../../../scripts/lib/configDiff.mjs'

// ─── Audit de dérive config seed ↔ base — module de diff pur (ticket #203) ──────

const FIELD_PROPS = { table: 'field_props', keyColumns: ['field_id', 'prop_key'] }

describe('configDiff — diffTable', () => {
  it('aligné : mêmes lignes des deux côtés → zéro écart', () => {
    const rows = [
      { field_id: 'et.cfg', prop_key: 'suds_before_color', prop_value: '#C9B8E4' },
      { field_id: 'et.cfg', prop_key: 'suds_after_color', prop_value: '#B8D4C9' },
    ]
    const res = diffTable(FIELD_PROPS, rows, rows)
    expect(res.missing).toEqual([])
    expect(res.extra).toEqual([])
    expect(res.changed).toEqual([])
  })

  it('dérive de valeur : même clé, prop_value différente → changed', () => {
    const seed = [{ field_id: 'et.cfg', prop_key: 'suds_before_color', prop_value: '#C9B8E4' }]
    const target = [{ field_id: 'et.cfg', prop_key: 'suds_before_color', prop_value: '#EF4444' }]
    const res = diffTable(FIELD_PROPS, seed, target)
    expect(res.changed).toHaveLength(1)
    expect(res.changed[0].seed.prop_value).toBe('#C9B8E4')
    expect(res.changed[0].target.prop_value).toBe('#EF4444')
    expect(res.missing).toEqual([])
    expect(res.extra).toEqual([])
  })

  it('jamais déployé : ligne du seed absente de la cible → missing', () => {
    const seed = [{ field_id: 'mb.cfg', prop_key: 'tab_1', prop_value: 'x' }]
    const res = diffTable(FIELD_PROPS, seed, [])
    expect(res.missing).toHaveLength(1)
    expect(res.missing[0].field_id).toBe('mb.cfg')
  })

  it('orpheline : ligne en cible absente du seed → extra', () => {
    const target = [{ field_id: 'legacy', prop_key: 'old', prop_value: 'x' }]
    const res = diffTable(FIELD_PROPS, [], target)
    expect(res.extra).toHaveLength(1)
    expect(res.extra[0].field_id).toBe('legacy')
  })

  it('clé composite : deux props du même field_id ne collisionnent pas', () => {
    const seed = [
      { field_id: 'f', prop_key: 'a', prop_value: '1' },
      { field_id: 'f', prop_key: 'b', prop_value: '2' },
    ]
    const target = [
      { field_id: 'f', prop_key: 'a', prop_value: '1' },
      { field_id: 'f', prop_key: 'b', prop_value: '99' },
    ]
    const res = diffTable(FIELD_PROPS, seed, target)
    expect(res.changed).toHaveLength(1)
    expect(res.changed[0].seed.prop_key).toBe('b')
  })

  it('ordre des colonnes indifférent : comparaison déterministe (clés triées)', () => {
    const seed = [{ field_id: 'f', prop_key: 'a', prop_value: '1' }]
    const target = [{ prop_value: '1', prop_key: 'a', field_id: 'f' }]
    expect(diffTable(FIELD_PROPS, seed, target).changed).toEqual([])
  })

  it('ignore : une colonne volatile n\'est pas comptée comme dérive', () => {
    const spec = { table: 't', keyColumns: ['id'], ignore: ['updated_at'] }
    const seed = [{ id: '1', v: 'x', updated_at: '2026-01-01' }]
    const target = [{ id: '1', v: 'x', updated_at: '2026-07-24' }]
    expect(diffTable(spec, seed, target).changed).toEqual([])
  })
})

describe('configDiff — hasDrift', () => {
  it('false quand toutes les tables sont alignées', () => {
    expect(hasDrift([{ table: 't', missing: [], extra: [], changed: [] }])).toBe(false)
  })

  it('true dès qu\'une table porte un écart', () => {
    expect(hasDrift([
      { table: 'a', missing: [], extra: [], changed: [] },
      { table: 'b', missing: [{ id: 1 }], extra: [], changed: [] },
    ])).toBe(true)
  })
})

describe('configDiff — CONFIG_TABLES', () => {
  it('chaque table déclare une clé non vide', () => {
    for (const spec of CONFIG_TABLES) {
      expect(spec.keyColumns.length).toBeGreaterThan(0)
    }
  })

  it('field_props est audité sur sa clé composite (cœur du critère 5)', () => {
    const fp = CONFIG_TABLES.find((t) => t.table === 'field_props')
    expect(fp?.keyColumns).toEqual(['field_id', 'prop_key'])
  })

  it('aucune table à surrogate uuid non-stable (psyedu_blocks, module_sources)', () => {
    const names = CONFIG_TABLES.map((t) => t.table)
    expect(names).not.toContain('psyedu_blocks')
    expect(names).not.toContain('module_sources')
  })

  it('psyedu_topics ignore created_at (colonne volatile — sinon faux positif)', () => {
    const topics = CONFIG_TABLES.find((t) => t.table === 'psyedu_topics')
    expect(topics?.ignore).toContain('created_at')
  })
})
