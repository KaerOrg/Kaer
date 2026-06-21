// Source de vérité web des repères chronobiologiques : ordre canonique, couleur
// et clé i18n de libellé. Identiques au mobile (chronoMonthUtils.DEFAULT_ANCHORS)
// pour garantir la cohérence web ≡ mobile des vues (aperçu, rythmogramme).

import type { RhythmAnchorStat } from '@psytool/shared'

export interface ChronoAnchorSpec {
  key: string
  /** Clé i18n du libellé court (légende, axes). */
  labelCode: string
  color: string
}

// Même ordre que le mobile (chronoMonthUtils.DEFAULT_ANCHORS) → légendes identiques.
export const CHRONO_ANCHORS: readonly ChronoAnchorSpec[] = [
  { key: 'wake_time', labelCode: 'modules.chronobiology_tracker.anchor_wake', color: '#F59E0B' },
  { key: 'first_meal', labelCode: 'modules.chronobiology_tracker.anchor_first_meal', color: '#F97316' },
  { key: 'main_activity', labelCode: 'modules.chronobiology_tracker.anchor_main_activity', color: '#3B82F6' },
  { key: 'light', labelCode: 'modules.chronobiology_tracker.anchor_light', color: '#14B8A6' },
  { key: 'last_meal', labelCode: 'modules.chronobiology_tracker.anchor_last_meal', color: '#EF4444' },
  { key: 'bedtime', labelCode: 'modules.chronobiology_tracker.anchor_bedtime', color: '#8B5CF6' },
]

export const CHRONO_ANCHOR_KEYS: readonly string[] = CHRONO_ANCHORS.map(a => a.key)

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
