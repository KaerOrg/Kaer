import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart } from '../../../components/ui/Chart'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { SegmentedControl } from '../../../components/ui/SegmentedControl'
import type { SegmentOption } from '../../../components/ui/SegmentedControl'
import {
  fetchScaleEvolution,
  fetchMoodEvolution,
  fetchFearEvolution,
  fetchMedSideEffectsEvolution,
  fetchAvailableScales,
  type ScorePoint,
  type MoodPoint,
  type FearPoint,
  type MedEffectPoint,
} from '../../../services/engagementService'
import './PatientEvolutionTab.css'

export type TimeRange = '3m' | '6m' | '1y'
const RANGE_DAYS: Record<TimeRange, number> = { '3m': 90, '6m': 180, '1y': 365 }
const TIME_RANGES: readonly TimeRange[] = ['3m', '6m', '1y']

const SCALE_CONFIG: Record<string, { color: string; yMax: number }> = {
  phq9:    { color: '#6366F1', yMax: 27 },
  gad7:    { color: '#F59E0B', yMax: 21 },
  bsl23:   { color: '#EF4444', yMax: 4  },
  epds:    { color: '#EC4899', yMax: 30 },
  rcads:   { color: '#8B5CF6', yMax: 50 },
  asrs6:   { color: '#3B82F6', yMax: 24 },
  snap_iv: { color: '#0EA5E9', yMax: 78 },
  nsi:     { color: '#64748B', yMax: 45 },
}

const MOOD_DIMENSIONS = [
  { key: 'humeur',       color: '#10B981' },
  { key: 'energie',      color: '#3B82F6' },
  { key: 'anxiete',      color: '#EF4444' },
  { key: 'plaisir',      color: '#F59E0B' },
  { key: 'sommeil',      color: '#8B5CF6' },
  { key: 'alimentation', color: '#EC4899' },
] as const

const MED_EFFECT_COLORS: Record<string, string> = {
  sedation:             '#6366F1',
  bouche_seche:         '#F59E0B',
  sommeil:              '#8B5CF6',
  nausees:              '#EF4444',
  prise_de_poids:       '#EC4899',
  akathisie:            '#0EA5E9',
  tremblements:         '#64748B',
  constipation:         '#10B981',
  dysfonction_sexuelle: '#F97316',
  anxiete:              '#DC2626',
  cephalees:            '#7C3AED',
  vertiges:             '#0891B2',
}

function filterByRange<T extends { date: string }>(points: T[], days: number): T[] {
  const cutoff = Date.now() - days * 86_400_000
  return points.filter(p => new Date(p.date).getTime() >= cutoff)
}

type Props = { patientId: string }

export function PatientEvolutionTab({ patientId }: Props) {
  const { t, i18n } = useTranslation()
  const [range, setRange] = useState<TimeRange>('1y')
  const [moodExpanded, setMoodExpanded] = useState(false)

  const [scales, setScales] = useState<string[]>([])
  const [scaleData, setScaleData] = useState<Record<string, ScorePoint[]>>({})
  const [moodData, setMoodData] = useState<MoodPoint[]>([])
  const [fearData, setFearData] = useState<FearPoint[]>([])
  const [medEffects, setMedEffects] = useState<string[]>([])
  const [medData, setMedData] = useState<MedEffectPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      const available = await fetchAvailableScales(patientId)
      const [scaleResults, mood, fear, med] = await Promise.all([
        Promise.all(available.map(mt => fetchScaleEvolution(patientId, mt))),
        fetchMoodEvolution(patientId),
        fetchFearEvolution(patientId),
        fetchMedSideEffectsEvolution(patientId),
      ])
      if (cancelled) return

      const map: Record<string, ScorePoint[]> = {}
      available.forEach((mt, i) => { map[mt] = scaleResults[i] })

      setScales(available)
      setScaleData(map)
      setMoodData(mood)
      setFearData(fear)
      setMedEffects(med.effects)
      setMedData(med.data)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [patientId])

  const days = RANGE_DAYS[range]
  const hasData = scales.length > 0 || moodData.length > 0 || fearData.length > 0 || medData.length > 0

  const rangeOptions = useMemo<readonly SegmentOption<TimeRange>[]>(
    () => TIME_RANGES.map(r => ({ value: r, label: t(`evolution.range_${r}`) })),
    [t],
  )

  if (loading) return <div className="evolution-loading">{t('common.loading')}</div>
  if (!hasData) {
    return (
      <div className="evolution-empty">
        <p className="evolution-empty__title">{t('evolution.empty_title')}</p>
        <p className="evolution-empty__desc">{t('evolution.empty_desc')}</p>
      </div>
    )
  }

  return (
    <div className="evolution">
      <div className="evolution__header">
        <h2 className="evolution__title">{t('evolution.title')}</h2>
        <SegmentedControl
          options={rangeOptions}
          value={range}
          onChange={setRange}
          ariaLabel={t('evolution.title')}
        />
      </div>

      <div className="evolution__cards">

        {/* ── Échelles cliniques ──────────────────────────────── */}
        {scales.map(mt => {
          const points = filterByRange(scaleData[mt] ?? [], days)
          const cfg = SCALE_CONFIG[mt] ?? { color: '#6366F1', yMax: 27 }
          const chartData = points.map(p => ({ date: p.date, score: p.score }))
          const last = points.at(-1)?.score
          return (
            <EvolutionCard
              key={mt}
              title={t(`evolution.scale_${mt}`)}
              badge={t('evolution.n_sessions', { count: points.length })}
              score={last != null ? t('evolution.last_score', { score: last }) : undefined}
              scoreColor={cfg.color}
            >
              {chartData.length >= 2 ? (
                <LineChart
                  data={chartData}
                  series={[{ key: 'score', color: cfg.color, label: t(`evolution.scale_${mt}`) }]}
                  yDomain={[0, cfg.yMax]}
                  locale={i18n.language}
                />
              ) : (
                <p className="evolution-card__no-data">{t('evolution.not_enough_data')}</p>
              )}
            </EvolutionCard>
          )
        })}

        {/* ── Mood tracker ─────────────────────────────────────── */}
        {moodData.length > 0 && (() => {
          const filteredMood = filterByRange(moodData, days)
          return (
            <>
              <div className="evolution__section-header">
                <h3 className="evolution__section-title">{t('evolution.mood_title')}</h3>
                <Toggle
                  checked={moodExpanded}
                  onChange={setMoodExpanded}
                  label={t('evolution.mood_detail')}
                />
              </div>

              {!moodExpanded && filteredMood.length >= 2 && (
                <EvolutionCard
                  key="mood-composite"
                  title={t('evolution.mood_title')}
                  badge={t('evolution.n_sessions', { count: filteredMood.length })}
                  wide
                  animateIn
                >
                  <LineChart
                    data={filteredMood}
                    series={MOOD_DIMENSIONS.map(d => ({ key: d.key, color: d.color, label: t(`evolution.mood_${d.key}`) }))}
                    yDomain={[1, 10]}
                    showLegend
                    height={240}
                    locale={i18n.language}
                  />
                </EvolutionCard>
              )}

              {moodExpanded && MOOD_DIMENSIONS.map(dim => {
                const points = filteredMood.filter(p => p[dim.key] != null)
                if (points.length < 2) return null
                const last = points.at(-1)?.[dim.key]
                return (
                  <EvolutionCard
                    key={dim.key}
                    title={t(`evolution.mood_${dim.key}`)}
                    badge={t('evolution.n_sessions', { count: points.length })}
                    score={last != null ? String(last) + ' / 10' : undefined}
                    scoreColor={dim.color}
                    animateIn
                  >
                    <LineChart
                      data={points}
                      series={[{ key: dim.key, color: dim.color, label: t(`evolution.mood_${dim.key}`) }]}
                      yDomain={[1, 10]}
                      locale={i18n.language}
                    />
                  </EvolutionCard>
                )
              })}
            </>
          )
        })()}

        {/* ── Effets indésirables — 1 carte par effet ───────────── */}
        {medData.length > 0 && (
          <div className="evolution__section-header">
            <h3 className="evolution__section-title">{t('evolution.med_effects_title')}</h3>
          </div>
        )}
        {medData.length > 0 && medEffects.map(effect => {
          const points = filterByRange(medData, days).filter(p => p[effect] != null)
          if (points.length < 2) return null
          const chartData = points.map(p => ({ date: p.date, [effect]: p[effect] }))
          const last = points.at(-1)?.[effect]
          const color = MED_EFFECT_COLORS[effect] ?? '#64748B'
          return (
            <EvolutionCard
              key={effect}
              title={t(`evolution.med_effect_${effect}`, { defaultValue: effect })}
              badge={t('evolution.n_sessions', { count: points.length })}
              score={last != null ? String(last) + ' / 10' : undefined}
              scoreColor={color}
            >
              <LineChart
                data={chartData}
                series={[{ key: effect, color, label: t(`evolution.med_effect_${effect}`, { defaultValue: effect }) }]}
                yDomain={[0, 10]}
                locale={i18n.language}
              />
            </EvolutionCard>
          )
        })}

        {/* ── Thermomètre de la peur — SUDS avant/après ─────────── */}
        {fearData.length > 0 && (() => {
          const points = filterByRange(fearData, days)
          const chartData = points.map(p => ({
            date: p.date,
            suds_before: p.suds_before,
            suds_after:  p.suds_after,
          }))
          return (
            <EvolutionCard
              title={t('evolution.fear_title')}
              badge={t('evolution.n_sessions', { count: points.length })}
              wide
            >
              {chartData.length >= 2 ? (
                <LineChart
                  data={chartData}
                  series={[
                    { key: 'suds_before', color: '#F59E0B', label: t('evolution.fear_before') },
                    { key: 'suds_after',  color: '#10B981', label: t('evolution.fear_after') },
                  ]}
                  yDomain={[0, 100]}
                  showLegend
                  locale={i18n.language}
                />
              ) : (
                <p className="evolution-card__no-data">{t('evolution.not_enough_data')}</p>
              )}
            </EvolutionCard>
          )
        })()}

      </div>
    </div>
  )
}

// ─── EvolutionCard ────────────────────────────────────────────────────────────

interface EvolutionCardProps {
  title: string
  badge?: string
  score?: string
  scoreColor?: string
  wide?: boolean
  animateIn?: boolean
  children: React.ReactNode
}

function EvolutionCard({ title, badge, score, scoreColor, wide, animateIn, children }: EvolutionCardProps) {
  const cls = [
    'evolution-card',
    wide ? 'evolution-card--wide' : '',
    animateIn ? 'evolution-card--animate-in' : '',
  ].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <div className="evolution-card__header">
        <div>
          <h3 className="evolution-card__title">{title}</h3>
          {score != null && (
            <span className="evolution-card__score" style={{ color: scoreColor }}>
              {score}
            </span>
          )}
        </div>
        {badge != null && (
          <span className="evolution-card__count">{badge}</span>
        )}
      </div>
      {children}
    </div>
  )
}
