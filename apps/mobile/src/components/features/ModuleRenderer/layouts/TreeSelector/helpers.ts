// Helpers purs du layout métier `tree_selector` : conversion des fields du
// moteur de modules vers les view-models du primitive `ui/TreeSelector`, et
// reconstruction d'un chemin de persistance depuis des ids opaques.

import { colors } from '@theme'
import type { ContentField } from '@services/moduleService'
import type { TreeSelection, TreeSelectionPathNode } from '../../../../../lib/database'
import type { McIcon, TreeSelectorEntry, TreeSelectorNode } from '@ui/TreeSelector'
import type { RawTreeNode } from './types'

/** parseInt tolérant : renvoie `fallback` si la valeur est absente ou non numérique. */
export function parseIntOr(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? '', 10)
  return Number.isNaN(n) ? fallback : n
}

/** Valeurs d'intensité affichables pour la plage [min, max]. */
export function intensityValuesFor(min: number, max: number): number[] {
  const result: number[] = []
  for (let v = min; v <= max; v += 1) result.push(v)
  return result
}

/**
 * Résout les libellés d'étape de navigation `step_<N>_<kind>` pour TOUS les
 * niveaux présents dans la config (profondeur libre — pas de cap à 3 niveaux).
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

/** Construit l'arbre brut depuis les fields `tree_node` (tri par `sort_order`). */
export function buildRawNodes(fields: ContentField[]): RawTreeNode[] {
  const convert = (f: ContentField): RawTreeNode => ({
    id: f.id,
    text_code: f.text_code,
    color: f.props['color'],
    icon: f.props['icon'],
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

/** Index id → nœud brut (récursif), pour reconstruire un chemin à la persistance. */
export function buildNodeMap(nodes: RawTreeNode[]): Map<string, RawTreeNode> {
  const map = new Map<string, RawTreeNode>()
  const walk = (list: RawTreeNode[]) => {
    for (const node of list) {
      map.set(node.id, node)
      walk(node.children)
    }
  }
  walk(nodes)
  return map
}

/** Traduit l'arbre brut en nœuds prêts à afficher pour le primitive. */
export function toUiNodes(nodes: RawTreeNode[], t: (key: string) => string): TreeSelectorNode[] {
  return nodes.map(n => ({
    id: n.id,
    label: n.text_code ? t(n.text_code) : '',
    color: n.color,
    icon: n.icon,
    emoji: n.emoji,
    children: toUiNodes(n.children, t),
  }))
}

/** Reconstruit un chemin de persistance (avec `text_code`) depuis des ids opaques. */
export function reconstructPath(
  pathIds: string[],
  nodeMap: Map<string, RawTreeNode>,
): TreeSelectionPathNode[] {
  const path: TreeSelectionPathNode[] = []
  for (const id of pathIds) {
    const node = nodeMap.get(id)
    if (!node) continue
    path.push({
      id: node.id,
      text_code: node.text_code ?? undefined,
      color: node.color,
      icon: node.icon,
      emoji: node.emoji,
    })
  }
  return path
}

function resolvePathLabel(node: TreeSelectionPathNode, t: (key: string) => string): string {
  if (node.text_code) return t(node.text_code)
  if (node.label) return node.label
  return node.id
}

/** Convertit une entrée persistée en view-model d'historique pour le primitive. */
export function toEntryVM(
  entry: TreeSelection,
  t: (key: string) => string,
  intensityMax: number,
  formatDate: (iso: string) => string,
): TreeSelectorEntry {
  const rootNode = entry.path[0]
  const accentColor = rootNode?.color ?? colors.primary
  const labels = entry.path.map(n => resolvePathLabel(n, t)).filter(Boolean)
  return {
    id: entry.id,
    accentColor,
    icon: (rootNode?.icon ?? 'palette-outline') as McIcon,
    emoji: rootNode?.emoji,
    primaryLabel: labels[0] ?? '',
    secondaryLabel: labels.slice(1).join(' · '),
    intensityLabel: entry.intensity != null ? `${entry.intensity}/${intensityMax}` : null,
    contextLabels: entry.context.map(code => t(code)),
    notes: entry.notes,
    dateLabel: formatDate(entry.created_at),
  }
}
