import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { LineChart } from '../../../components/ui/Chart'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { SegmentedControl } from '../../../components/ui/SegmentedControl'
import type { SegmentOption } from '../../../components/ui/SegmentedControl'
import type {
  ScorePoint,
  MoodPoint,
  FearPoint,
  MedEffectPoint,
  SleepPoint,
} from '../../../services/engagementService'
import type { RhythmEntry } from '@kaer/shared'
import { ChronoRhythmogramPanel } from './ChronoRhythmogramPanel'
import { engagementQueries, patientQueries } from '../../../hooks/queries'
import { SleepDataPanel } from './SleepDataPanel'
import {
  type TimeRange,
  RANGE_DAYS,
  TIME_RANGES,
  colorAt,
  filterByRange,
} from '../../../lib/chartConfig'
import {
  SCALE_CONFIG,
  MOOD_DIMENSIONS,
  DEFAULT_SCALE_COLOR,
  FEAR_BEFORE_COLOR,
  FEAR_AFTER_COLOR,
} from './clinicalChartConfig'
import './PatientEvolutionTab.css'

export type { TimeRange }

type Props = { patientId: string }

type EvolutionData = {
  scales: string[]
  scaleData: Record<string, ScorePoint[]>
  moodData: MoodPoint[]
  fearData: FearPoint[]
  medEffects: string[]
  medData: MedEffectPoint[]
  sleepData: SleepPoint[]
  chronoEntries: RhythmEntry[]
}

const EMPTY_EVOLUTION: EvolutionData = {
  scales: [],
  scaleData: {},
  moodData: [],
  fearData: [],
  medEffects: [],
  medData: [],
  sleepData: [],
  chronoEntries: [],
}

export function PatientEvolutionTab({ patientId }: Props) {
  const { t, i18n } = useTranslation()
  const [range, setRange] = useState<TimeRange>('1y')
  const [moodExpanded, setMoodExpanded] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const evolutionQuery = useQuery(engagementQueries.patientEvolution(patientId))
  const modulesQuery = useQuery(patientQueries.modules(patientId))
  const { scales, scaleData, moodData, fearData, medEffects, medData, sleepData, chronoEntries } =
    evolutionQuery.data ?? EMPTY_EVOLUTION
  const loading = evolutionQuery.isLoading || modulesQuery.isLoading

  // Modules actuellement affectés au patient (présence = actif ; la révocation
  // supprime la ligne patient_modules). Une section dont le module n'est plus
  // affecté est « archivée » : masquée par défaut, révélée par le toggle.
  const activeTypes = useMemo(
    () => new Set((modulesQuery.data ?? []).map(m => m.module_type)),
    [modulesQuery.data],
  )
  const isShown = (moduleType: string) => activeTypes.has(moduleType) || showArchived
  const isArchived = (moduleType: string) => !activeTypes.has(moduleType)

  const days = RANGE_DAYS[range]
  const hasData =
    scales.length > 0 ||
    moodData.length > 0 ||
    fearData.length > 0 ||
    medData.length > 0 ||
    sleepData.length > 0 ||
    chronoEntries.length > 0

  // Types de modules ayant des données ; au moins un est-il archivé ?
  const dataTypes = useMemo(() => {
    const types = [...scales]
    if (moodData.length > 0) types.push('mood_tracker')
    if (fearData.length > 0) types.push('fear_thermometer')
    if (medData.length > 0) types.push('medication_side_effects')
    if (sleepData.length > 0) types.push('sleep_diary')
    return types
  }, [scales, moodData.length, fearData.length, medData.length, sleepData.length])
  const hasArchived = dataTypes.some(mt => !activeTypes.has(mt))
  const hasActiveData = dataTypes.some(mt => activeTypes.has(mt))

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
        <div className="evolution__controls">
          {hasArchived && (
            <Toggle
              checked={showArchived}
              onChange={setShowArchived}
              label={t('evolution.show_archived')}
            />
          )}
          <SegmentedControl
            options={rangeOptions}
            value={range}
            onChange={setRange}
            ariaLabel={t('evolution.title')}
          />
        </div>
      </div>

      {!hasActiveData && !showArchived && (
        <p className="evolution-empty__desc">{t('evolution.all_archived')}</p>
      )}

      {/* ── Agenda du sommeil (grille + tableau fenêtre + courbes) ─────── */}
      {sleepData.length > 0 && isShown('sleep_diary') && (
        <section className="evolution__sleep">
          <div className="evolution__section-header">
            <h3 className="evolution__section-title">{t('evolution.sleep_section_title')}</h3>
            {isArchived('sleep_diary') && (
              <span className="evolution__archived-badge">{t('evolution.archived_badge')}</span>
            )}
          </div>
          <SleepDataPanel points={filterByRange(sleepData, days)} locale={i18n.language} />
        </section>
      )}

      <div className="evolution__cards">

        {/* ── Échelles cliniques ──────────────────────────────── */}
        {scales.filter(mt => isShown(mt)).map(mt => {
          const points = filterByRange(scaleData[mt] ?? [], days)
          const cfg = SCALE_CONFIG[mt] ?? { color: DEFAULT_SCALE_COLOR, yMax: 27 }
          const chartData = points.map(p => ({ date: p.date, score: p.score }))
          const last = points.at(-1)?.score
          return (
            <EvolutionCard
              key={mt}
              title={t(`evolution.scale_${mt}`)}
              badge={t('evolution.n_sessions', { count: points.length })}
              score={last != null ? t('evolution.last_score', { score: last }) : undefined}
              scoreColor={cfg.color}
              archived={isArchived(mt)}
              archivedLabel={t('evolution.archived_badge')}
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
        {moodData.length > 0 && isShown('mood_tracker') && (() => {
          const filteredMood = filterByRange(moodData, days)
          return (
            <>
              <div className="evolution__section-header">
                <h3 className="evolution__section-title">{t('evolution.mood_title')}</h3>
                {isArchived('mood_tracker') && (
                  <span className="evolution__archived-badge">{t('evolution.archived_badge')}</span>
                )}
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
        {medData.length > 0 && isShown('medication_side_effects') && (
          <div className="evolution__section-header">
            <h3 className="evolution__section-title">{t('evolution.med_effects_title')}</h3>
            {isArchived('medication_side_effects') && (
              <span className="evolution__archived-badge">{t('evolution.archived_badge')}</span>
            )}
          </div>
        )}
        {medData.length > 0 && isShown('medication_side_effects') && medEffects.map((effect, i) => {
          const points = filterByRange(medData, days).filter(p => p[effect] != null)
          if (points.length < 2) return null
          const chartData = points.map(p => ({ date: p.date, [effect]: p[effect] }))
          const last = points.at(-1)?.[effect]
          const color = colorAt(i)
          return (
            <EvolutionCard
              key={effect}
              title={t(`evolution.med_effect_${effect}`, { defaultValue: effect })}
              badge={t('evolution.n_sessions', { count: points.length })}
              score={last != null ? String(last) + ' / 10' : undefined}
              scoreColor={color}
              archived={isArchived('medication_side_effects')}
              archivedLabel={t('evolution.archived_badge')}
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
        {fearData.length > 0 && isShown('fear_thermometer') && (() => {
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
              archived={isArchived('fear_thermometer')}
              archivedLabel={t('evolution.archived_badge')}
            >
              {chartData.length >= 2 ? (
                <LineChart
                  data={chartData}
                  series={[
                    { key: 'suds_before', color: FEAR_BEFORE_COLOR, label: t('evolution.fear_before') },
                    { key: 'suds_after',  color: FEAR_AFTER_COLOR, label: t('evolution.fear_after') },
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

        {/* ── Rythmes & régularité ────────────────────────────── */}
        {chronoEntries.length > 0 && (
          <div className="evolution-card evolution-card--wide">
            <ChronoRhythmogramPanel entries={chronoEntries} />
          </div>
        )}

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
  archived?: boolean
  archivedLabel?: string
  children: React.ReactNode
}

function EvolutionCard({ title, badge, score, scoreColor, wide, animateIn, archived, archivedLabel, children }: EvolutionCardProps) {
  const cls = [
    'evolution-card',
    wide ? 'evolution-card--wide' : '',
    animateIn ? 'evolution-card--animate-in' : '',
    archived ? 'evolution-card--archived' : '',
  ].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <div className="evolution-card__header">
        <div className="evolution-card__heading">
          <h3 className="evolution-card__title">{title}</h3>
          {archived && archivedLabel != null && (
            <span className="evolution__archived-badge">{archivedLabel}</span>
          )}
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
