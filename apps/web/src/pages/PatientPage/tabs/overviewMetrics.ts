// ─── Modèles de carte du bandeau d'aperçu Évolution (#159) ───────────────────
//
// Le chiffre de chaque carte = moyenne des 30 derniers jours (mois glissant) de la
// métrique clé du module (fenêtre FIXE : le sélecteur de période ne la pilote pas).
// La sparkline agrège la métrique à la cadence hebdomadaire sur ces 30 jours.
// Humeur = mini-empreinte 6 barres (aucun agrégat — MDR). Trop peu de saisies sur
// la fenêtre → carte « en attente de saisies ». Logique pure, testée.

import type { MoodPoint, SleepPoint, FearPoint, ScorePoint, ActivityEntryPoint } from '@services/engagementService'
import { aggregateByCadence } from '../../../lib/chartAggregation'
import { moduleEvolutionConfig } from './clinicalChartConfig'
import { MOOD_WEB_DIMENSIONS } from './moodDimensions'
import { moodWindowSummary } from './moodTrend'
import type { FingerprintBar } from '../../../components/features/DimensionFingerprint'

export const OVERVIEW_WINDOW_DAYS = 30
const DAY_MS = 86_400_000

export interface MetricCard {
  readonly kind: 'metric'
  readonly moduleType: string
  readonly labelKey: string
  readonly color: string
  readonly metricLabelKey: string
  readonly value: number | null
  readonly unit: string
  readonly sparkline: (number | null)[]
  readonly domain: readonly [number, number]
}
export interface FingerprintCard {
  readonly kind: 'fingerprint'
  readonly moduleType: string
  readonly labelKey: string
  readonly color: string
  readonly bars: FingerprintBar[]
  readonly daysLogged: number
}
export interface EmptyCard {
  readonly kind: 'empty'
  readonly moduleType: string
  readonly labelKey: string
  readonly color: string
}
export type OverviewCard = MetricCard | FingerprintCard | EmptyCard

interface DatedValue { readonly date: string; readonly value: number | null }

function withinWindow(iso: string, now: number): boolean {
  const t = new Date(iso).getTime()
  return !Number.isNaN(t) && t >= now - OVERVIEW_WINDOW_DAYS * DAY_MS && t <= now
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

// Carte métrique générique : moyenne 30 j + sparkline hebdo. `empty` si aucune saisie.
function metricCard(moduleType: string, points: DatedValue[], metricLabelKey: string, now: number): OverviewCard {
  const cfg = moduleEvolutionConfig(moduleType)
  const win = points.filter(p => withinWindow(p.date, now))
  if (win.length === 0) {
    return { kind: 'empty', moduleType, labelKey: cfg.labelKey, color: cfg.color }
  }
  const values = win.map(p => p.value).filter((v): v is number => v != null)
  const sparkline = aggregateByCadence(win, 'weekly', OVERVIEW_WINDOW_DAYS, now).map(p => p.value)
  return {
    kind: 'metric', moduleType, labelKey: cfg.labelKey, color: cfg.color,
    metricLabelKey, value: mean(values), unit: cfg.unit, sparkline, domain: cfg.yDomain,
  }
}

export function sleepCard(points: readonly SleepPoint[], now: number = Date.now()): OverviewCard {
  const cfg = moduleEvolutionConfig('sleep_diary')
  return metricCard('sleep_diary', points.map(p => ({ date: p.date, value: p.efficiency })), cfg.overviewMetricKey, now)
}

export function fearCard(points: readonly FearPoint[], now: number = Date.now()): OverviewCard {
  const cfg = moduleEvolutionConfig('fear_thermometer')
  return metricCard('fear_thermometer', points.map(p => ({ date: p.date, value: p.suds_after - p.suds_before })), cfg.overviewMetricKey, now)
}

export function activationCard(entries: readonly ActivityEntryPoint[], now: number = Date.now()): OverviewCard {
  const cfg = moduleEvolutionConfig('behavioral_activation')
  return metricCard('behavioral_activation', entries.map(e => ({ date: e.date, value: e.done ? 100 : 0 })), cfg.overviewMetricKey, now)
}

export function scaleCard(moduleType: string, points: readonly ScorePoint[], now: number = Date.now()): OverviewCard {
  const cfg = moduleEvolutionConfig(moduleType)
  return metricCard(moduleType, points.map(p => ({ date: p.date, value: p.score })), cfg.overviewMetricKey, now)
}

export function moodCard(
  points: readonly MoodPoint[],
  labelFor: (labelKey: string) => string,
  now: number = Date.now(),
): OverviewCard {
  const cfg = moduleEvolutionConfig('mood_tracker')
  const keys = MOOD_WEB_DIMENSIONS.map(d => d.frKey)
  const inWindow = points.filter(p => withinWindow(p.date, now))
  if (inWindow.length === 0) {
    return { kind: 'empty', moduleType: 'mood_tracker', labelKey: cfg.labelKey, color: cfg.color }
  }
  const summary = moodWindowSummary(points, keys, OVERVIEW_WINDOW_DAYS)
  const bars: FingerprintBar[] = MOOD_WEB_DIMENSIONS.map(d => ({
    key: d.frKey, label: labelFor(d.labelKey), value: summary.averages[d.frKey], color: d.colors.fill,
  }))
  return { kind: 'fingerprint', moduleType: 'mood_tracker', labelKey: cfg.labelKey, color: cfg.color, bars, daysLogged: summary.daysLogged }
}
