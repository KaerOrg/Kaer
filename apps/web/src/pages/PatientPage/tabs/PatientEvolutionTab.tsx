import { useCallback, useMemo, useState } from 'react'
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
  FormEntryRow,
  ActivityEntryPoint,
} from '@services/engagementService'
import type { RhythmEntry } from '@kaer/shared'
import { ChronoTrackingCard } from './ChronoTrackingCard'
import { engagementQueries, patientQueries } from '../../../hooks/queries'
import type { ModuleType } from '../../../lib/database.types'
import { SleepDataPanel } from './SleepDataPanel'
import { MoodEvolutionBlock } from './MoodEvolutionBlock'
import { EvolutionOverviewBand } from '../../../components/features/EvolutionOverviewBand'
import { EvolutionSection } from '../../../components/features/EvolutionSection'
import { sleepCard, moodCard, activationCard, fearCard, type OverviewCard } from './overviewMetrics'
import { buildReferenceWindow, type ReferenceKind } from './sleepReference'
import { BehavioralActivationPanel } from './BehavioralActivationPanel'
import { ColumnFormDataPanel } from './ColumnFormDataPanel'
import {
  type TimeRange,
  RANGE_DAYS,
  TIME_RANGES,
  colorAt,
  filterByRange,
} from '../../../lib/chartConfig'
import {
  SCALE_CONFIG,
  DEFAULT_SCALE_COLOR,
  FEAR_BEFORE_COLOR,
  FEAR_AFTER_COLOR,
} from './clinicalChartConfig'
import './PatientEvolutionTab.css'

export type { TimeRange }

type Props = {
  patientId: string
  /** Ouvre l'onglet Données du module (lien « Voir les données → » des sections). */
  onOpenModuleData?: (moduleType: ModuleType) => void
}

type EvolutionData = {
  scales: string[]
  scaleData: Record<string, ScorePoint[]>
  moodData: MoodPoint[]
  fearData: FearPoint[]
  medEffects: string[]
  medData: MedEffectPoint[]
  sleepData: SleepPoint[]
  chronoEntries: RhythmEntry[]
  beckEntries: FormEntryRow[]
  activityEntries: ActivityEntryPoint[]
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
  beckEntries: [],
  activityEntries: [],
}

export function PatientEvolutionTab({ patientId, onOpenModuleData }: Props) {
  const { t, i18n } = useTranslation()
  const [range, setRange] = useState<TimeRange>('1y')
  const [showArchived, setShowArchived] = useState(false)
  // Sections repliables (#159) : plusieurs ouvertes à la fois, état possédé par la
  // page. On mémorise les sections REPLIÉES (défaut = toutes dépliées).
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set())
  const isExpanded = useCallback((key: string) => !collapsed.has(key), [collapsed])
  const handleToggleSection = useCallback((key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])
  // Lien « Voir les données → » : un handler stable par section (closure sur le
  // ModuleType littéral, évite tout cast string vers ModuleType).
  const openSleepData = useCallback(() => onOpenModuleData?.('sleep_diary'), [onOpenModuleData])
  const openActivationData = useCallback(() => onOpenModuleData?.('behavioral_activation'), [onOpenModuleData])
  const openBeckData = useCallback(() => onOpenModuleData?.('beck_columns'), [onOpenModuleData])
  // Comparaison à une période de référence (sommeil) — décochée par défaut (graphe épuré).
  const [sleepCompare, setSleepCompare] = useState(false)
  const [sleepRefKind, setSleepRefKind] = useState<ReferenceKind>('previous')

  const evolutionQuery = useQuery(engagementQueries.patientEvolution(patientId))
  const modulesQuery = useQuery(patientQueries.modules(patientId))
  // Repères du mood_tracker : chargés seulement si le patient a des saisies d'humeur.
  const moodMarkersQuery = useQuery({
    ...engagementQueries.moodMarkers(patientId),
    enabled: (evolutionQuery.data?.moodData.length ?? 0) > 0,
  })
  const { scales, scaleData, moodData, fearData, medEffects, medData, sleepData, chronoEntries, beckEntries, activityEntries } =
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

  // Cartes du bandeau d'aperçu (métrique 30 j glissants fixes, indépendante de la
  // période). Une par module actif ayant des données. Humeur = mini-empreinte.
  const overviewCards = useMemo<OverviewCard[]>(() => {
    const shown = (mt: string) => activeTypes.has(mt) || showArchived
    const cards: OverviewCard[] = []
    if (sleepData.length > 0 && shown('sleep_diary')) cards.push(sleepCard(sleepData))
    if (moodData.length > 0 && shown('mood_tracker')) cards.push(moodCard(moodData, t))
    if (activityEntries.length > 0 && shown('behavioral_activation')) cards.push(activationCard(activityEntries))
    if (fearData.length > 0 && shown('fear_thermometer')) cards.push(fearCard(fearData))
    return cards
  }, [sleepData, moodData, activityEntries, fearData, activeTypes, showArchived, t])

  // Rappel de métrique clé pour l'en-tête des sections repliables (réutilise la
  // métrique 30 j des cartes d'aperçu ; humeur = empreinte, donc pas de rappel).
  const metricReminders = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of overviewCards) if (c.kind === 'metric') map.set(c.moduleType, `${c.value ?? '-'} ${c.unit}`)
    return map
  }, [overviewCards])

  // Nuits de la période de référence, re-datées sur l'axe courant (undefined si off/vide).
  const sleepComparison = useMemo(() => {
    if (!sleepCompare) return undefined
    const refPoints = buildReferenceWindow(sleepData, days, sleepRefKind)
    return refPoints.length > 0
      ? { points: refPoints, label: t(`evolution.compare_ref_${sleepRefKind}`) }
      : undefined
  }, [sleepCompare, sleepData, days, sleepRefKind, t])

  const refKindOptions = useMemo<readonly SegmentOption<ReferenceKind>[]>(
    () => [
      { value: 'previous', label: t('evolution.compare_ref_previous') },
      { value: 'last_year', label: t('evolution.compare_ref_last_year') },
    ],
    [t],
  )

  const hasData =
    scales.length > 0 ||
    moodData.length > 0 ||
    fearData.length > 0 ||
    medData.length > 0 ||
    sleepData.length > 0 ||
    chronoEntries.length > 0 ||
    beckEntries.length > 0 ||
    activityEntries.length > 0

  // Types de modules ayant des données ; au moins un est-il archivé ?
  const dataTypes = useMemo(() => {
    const types = [...scales]
    if (moodData.length > 0) types.push('mood_tracker')
    if (fearData.length > 0) types.push('fear_thermometer')
    if (medData.length > 0) types.push('medication_side_effects')
    if (sleepData.length > 0) types.push('sleep_diary')
    if (beckEntries.length > 0) types.push('beck_columns')
    if (activityEntries.length > 0) types.push('behavioral_activation')
    return types
  }, [scales, moodData.length, fearData.length, medData.length, sleepData.length, beckEntries.length, activityEntries.length])
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

      <EvolutionOverviewBand cards={overviewCards} />

      {!hasActiveData && !showArchived && (
        <p className="evolution-empty__desc">{t('evolution.all_archived')}</p>
      )}

      {/* ── Agenda du sommeil (grille + tableau fenêtre + courbes) ─────── */}
      {sleepData.length > 0 && isShown('sleep_diary') && (
        <EvolutionSection
          sectionKey="sleep_diary"
          anchorId="evo-section-sleep_diary"
          title={t('evolution.sleep_section_title')}
          badge={t('evolution.n_sessions', { count: sleepData.length })}
          metricReminder={metricReminders.get('sleep_diary')}
          archivedLabel={isArchived('sleep_diary') ? t('evolution.archived_badge') : undefined}
          expanded={isExpanded('sleep_diary')}
          onToggle={handleToggleSection}
          viewDataLabel={t('evolution.view_data')}
          onViewData={openSleepData}
        >
          <div className="evolution__compare">
            <Toggle
              checked={sleepCompare}
              onChange={setSleepCompare}
              label={t('evolution.compare_toggle')}
            />
            {sleepCompare && (
              <SegmentedControl
                options={refKindOptions}
                value={sleepRefKind}
                onChange={setSleepRefKind}
                variant="pills"
                ariaLabel={t('evolution.compare_ref_label')}
              />
            )}
          </div>
          <SleepDataPanel points={filterByRange(sleepData, days)} locale={i18n.language} periodDays={days} comparison={sleepComparison} />
        </EvolutionSection>
      )}

      {/* ── Activation comportementale (compteurs + courbe P/A + grille hebdo) ── */}
      {activityEntries.length > 0 && isShown('behavioral_activation') && (
        <EvolutionSection
          sectionKey="behavioral_activation"
          anchorId="evo-section-behavioral_activation"
          title={t('evolution.ba_section_title')}
          badge={t('evolution.n_sessions', { count: activityEntries.length })}
          metricReminder={metricReminders.get('behavioral_activation')}
          archivedLabel={isArchived('behavioral_activation') ? t('evolution.archived_badge') : undefined}
          expanded={isExpanded('behavioral_activation')}
          onToggle={handleToggleSection}
          viewDataLabel={t('evolution.view_data')}
          onViewData={openActivationData}
        >
          <BehavioralActivationPanel
            entries={filterByRange(activityEntries, days)}
            locale={i18n.language}
          />
        </EvolutionSection>
      )}

      {/* ── Colonnes de Beck — fiches complètes (maître-détail, identique à
          l'onglet « Données » du module) ─────────────────────────────────── */}
      {beckEntries.length > 0 && isShown('beck_columns') && (
        <EvolutionSection
          sectionKey="beck_columns"
          title={t('evolution.beck_section_title')}
          badge={t('evolution.n_sessions', { count: beckEntries.length })}
          archivedLabel={isArchived('beck_columns') ? t('evolution.archived_badge') : undefined}
          expanded={isExpanded('beck_columns')}
          onToggle={handleToggleSection}
          viewDataLabel={t('evolution.view_data')}
          onViewData={openBeckData}
        >
          <ColumnFormDataPanel moduleType="beck_columns" entries={beckEntries} />
        </EvolutionSection>
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

        {/* ── Mood tracker — frise 6 dimensions (#164) ─────────── */}
        {moodData.length > 0 && isShown('mood_tracker') && (
          <>
            <div className="evolution__section-header" id="evo-section-mood_tracker">
              <h3 className="evolution__section-title">{t('evolution.mood_title')}</h3>
              {isArchived('mood_tracker') && (
                <span className="evolution__archived-badge">{t('evolution.archived_badge')}</span>
              )}
            </div>
            <MoodEvolutionBlock
              points={moodData}
              markers={moodMarkersQuery.data ?? []}
              locale={i18n.language}
              periodDays={days}
            />
          </>
        )}

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
              id="evo-section-fear_thermometer"
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
            <ChronoTrackingCard entries={chronoEntries} />
          </div>
        )}

      </div>
    </div>
  )
}

// ─── EvolutionCard ────────────────────────────────────────────────────────────

interface EvolutionCardProps {
  /** Ancre de scroll pour le bandeau d'aperçu (#159). */
  id?: string
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

function EvolutionCard({ id, title, badge, score, scoreColor, wide, animateIn, archived, archivedLabel, children }: EvolutionCardProps) {
  const cls = [
    'evolution-card',
    wide ? 'evolution-card--wide' : '',
    animateIn ? 'evolution-card--animate-in' : '',
    archived ? 'evolution-card--archived' : '',
  ].filter(Boolean).join(' ')
  return (
    <div className={cls} id={id}>
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
