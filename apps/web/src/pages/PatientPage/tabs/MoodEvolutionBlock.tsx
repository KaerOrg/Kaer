import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MoodPoint, MoodMarkerRow } from '@services/engagementService'
import { filterByRange } from '../../../lib/chartConfig'
import { buildCadenceTrend, type GapSegments } from '../../../lib/chartAggregation'
import { DimensionFingerprint, type FingerprintBar } from '../../../components/features/DimensionFingerprint'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { lastFilledPoint, type TrendMarker, type TrendPoint } from '@ui/Chart'
import { MOOD_WEB_DIMENSIONS, MOOD_MARKER_COLORS, type MoodFrKey } from './moodDimensions'
import { buildDimensionTrend, moodWindowSummary, dimensionStats, buildComparisonTrend, type DimensionStats } from './moodTrend'
import { MoodFriseLine, type MoodCompareMode } from './MoodFriseLine'
import './MoodEvolutionBlock.css'

interface Props {
  points: MoodPoint[]
  markers: MoodMarkerRow[]
  locale: string
  /** Fenêtre de la frise, pilotée par le sélecteur de période de la page (#159). */
  periodDays: number
}

const FR_KEYS: readonly MoodFrKey[] = MOOD_WEB_DIMENSIONS.map(d => d.frKey)
const OVERVIEW_WINDOW_DAYS = 30 // fixe : le sélecteur de période ne pilote PAS l'aperçu

interface FriseLineData {
  readonly dim: (typeof MOOD_WEB_DIMENSIONS)[number]
  readonly trend: TrendPoint[]
  readonly gaps: GapSegments | undefined
  readonly lastValue: number | null
  readonly stats: DimensionStats
  readonly mode: MoodCompareMode
  readonly comparison: { data: TrendPoint[]; label: string } | undefined
}

// Corps du bloc « Humeur » de la page Évolution clinique : carte d'aperçu
// (mini-empreinte 6 barres, 30 jours glissants fixes — corrige la moyenne composite
// interdite MDR) + frise à 6 dimensions repliables (stats sur la période choisie,
// repères datés partagés, comparateur). Aucun agrégat « bien-être » ; couleur =
// identité/magnitude.
export function MoodEvolutionBlock({ points, markers, locale, periodDays }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<ReadonlySet<MoodFrKey>>(() => new Set())
  const [compareModes, setCompareModes] = useState<Record<string, MoodCompareMode>>({})
  // Courbe : moyenne lissée à la cadence hebdomadaire par défaut (#159), avec
  // bascule « voir chaque saisie » (points bruts, sans agrégat ni bande de trou).
  const [rawMode, setRawMode] = useState(false)

  const handleToggle = useCallback((k: MoodFrKey) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }, [])
  const handleCompare = useCallback((k: MoodFrKey, m: MoodCompareMode) => {
    setCompareModes(prev => ({ ...prev, [k]: m }))
  }, [])

  // Aperçu : 30 jours glissants fixes (état des lieux, indépendant de la période).
  const summary30 = useMemo(() => moodWindowSummary(points, FR_KEYS, OVERVIEW_WINDOW_DAYS), [points])
  const fingerprintBars = useMemo<FingerprintBar[]>(
    () => MOOD_WEB_DIMENSIONS.map(d => ({
      key: d.frKey, label: t(d.labelKey), value: summary30.averages[d.frKey], color: d.colors.fill,
    })),
    [summary30, t],
  )

  // Frise : fenêtre = période sélectionnée de la page.
  const filtered = useMemo(() => filterByRange(points, periodDays), [points, periodDays])
  const chartMarkers = useMemo<TrendMarker[]>(
    () => markers.map(m => ({ date: m.date, label: t(`evolution.marker_type_${m.type}`), color: MOOD_MARKER_COLORS[m.type] })),
    [markers, t],
  )

  // Données par ligne mémoïsées : objets stables pour le memo de MoodFriseLine.
  const lines = useMemo<FriseLineData[]>(
    () => MOOD_WEB_DIMENSIONS.map(dim => {
      // Stats sur les saisies brutes (N = nombre de saisies renseignées).
      const rawTrend = buildDimensionTrend(filtered, dim.frKey)
      // Courbe : brute (chaque saisie) ou agrégée hebdo + politique des trous.
      const rawPoints = filtered.map(p => ({ date: p.date, value: typeof p[dim.frKey] === 'number' ? (p[dim.frKey] as number) : null }))
      const agg = rawMode ? null : buildCadenceTrend(rawPoints, 'weekly', periodDays)
      const mode: MoodCompareMode = compareModes[dim.frKey] ?? 'none'
      const comparison = mode === 'none'
        ? undefined
        : {
            data: buildComparisonTrend(filtered, dim.frKey, mode === 'prev' ? 30 : 365),
            label: t(mode === 'prev' ? 'evolution.mood_compare_prev' : 'evolution.mood_compare_year'),
          }
      return {
        dim,
        trend: agg ? agg.data : rawTrend,
        gaps: agg ? agg.gaps : undefined,
        lastValue: lastFilledPoint(rawTrend)?.value ?? null,
        stats: dimensionStats(rawTrend),
        mode,
        comparison,
      }
    }),
    [filtered, compareModes, rawMode, periodDays, t],
  )

  return (
    <div className="mood-frise">
      <div className="mood-frise__overview">
        <DimensionFingerprint bars={fingerprintBars} yMax={10} barAreaHeight={44} />
        <div className="mood-frise__overview-foot">
          <span>{t('evolution.mood_recents_window', { days: OVERVIEW_WINDOW_DAYS })}</span>
          <span>{t('evolution.mood_days_logged', { done: summary30.daysLogged, total: OVERVIEW_WINDOW_DAYS })}</span>
        </div>
      </div>

      <div className="mood-frise__cadence">
        <Toggle checked={rawMode} onChange={setRawMode} label={t('evolution.show_each_entry')} />
      </div>

      <div className="mood-frise__lines">
        {lines.map(line => (
          <MoodFriseLine
            key={line.dim.frKey}
            dim={line.dim}
            trend={line.trend}
            gaps={line.gaps}
            lastValue={line.lastValue}
            stats={line.stats}
            expanded={expanded.has(line.dim.frKey)}
            onToggle={handleToggle}
            markers={chartMarkers}
            comparison={line.comparison}
            compareMode={line.mode}
            onCompareChange={handleCompare}
            locale={locale}
          />
        ))}
      </div>
    </div>
  )
}
