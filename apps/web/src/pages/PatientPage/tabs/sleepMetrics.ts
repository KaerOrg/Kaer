// Métriques cliniques de l'agenda du sommeil (panneau praticien) : le catalogue
// FIXE des 6 métriques traçables, avec extracteur, unité et barème. Ce n'est pas
// du contenu éditable (config-first) mais de la configuration de rendu + logique
// d'extraction — chaque `labelKey` pointe une clé i18n, jamais du texte en dur.

import type { SleepPoint } from '@services/engagementService'

export type SleepMetricKey = 'efficiency' | 'duration' | 'onset' | 'waso' | 'naps' | 'quality'

export interface SleepMetricDef {
  key: SleepMetricKey
  /** Clé i18n du libellé (chip + titre de graphe). */
  labelKey: string
  /** Unité affichée (axe Y, moyenne, tooltip). */
  unit: string
  /** Barème fixe ; absent → borné dynamiquement sur les données (`metricDomain`). */
  fixedDomain?: [number, number]
  /** Marquer les cauchemars sur l'axe (métriques efficacité / durée). */
  markNightmares: boolean
  /** Valeur brute de la nuit pour cette métrique (`null` = non renseignée). */
  value: (p: SleepPoint) => number | null
}

export const SLEEP_METRICS: readonly SleepMetricDef[] = [
  { key: 'efficiency', labelKey: 'evolution.sleep_metric_efficiency', unit: '%', fixedDomain: [0, 100], markNightmares: true, value: p => p.efficiency },
  { key: 'duration', labelKey: 'evolution.sleep_metric_duration', unit: 'h', fixedDomain: [0, 12], markNightmares: true, value: p => p.total_sleep_min == null ? null : Math.round((p.total_sleep_min / 60) * 10) / 10 },
  { key: 'onset', labelKey: 'evolution.sleep_metric_onset', unit: 'min', markNightmares: false, value: p => p.onset_min },
  { key: 'waso', labelKey: 'evolution.sleep_metric_waso', unit: 'min', markNightmares: false, value: p => p.waso_min },
  { key: 'naps', labelKey: 'evolution.sleep_metric_naps', unit: 'min', markNightmares: false, value: p => p.nap_min },
  { key: 'quality', labelKey: 'evolution.sleep_metric_quality', unit: '/5', fixedDomain: [0, 5], markNightmares: false, value: p => p.quality },
]

/** Plus petit multiple de `step` ≥ max des valeurs, avec un plancher (barème lisible). */
export function niceMax(values: number[], floor = 60, step = 15): number {
  const max = values.length > 0 ? Math.max(...values) : 0
  return Math.max(floor, Math.ceil(max / step) * step)
}

/** Barème de l'axe Y : fixe si défini, sinon [0, niceMax] borné sur les données. */
export function metricDomain(def: SleepMetricDef, points: SleepPoint[]): [number, number] {
  if (def.fixedDomain) return def.fixedDomain
  const values = points.map(def.value).filter((v): v is number => v != null)
  return [0, niceMax(values)]
}
