import { describe, it, expect } from 'vitest'
import { collectRenderMismatches } from '@kaer/shared'
import type { ContentField } from '@kaer/shared'

// Couvre le détecteur PUR partagé `collectRenderMismatches` (placé ici car les tests de
// packages/shared ne tournent pas dans la CI ; web l'importe depuis la source).

function field(over: Partial<ContentField> = {}): ContentField {
  return {
    id: 'f1', module_id: 'mood_tracker', section_id: null, parent_field_id: null,
    field_type: 'card_paragraph', text_code: 'modules.x.y', sort_order: 0, props: {}, children: [],
    ...over,
  }
}

describe('collectRenderMismatches', () => {
  it('preview_kind connu + fields sains → aucun non-match', () => {
    expect(collectRenderMismatches('steps', [field()])).toEqual([])
  })

  it('preview_kind inconnu → 1 non-match preview_kind (module_id dérivé des fields)', () => {
    const out = collectRenderMismatches('mood_tracker', [field()])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ level: 'preview_kind', preview_kind: 'mood_tracker', module_id: 'mood_tracker' })
  })

  it('widget_type inconnu → 1 non-match widget_type avec contexte field', () => {
    const out = collectRenderMismatches('fields', [field({ id: 'f9', props: { widget_type: 'slider' } })])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ level: 'widget_type', widget_type: 'slider', field_id: 'f9' })
  })

  it('widget_type rendu (text / info) → aucun non-match', () => {
    expect(collectRenderMismatches('fields', [field({ props: { widget_type: 'text' } })])).toEqual([])
    expect(collectRenderMismatches('fields', [field({ props: { widget_type: 'info' } })])).toEqual([])
  })

  it('parcourt les children en profondeur', () => {
    const child = field({ id: 'c1', props: { widget_type: 'stars' } })
    const out = collectRenderMismatches('steps', [field({ children: [child] })])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ level: 'widget_type', field_id: 'c1', widget_type: 'stars' })
  })

  it('cumule plusieurs non-match (preview_kind + widget_type)', () => {
    const out = collectRenderMismatches('unknown_kind', [field({ props: { widget_type: 'slider' } })])
    expect(out.map(m => m.level).sort()).toEqual(['preview_kind', 'widget_type'])
  })

  it('fields vide → aucun crash, aucun non-match si preview_kind connu', () => {
    expect(collectRenderMismatches('psyedu', [])).toEqual([])
  })
})
