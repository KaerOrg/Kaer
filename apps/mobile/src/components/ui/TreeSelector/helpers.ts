// Helpers purs du primitive `ui/TreeSelector` (aucun état, aucune traduction).

import { colors } from '@theme'
import type { TreeSelectorNode } from './types'

/** Couleur du nœud le plus profond du chemin qui porte une couleur, sinon `primary`. */
export function resolveAccentColor(path: TreeSelectorNode[]): string {
  for (let i = path.length - 1; i >= 0; i -= 1) {
    const color = path[i].color
    if (color) return color
  }
  return colors.primary
}

/** Fil d'Ariane « A › B › C » à partir du chemin courant. */
export function buildBreadcrumb(path: TreeSelectorNode[]): string {
  return path.map(n => n.label).filter(Boolean).join(' › ')
}
