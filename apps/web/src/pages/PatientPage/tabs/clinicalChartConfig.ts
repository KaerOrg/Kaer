// Presets de graphiques propres aux modules cliniques (échelles, humeur, peur).
// Domaine métier : bornes d'axe par échelle, dimensions d'humeur, couleurs SUDS.
// Les couleurs sont tirées de la palette générique (`lib/chartConfig`).

import { CHART_PALETTE, DEFAULT_CHART_COLOR } from '../../../lib/chartConfig'

// Couleur de tracé + borne haute de l'axe Y par échelle clinique (yMax = domaine).
export const SCALE_CONFIG: Record<string, { color: string; yMax: number }> = {
  phq9:    { color: CHART_PALETTE[0],  yMax: 27 },
  gad7:    { color: CHART_PALETTE[2],  yMax: 21 },
  bsl23:   { color: CHART_PALETTE[3],  yMax: 4  },
  epds:    { color: CHART_PALETTE[5],  yMax: 30 },
  rcads:   { color: CHART_PALETTE[4],  yMax: 50 },
  asrs6:   { color: CHART_PALETTE[6],  yMax: 24 },
  snap_iv: { color: CHART_PALETTE[7],  yMax: 78 },
  nsi:     { color: CHART_PALETTE[12], yMax: 45 },
}

export const DEFAULT_SCALE_COLOR = DEFAULT_CHART_COLOR

// Dimensions du mood tracker (clés métier + couleur de série).
export const MOOD_DIMENSIONS = [
  { key: 'humeur',       color: CHART_PALETTE[1]  },
  { key: 'energie',      color: CHART_PALETTE[6]  },
  { key: 'anxiete',      color: CHART_PALETTE[3]  },
  { key: 'plaisir',      color: CHART_PALETTE[2]  },
  { key: 'sommeil',      color: CHART_PALETTE[4]  },
  { key: 'alimentation', color: CHART_PALETTE[5]  },
] as const

// Thermomètre de la peur — SUDS avant / après exposition.
export const FEAR_BEFORE_COLOR = CHART_PALETTE[2]
export const FEAR_AFTER_COLOR = CHART_PALETTE[1]

// Activation comportementale — P/A ressentis (mêmes teintes que l'app patient).
export const BA_PLEASURE_COLOR = CHART_PALETTE[1]
export const BA_MASTERY_COLOR = CHART_PALETTE[0]

// ─── Config par type de module — source de vérité de l'aperçu et du graphe (#159) ──
//
// Pilote le bandeau d'aperçu (métrique clé, teinte d'identité) et le graphe long
// terme (unité, bornes Y, cadence d'agrégation, marqueurs d'événement). MDR :
// valeurs brutes, aucune bande de sévérité ni interprétation.

// Rythme naturel du module : pilote l'agrégation de la courbe longue durée.
//   - weekly        : 1 point/semaine (sommeil, humeur, activation) ;
//   - per_session   : 1 point/exposition (peur) ;
//   - per_passation : 1 point/passation (échelles cliniques).
export type ModuleCadence = 'weekly' | 'per_session' | 'per_passation'

// Nature du rendu d'aperçu/graphe :
//   - metric      : une métrique clé chiffrée + courbe (sommeil, activation) ;
//   - fingerprint : mini-empreinte multi-dimensions, aucun agrégat (humeur, #161) ;
//   - scale       : score brut d'échelle sur l'axe 0..max ;
//   - text        : non chiffrable → section « Journaux & notes », hors courbes.
export type ModuleEvolutionKind = 'metric' | 'fingerprint' | 'scale' | 'text'

export interface ModuleEvolutionConfig {
  readonly key: string
  readonly labelKey: string
  readonly color: string
  readonly unit: string
  readonly yDomain: readonly [number, number]
  /** Clé i18n de la métrique clé du bandeau (ignorée si kind='fingerprint'/'text'). */
  readonly overviewMetricKey: string
  readonly cadence: ModuleCadence
  readonly events?: readonly { readonly key: string; readonly labelKey: string }[]
  readonly kind: ModuleEvolutionKind
}

export const MODULE_EVOLUTION_CONFIG: Record<string, ModuleEvolutionConfig> = {
  sleep_diary: {
    key: 'sleep_diary', labelKey: 'evolution.sleep_section_title', color: CHART_PALETTE[7],
    unit: '%', yDomain: [0, 100], overviewMetricKey: 'evolution.sleep_avg_efficiency',
    cadence: 'weekly', events: [{ key: 'nightmares', labelKey: 'evolution.sleep_legend_nightmare' }],
    kind: 'metric',
  },
  mood_tracker: {
    key: 'mood_tracker', labelKey: 'evolution.mood_title', color: CHART_PALETTE[0],
    unit: '/10', yDomain: [1, 10], overviewMetricKey: 'evolution.mood_recents_title',
    cadence: 'weekly', kind: 'fingerprint',
  },
  behavioral_activation: {
    key: 'behavioral_activation', labelKey: 'evolution.ba_section_title', color: CHART_PALETTE[1],
    unit: '%', yDomain: [0, 100], overviewMetricKey: 'evolution.ba_completion_rate',
    cadence: 'weekly', kind: 'metric',
  },
  fear_thermometer: {
    key: 'fear_thermometer', labelKey: 'evolution.fear_title', color: CHART_PALETTE[2],
    unit: 'pts', yDomain: [-100, 0], overviewMetricKey: 'evolution.fear_delta',
    cadence: 'per_session', kind: 'metric',
  },
  // Effets indésirables : plusieurs effets 0..10 → empreinte (une barre par effet,
  // aucun agrégat composite, comme l'humeur). Couleur neutre (ni rouge ni orange :
  // pas de codage de gravité, MDR).
  medication_side_effects: {
    key: 'medication_side_effects', labelKey: 'evolution.med_effects_title', color: CHART_PALETTE[11],
    unit: '/10', yDomain: [0, 10], overviewMetricKey: 'evolution.med_effects_title',
    cadence: 'weekly', kind: 'fingerprint',
  },
}

/** Config du module, avec repli sur une échelle clinique (score brut) si absente. */
export function moduleEvolutionConfig(moduleType: string): ModuleEvolutionConfig {
  const cfg = MODULE_EVOLUTION_CONFIG[moduleType]
  if (cfg != null) return cfg
  const scale = SCALE_CONFIG[moduleType]
  return {
    key: moduleType,
    labelKey: `modules.${moduleType}.label`,
    color: scale?.color ?? DEFAULT_SCALE_COLOR,
    unit: 'score',
    yDomain: [0, scale?.yMax ?? 27],
    overviewMetricKey: 'evolution.last_score',
    cadence: 'per_passation',
    kind: 'scale',
  }
}
