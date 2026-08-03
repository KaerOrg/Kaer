// ─── Modèles de carte du bandeau d'aperçu Évolution (#159) ───────────────────
//
// Le chiffre de chaque carte = moyenne des 30 derniers jours (mois glissant) de la
// métrique clé du module (fenêtre FIXE : le sélecteur de période ne la pilote pas).
// La sparkline agrège la métrique à la cadence hebdomadaire sur ces 30 jours.
// Humeur = mini-empreinte 6 barres (aucun agrégat — MDR). Trop peu de saisies sur
// la fenêtre → carte « en attente de saisies ». Logique pure, testée.

import type { MoodPoint, SleepPoint, FearPoint, ScorePoint, ActivityEntryPoint, MedEffectPoint } from '@services/engagementService'
import { aggregateByCadence } from '../../../lib/chartAggregation'
import { colorAt } from '../../../lib/chartConfig'
import { moduleEvolutionConfig } from './clinicalChartConfig'
import { MOOD_WEB_DIMENSIONS } from './moodDimensions'
import { moodWindowSummary } from './moodTrend'
import type { FingerprintBar } from '../../../components/features/DimensionFingerprint'
import { repertoire, type EmotionNamingEntry, type NamingTaxonomy } from '../../../lib/emotionNamingData'

export const OVERVIEW_WINDOW_DAYS = 30
const DAY_MS = 86_400_000

/**
 * En deçà de ce nombre de saisies, ni carte d'aperçu chiffrée ni section Évolution
 * pour « Nommer ce que je ressens » : trop peu de matière pour qu'un croisement ou
 * une couverture de répertoire veuille dire quoi que ce soit. Prudence clinique.
 */
export const NAMING_MIN_ENTRIES = 8

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
/**
 * Carte sans métrique : pour un module qui ne produit aucune série numérique
 * (catégories, texte libre). Elle porte des EFFECTIFS et rien d'autre : pas de
 * chiffre clé, pas de sparkline, pas d'empreinte. Une carte muette vaut mieux
 * qu'une carte qui invente une métrique.
 */
export interface CountsCard {
  readonly kind: 'counts'
  readonly moduleType: string
  readonly labelKey: string
  readonly color: string
  /** Lignes de comptage, i18n déjà résolu par l'appelant. */
  readonly lines: readonly string[]
}
export type OverviewCard = MetricCard | FingerprintCard | EmptyCard | CountsCard

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
  // Label = nom de l'échelle (aligné sur la section : `evolution.scale_<mt>`), métrique
  // = score moyen brut sur la fenêtre. Le fallback de config ne porte pas ces libellés.
  const card = metricCard(moduleType, points.map(p => ({ date: p.date, value: p.score })), 'evolution.overview_scale_metric', now)
  return { ...card, labelKey: `evolution.scale_${moduleType}` }
}

// Effets indésirables : une barre par effet (moyenne 30 j de l'intensité déclarée),
// jamais une moyenne composite de tous les effets (MDR : aucun agrégat interprétatif).
// Miroir de l'humeur : carte empreinte.
export function medCard(
  effects: readonly string[],
  points: readonly MedEffectPoint[],
  labelFor: (effect: string) => string,
  now: number = Date.now(),
): OverviewCard {
  const cfg = moduleEvolutionConfig('medication_side_effects')
  const win = points.filter(p => withinWindow(p.date, now))
  if (win.length === 0) {
    return { kind: 'empty', moduleType: 'medication_side_effects', labelKey: cfg.labelKey, color: cfg.color }
  }
  const bars: FingerprintBar[] = effects.map((effect, i) => {
    const values = win
      .map(p => p[effect])
      .filter((v): v is number => typeof v === 'number')
    return { key: effect, label: labelFor(effect), value: mean(values) ?? 0, color: colorAt(i) }
  })
  const daysLogged = new Set(win.map(p => p.date.slice(0, 10))).size
  return { kind: 'fingerprint', moduleType: 'medication_side_effects', labelKey: cfg.labelKey, color: cfg.color, bars, daysLogged }
}

/**
 * « Nommer ce que je ressens » : carte d'effectifs sur la fenêtre 30 j, comme les
 * autres cartes. Aucun sparkline, aucune empreinte : le module produit une catégorie,
 * pas une série. Sous le seuil de saisies, carte « en attente de saisies ».
 */
export function namingCard(
  entries: readonly EmotionNamingEntry[],
  taxonomy: NamingTaxonomy,
  format: (key: string, values: Record<string, number>) => string,
  now: number = Date.now(),
): OverviewCard {
  const cfg = moduleEvolutionConfig('emotion_wheel')
  const win = entries.filter(e => withinWindow(e.date, now))
  if (win.length < NAMING_MIN_ENTRIES) {
    return { kind: 'empty', moduleType: 'emotion_wheel', labelKey: cfg.labelKey, color: cfg.color }
  }
  const rep = repertoire(win, taxonomy)
  return {
    kind: 'counts', moduleType: 'emotion_wheel', labelKey: cfg.labelKey, color: cfg.color,
    lines: [
      format('evolution.n_sessions', { count: win.length }),
      format('evolution.naming_overview_nuances', {
        count: rep.nuancesUsed, used: rep.nuancesUsed, total: rep.nuancesTotal,
      }),
    ],
  }
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
