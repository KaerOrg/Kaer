// Repères chronobiologiques côté web : la source unique (ordre, couleur, clé i18n)
// vit dans `@psytool/shared` (CHRONO_ANCHORS) pour garantir la parité web ≡ mobile.
// Ce fichier n'ajoute que le helper de tracé web (fusion config + stats brutes).

import { CHRONO_ANCHORS, type RhythmAnchorStat } from '@psytool/shared'

export { CHRONO_ANCHORS, CHRONO_ANCHOR_KEYS } from '@psytool/shared'
export type { ChronoAnchorSpec } from '@psytool/shared'

/** Un repère prêt pour le tracé : couleur, libellé résolu, écart-type, nb de jours. */
export interface RhythmogramAnchor {
  key: string
  color: string
  label: string
  sdMinutes: number
  count: number
}

/**
 * Fusionne la config des repères (couleur + libellé i18n) avec les stats brutes
 * d'un mois (`buildRhythmogram().anchors`) → repères prêts pour le rythmogramme.
 * Partagé par le panneau Données et l'aperçu praticien.
 */
export function buildRhythmogramAnchors(
  stats: readonly RhythmAnchorStat[],
  t: (key: string) => string,
): RhythmogramAnchor[] {
  return CHRONO_ANCHORS.map(cfg => {
    const stat = stats.find(s => s.key === cfg.key)
    return {
      key: cfg.key,
      color: cfg.color,
      label: t(cfg.labelCode),
      sdMinutes: stat?.sdMinutes ?? 0,
      count: stat?.count ?? 0,
    }
  })
}
