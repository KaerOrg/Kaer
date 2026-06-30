// Helpers purs du wrapper web `tree_selector` : conversion des fields du moteur de
// modules vers les view-models du primitive `@ui/TreeSelector`.

import { collectIndexed } from '@kaer/shared'
import type { ContentField } from '@services/moduleService'
import type { TreeSelectorContextOption, TreeSelectorNode } from '@ui/TreeSelector'

/** parseInt tolérant : renvoie `fallback` si la valeur est absente ou non numérique. */
export function parseIntOr(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? '', 10)
  return Number.isNaN(n) ? fallback : n
}

/** Valeurs d'intensité affichables pour la plage [min, max]. */
export function intensityValuesFor(min: number, max: number): number[] {
  const out: number[] = []
  for (let v = min; v <= max; v += 1) out.push(v)
  return out
}

/**
 * Résout les libellés d'étape `step_<N>_<kind>` pour TOUS les niveaux présents
 * dans la config (profondeur libre — pas de cap à 3 niveaux).
 */
export function buildStepLabels(
  props: Record<string, string>,
  t: (key: string) => string,
  kind: 'title' | 'hint',
): Record<number, string> {
  const re = new RegExp(`^step_(\\d+)_${kind}$`)
  const out: Record<number, string> = {}
  for (const key of Object.keys(props)) {
    const match = re.exec(key)
    if (!match) continue
    const code = props[key]
    if (code) out[Number(match[1])] = t(code)
  }
  return out
}

/** Construit l'arbre prêt à afficher depuis les fields `tree_node` imbriqués. */
export function buildUiNodes(fields: ContentField[], t: (key: string) => string): TreeSelectorNode[] {
  const convert = (f: ContentField): TreeSelectorNode => ({
    id: f.id,
    label: f.text_code ? t(f.text_code) : '',
    color: f.props['color'],
    emoji: f.props['emoji'],
    children: (f.children ?? [])
      .filter(c => c.field_type === 'tree_node')
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(convert),
  })
  return fields
    .filter(f => f.field_type === 'tree_node' && f.parent_field_id == null)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(convert)
}

/** Options de contexte (chips) résolues depuis les clés indexées `context_opt_N`. */
export function buildContextOptions(
  props: Record<string, string>,
  t: (key: string) => string,
): TreeSelectorContextOption[] {
  return collectIndexed(props, 'context_opt').map(code => ({ code, label: t(code) }))
}
