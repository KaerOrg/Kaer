// Helpers purs du layout métier `tree_selector` : conversion des fields du
// moteur de modules vers les view-models du primitive `ui/TreeSelector`, et
// reconstruction d'un chemin de persistance depuis des ids opaques.

import { colors } from '@theme'
import type { ContentField } from '@services/moduleService'
import type { TreeSelection, TreeSelectionPathNode } from '../../../../../lib/database'
import type { McIcon, TreeSelectorEntry, TreeSelectorNode } from '@ui/TreeSelector'
import type { RawTreeNode } from './types'

/**
 * Marqueur de `selected_id` pour une entrée « sans mot » (K-7). La colonne SQLite est
 * `NOT NULL` depuis l'origine et la lever demanderait de reconstruire la table :
 * l'entrée porte donc cette chaîne vide, et c'est le **chemin vide** (`path.length === 0`)
 * qui identifie sémantiquement une entrée sans émotion nommée.
 */
export const WORDLESS_SELECTED_ID = ''

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
    def_code: f.props['def'],
    color: f.props['color'],
    icon: f.props['icon'],
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
    definition: n.def_code ? t(n.def_code) : undefined,
    color: n.color,
    icon: n.icon,
    children: toUiNodes(n.children, t),
  }))
}

/** Libellés d'en-tête du groupement par jour, déjà traduits. */
export interface DayGroupLabels {
  today: string
  yesterday: string
  /** Formate la date d'un jour plus ancien (ex. « 12 juillet »). */
  older: (iso: string) => string
}

/**
 * Groupe des entrées par jour civil, dans l'ordre chronologique inverse.
 *
 * Le jour est calculé sur les composants **locaux** de la date, jamais via
 * `toISOString()` : en fuseau positif, minuit local retombe sur la veille en UTC et
 * l'entrée changerait de groupe (cf. `.claude/rules/lessons.md` § Dates).
 *
 * Conformité MDR : ce groupement est une navigation. Il ne calcule aucun total par
 * jour, aucune moyenne, aucune comparaison d'un groupe à l'autre.
 */
export function groupEntriesByDay<T extends { created_at: string }>(
  entries: T[],
  labels: DayGroupLabels,
  now: Date,
): { title: string; entries: T[] }[] {
  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const todayKey = dayKey(now)
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const yesterdayKey = dayKey(yesterday)

  const order: string[] = []
  const buckets = new Map<string, T[]>()
  for (const entry of entries) {
    const key = dayKey(new Date(entry.created_at))
    if (!buckets.has(key)) { buckets.set(key, []); order.push(key) }
    buckets.get(key)?.push(entry)
  }

  return order.map(key => ({
    title: key === todayKey ? labels.today : key === yesterdayKey ? labels.yesterday : labels.older(key),
    entries: buckets.get(key) ?? [],
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
    })
  }
  return path
}

function resolvePathLabel(node: TreeSelectionPathNode, t: (key: string) => string): string {
  if (node.text_code) return t(node.text_code)
  if (node.label) return node.label
  return node.id
}

/**
 * Convertit une entrée persistée en view-model d'historique pour le primitive.
 *
 * La teinte et l'icône sont relues dans la **taxonomie courante** (`nodeMap`) et non
 * dans le chemin persisté : une entrée saisie avant la pastellisation des familles
 * (K-4) porte encore l'ancienne couleur saturée dans son `path`. La donnée du patient
 * n'est pas réécrite, seul l'affichage suit la config. La valeur stockée reste le
 * repli si la famille a disparu du seed.
 */
export function toEntryVM(
  entry: TreeSelection,
  t: (key: string) => string,
  intensityMax: number,
  formatDate: (iso: string) => string,
  nodeMap: Map<string, RawTreeNode>,
  wordlessLabel = '',
): TreeSelectorEntry {
  const rootNode = entry.path[0]
  const current = rootNode ? nodeMap.get(rootNode.id) : undefined
  // Entrée sans émotion nommée : filet gris neutre, pas la teinte d'une famille
  // qu'elle n'a pas. C'est une entrée légitime, pas une entrée dégradée (K-7).
  const accentColor = rootNode ? (current?.color ?? rootNode.color ?? colors.primary) : colors.border
  const labels = entry.path.map(n => resolvePathLabel(n, t)).filter(Boolean)
  return {
    id: entry.id,
    accentColor,
    icon: (current?.icon ?? rootNode?.icon ?? 'palette-outline') as McIcon,
    primaryLabel: labels[0] ?? wordlessLabel,
    secondaryLabel: labels.slice(1).join(' · '),
    intensityLabel: entry.intensity != null ? `${entry.intensity}/${intensityMax}` : null,
    // Le contexte libre n'est PAS résolu par `t()` : c'est du texte patient, pas une
    // clé. Il ferme la liste des chips, après les domaines déclarés.
    contextLabels: [
      ...entry.context.map(code => t(code)),
      ...(entry.context_other ? [entry.context_other] : []),
    ],
    notes: entry.notes,
    dateLabel: formatDate(entry.created_at),
  }
}
