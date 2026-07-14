// Repères chronobiologiques côté web : la source unique (ordre, couleur, clé i18n)
// vit dans `@kaer/shared` (CHRONO_ANCHORS) pour garantir la parité web ≡ mobile.
// Ce fichier n'ajoute que le helper de tracé web (fusion config + stats brutes).

import { CHRONO_ANCHORS, type RhythmAnchorStat, type RhythmEntry } from '@kaer/shared'

export { CHRONO_ANCHORS, CHRONO_ANCHOR_KEYS } from '@kaer/shared'
export type { ChronoAnchorSpec } from '@kaer/shared'

export interface YearMonth {
  year: number
  month: number // 1-12
}

/** Mois distincts présents dans les saisies, du plus ancien au plus récent. */
export function monthsWithData(entries: readonly RhythmEntry[]): YearMonth[] {
  const seen = new Set<string>()
  const out: YearMonth[] = []
  for (const e of entries) {
    const ym = e.date.slice(0, 7) // YYYY-MM
    if (seen.has(ym)) continue
    seen.add(ym)
    out.push({ year: Number(ym.slice(0, 4)), month: Number(ym.slice(5, 7)) })
  }
  out.sort((a, b) => a.year - b.year || a.month - b.month)
  return out
}

/** Un repère prêt pour le tracé : couleur, icône, libellé résolu, écart-type, nb de jours. */
export interface RhythmogramAnchor {
  key: string
  color: string
  /** Nom d'icône lucide (source unique `CHRONO_ANCHORS`, parité web ≡ mobile). */
  iconName: string
  label: string
  sdMinutes: number
  count: number
}

/**
 * Fusionne la config des repères (couleur + icône + libellé i18n) avec les stats
 * brutes d'un mois (`buildRhythmogram().anchors`) → repères prêts pour le rythmogramme,
 * le tableau Données et la carte de suivi. Partagé — source unique `CHRONO_ANCHORS`.
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
      iconName: cfg.iconName,
      label: t(cfg.labelCode),
      sdMinutes: stat?.sdMinutes ?? 0,
      count: stat?.count ?? 0,
    }
  })
}
