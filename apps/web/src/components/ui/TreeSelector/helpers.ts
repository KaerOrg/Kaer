// Helpers purs du primitive `ui/TreeSelector` web (aucun état, aucune traduction).

import type { TreeSelectorNode } from './types'

/** Couleur du nœud le plus profond du chemin qui porte une couleur, sinon primary. */
export function resolveAccent(path: TreeSelectorNode[]): string {
  for (let i = path.length - 1; i >= 0; i -= 1) {
    const color = path[i].color
    if (color) return color
  }
  return 'var(--color-primary)'
}

/** Fil d'Ariane « A › B › C » à partir du chemin courant. */
export function buildBreadcrumb(path: TreeSelectorNode[]): string {
  return path.map(n => n.label).filter(Boolean).join(' › ')
}

/** Teinte de fond dérivée d'une couleur (transparente si hex, surface sinon). */
export function tintOf(color: string, alphaSuffix = '14'): string {
  return color.startsWith('#') ? `${color}${alphaSuffix}` : 'var(--color-surface)'
}
