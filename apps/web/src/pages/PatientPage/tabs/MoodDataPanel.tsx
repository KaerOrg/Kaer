import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MoodPoint, MoodMarkerRow } from '@services/engagementService'
import { SegmentedControl } from '@ui/SegmentedControl'
import { TrendChart, type TrendMarker } from '@ui/Chart'
import { DimensionFingerprint, type FingerprintBar } from '../../../components/features/DimensionFingerprint'
import { MOOD_ACCENT } from '@kaer/shared'
import { MOOD_WEB_DIMENSIONS, MOOD_MARKER_COLORS, type MoodFrKey } from './moodDimensions'
import {
  buildDimensionTrend, moodWindowSummary, dimensionStats, buildComparisonTrend,
} from './moodTrend'
import { MoodMiniChart } from './MoodMiniChart'
import './MoodDataPanel.css'

interface Props {
  points: MoodPoint[]
  markers: MoodMarkerRow[]
  locale: string
}

const FR_KEYS: readonly MoodFrKey[] = MOOD_WEB_DIMENSIONS.map(d => d.frKey)
const COMPARE_SHIFT_DAYS = 30
const EMPTY_TREND: ReturnType<typeof buildDimensionTrend> = []

// Panneau « Données » du mood_tracker (praticien) : moyennes récentes (7 j / 1 mois)
// + empreinte 6 barres, petits multiples par dimension (agrandir), détail au clic
// (courbe précise + repères + comparaison mois -1), liste des repères posés par le
// patient. Aucune moyenne « bien-être » globale ; couleur = identité/magnitude.
// Statistiques descriptives par dimension autorisées (résumé de série brute, MDR).
export function MoodDataPanel({ points, markers, locale }: Props) {
  const { t } = useTranslation()
  const [recent, setRecent] = useState<'7' | '30'>('7')
  const [expanded, setExpanded] = useState<MoodFrKey | null>(null)
  const [compare, setCompare] = useState<'none' | 'prev'>('none')

  const handleExpand = useCallback(
    (k: MoodFrKey) => setExpanded(prev => (prev === k ? null : k)),
    [],
  )
  const handleRecent = useCallback((v: '7' | '30') => setRecent(v), [])
  const handleCompare = useCallback((v: 'none' | 'prev') => setCompare(v), [])

  const windowDays = recent === '7' ? 7 : 30
  const summary = useMemo(() => moodWindowSummary(points, FR_KEYS, windowDays), [points, windowDays])

  const fingerprintBars = useMemo<FingerprintBar[]>(
    () => MOOD_WEB_DIMENSIONS.map(d => ({
      key: d.frKey,
      label: t(d.labelKey),
      value: summary.averages[d.frKey],
      color: d.colors.fill,
    })),
    [summary, t],
  )

  const trends = useMemo(
    () => Object.fromEntries(MOOD_WEB_DIMENSIONS.map(d => [d.frKey, buildDimensionTrend(points, d.frKey)])) as Record<MoodFrKey, ReturnType<typeof buildDimensionTrend>>,
    [points],
  )

  const chartMarkers = useMemo<TrendMarker[]>(
    () => markers.map(m => ({ date: m.date, label: t(`evolution.marker_type_${m.type}`), color: MOOD_MARKER_COLORS[m.type] })),
    [markers, t],
  )

  const expandedDim = useMemo(
    () => (expanded ? MOOD_WEB_DIMENSIONS.find(d => d.frKey === expanded) ?? null : null),
    [expanded],
  )
  const expandedTrend = useMemo(() => (expanded ? trends[expanded] : EMPTY_TREND), [expanded, trends])
  const expandedStats = useMemo(() => dimensionStats(expandedTrend), [expandedTrend])
  const comparisonTrend = useMemo(
    () => (expanded && compare === 'prev' ? buildComparisonTrend(points, expanded, COMPARE_SHIFT_DAYS) : null),
    [expanded, compare, points],
  )

  return (
    <div className="module-data-panel mood-data">
      {/* Moyennes récentes ─────────────────────────────────────────────── */}
      <section className="mood-data__section">
        <div className="mood-data__section-head">
          <h4 className="module-data-panel__chart-title">{t('evolution.mood_recents_title')}</h4>
          <SegmentedControl
            options={[
              { value: '7', label: t('evolution.mood_window_7d') },
              { value: '30', label: t('evolution.mood_window_30d') },
            ]}
            value={recent}
            onChange={handleRecent}
            variant="pills"
            accentColor={MOOD_ACCENT}
            ariaLabel={t('evolution.mood_recents_title')}
          />
        </div>
        <DimensionFingerprint bars={fingerprintBars} yMax={10} barAreaHeight={40} />
        <div className="mood-data__recents-foot">
          <span>{t('evolution.mood_recents_window', { days: windowDays })}</span>
          <span>{t('evolution.mood_days_logged', { done: summary.daysLogged, total: windowDays })}</span>
        </div>
      </section>

      {/* Petits multiples ──────────────────────────────────────────────── */}
      <section className="mood-data__section">
        <p className="mood-data__hint">{t('evolution.mood_multiples_hint')}</p>
        <div className="mood-data__multiples">
          {MOOD_WEB_DIMENSIONS.map(d => (
            <MoodMiniChart
              key={d.frKey}
              dim={d}
              label={t(d.labelKey)}
              trend={trends[d.frKey]}
              locale={locale}
              expandLabel={t('evolution.mood_expand')}
              onExpand={handleExpand}
            />
          ))}
        </div>
      </section>

      {/* Détail de la dimension sélectionnée ───────────────────────────── */}
      {expandedDim ? (
        <section className="mood-data__section mood-data__detail">
          <div className="mood-data__section-head">
            <h4 className="module-data-panel__chart-title">
              {t('evolution.mood_detail_title', { dimension: t(expandedDim.labelKey) })}
            </h4>
            <SegmentedControl
              options={[
                { value: 'none', label: t('evolution.mood_compare_none') },
                { value: 'prev', label: t('evolution.mood_compare_prev') },
              ]}
              value={compare}
              onChange={handleCompare}
              variant="pills"
              accentColor={expandedDim.colors.mid}
              ariaLabel={t('evolution.mood_compare_label')}
            />
          </div>
          <TrendChart
            data={expandedTrend}
            unit="/10"
            yDomain={[1, 10]}
            color={expandedDim.colors.mid}
            meanLabel={t('evolution.trend_mean')}
            markers={chartMarkers}
            comparison={comparisonTrend ? { data: comparisonTrend, label: t('evolution.mood_compare_prev') } : undefined}
            locale={locale}
          />
          <div className="mood-data__stats">
            <span><span className="mood-data__stat-k">{t('evolution.mood_stat_min')}</span> {expandedStats.min ?? '-'}</span>
            <span><span className="mood-data__stat-k">{t('evolution.mood_stat_max')}</span> {expandedStats.max ?? '-'}</span>
            <span><span className="mood-data__stat-k">{t('evolution.mood_stat_mean')}</span> {expandedStats.mean ?? '-'}</span>
            <span><span className="mood-data__stat-k">{t('evolution.mood_stat_n')}</span> {expandedStats.n}</span>
          </div>
        </section>
      ) : null}

      {/* Repères posés par le patient ──────────────────────────────────── */}
      <section className="mood-data__section">
        <h4 className="module-data-panel__chart-title">{t('evolution.mood_markers_title')}</h4>
        {markers.length === 0 ? (
          <p className="module-data-panel__note">{t('evolution.mood_markers_empty')}</p>
        ) : (
          <ul className="mood-data__markers">
            {markers.map(m => (
              <li key={m.id} className="mood-data__marker">
                <span className="mood-data__dot" style={{ background: MOOD_MARKER_COLORS[m.type] }} />
                <span className="mood-data__marker-date">
                  {new Date(`${m.date}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                </span>
                <span className="mood-data__marker-label">{m.label}</span>
                <span className="mood-data__marker-type" style={{ color: MOOD_MARKER_COLORS[m.type] }}>
                  {t(`evolution.marker_type_${m.type}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
