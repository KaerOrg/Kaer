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
  DefusionPoint,
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
import { DefusionEvolutionSection } from './DefusionEvolutionSection'
import { sleepCard, moodCard, activationCard, fearCard, scaleCard, medCard, type OverviewCard } from './overviewMetrics'
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
  defusionData: DefusionPoint[]
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
  defusionData: [],
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
  // Lien « Voir les données → » : handler générique (la clé de section EST le
  // ModuleType du module — `ModuleType` est un alias de `string`, aucun cast).
  const handleViewData = useCallback((key: string) => onOpenModuleData?.(key), [onOpenModuleData])
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
  const { scales, scaleData, moodData, fearData, defusionData, medEffects, medData, sleepData, chronoEntries, beckEntries, activityEntries } =
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
    // Échelles : une carte par échelle active ayant des saisies (score moyen 30 j).
    for (const mt of scales) {
      if ((scaleData[mt]?.length ?? 0) > 0 && shown(mt)) cards.push(scaleCard(mt, scaleData[mt] ?? []))
    }
    // Effets indésirables : empreinte (une barre par effet, aucun composite, MDR).
    if (medData.length > 0 && shown('medication_side_effects')) {
      cards.push(medCard(medEffects, medData, effect => t(`evolution.med_effect_${effect}`, { defaultValue: effect })))
    }
    if (fearData.length > 0 && shown('fear_thermometer')) cards.push(fearCard(fearData))
    return cards
  }, [sleepData, moodData, activityEntries, scales, scaleData, medEffects, medData, fearData, activeTypes, showArchived, t])

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
    defusionData.length > 0 ||
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
    if (defusionData.length > 0) types.push('cognitive_saturation')
    if (medData.length > 0) types.push('medication_side_effects')
    if (sleepData.length > 0) types.push('sleep_diary')
    if (beckEntries.length > 0) types.push('beck_columns')
    if (activityEntries.length > 0) types.push('behavioral_activation')
    return types
  }, [scales, moodData.length, fearData.length, defusionData.length, medData.length, sleepData.length, beckEntries.length, activityEntries.length])
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
          onViewData={handleViewData}
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
          onViewData={handleViewData}
        >
          <BehavioralActivationPanel
            entries={filterByRange(activityEntries, days)}
            locale={i18n.language}
            periodDays={days}
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
          onViewData={handleViewData}
        >
          <ColumnFormDataPanel moduleType="beck_columns" entries={beckEntries} />
        </EvolutionSection>
      )}

      {/* ── Échelles cliniques (une section repliable par échelle) ─── */}
      {scales.filter(mt => isShown(mt)).map(mt => {
        const points = filterByRange(scaleData[mt] ?? [], days)
        const cfg = SCALE_CONFIG[mt] ?? { color: DEFAULT_SCALE_COLOR, yMax: 27 }
        const chartData = points.map(p => ({ date: p.date, score: p.score }))
        const last = points.at(-1)?.score
        return (
          <EvolutionSection
            key={mt}
            sectionKey={mt}
            anchorId={`evo-section-${mt}`}
            title={t(`evolution.scale_${mt}`)}
            badge={t('evolution.n_sessions', { count: points.length })}
            metricReminder={last != null ? t('evolution.last_score', { score: last }) : undefined}
            archivedLabel={isArchived(mt) ? t('evolution.archived_badge') : undefined}
            expanded={isExpanded(mt)}
            onToggle={handleToggleSection}
            viewDataLabel={t('evolution.view_data')}
            onViewData={handleViewData}
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
          </EvolutionSection>
        )
      })}

      {/* ── Thermomètre de l'humeur : frise 6 dimensions (#164) ───── */}
      {moodData.length > 0 && isShown('mood_tracker') && (
        <EvolutionSection
          sectionKey="mood_tracker"
          anchorId="evo-section-mood_tracker"
          title={t('evolution.mood_title')}
          badge={t('evolution.n_sessions', { count: moodData.length })}
          archivedLabel={isArchived('mood_tracker') ? t('evolution.archived_badge') : undefined}
          expanded={isExpanded('mood_tracker')}
          onToggle={handleToggleSection}
          viewDataLabel={t('evolution.view_data')}
          onViewData={handleViewData}
        >
          <MoodEvolutionBlock
            points={moodData}
            markers={moodMarkersQuery.data ?? []}
            locale={i18n.language}
            periodDays={days}
          />
        </EvolutionSection>
      )}

      {/* ── Effets indésirables : une section, un sous-graphe par effet ── */}
      {medData.length > 0 && isShown('medication_side_effects') && (
        <EvolutionSection
          sectionKey="medication_side_effects"
          anchorId="evo-section-medication_side_effects"
          title={t('evolution.med_effects_title')}
          badge={t('evolution.n_sessions', { count: medData.length })}
          archivedLabel={isArchived('medication_side_effects') ? t('evolution.archived_badge') : undefined}
          expanded={isExpanded('medication_side_effects')}
          onToggle={handleToggleSection}
          viewDataLabel={t('evolution.view_data')}
          onViewData={handleViewData}
        >
          {medEffects.map((effect, i) => {
            const points = filterByRange(medData, days).filter(p => p[effect] != null)
            if (points.length < 2) return null
            const chartData = points.map(p => ({ date: p.date, [effect]: p[effect] }))
            const last = points.at(-1)?.[effect]
            const color = colorAt(i)
            return (
              <div key={effect} className="evolution__subchart">
                <div className="evolution__subchart-head">
                  <span className="evolution__subchart-title">{t(`evolution.med_effect_${effect}`, { defaultValue: effect })}</span>
                  <span className="evolution__subchart-meta">
                    {last != null ? <span className="evolution__subchart-last" style={{ color }}>{last} / 10</span> : null}
                    <span className="evolution__subchart-count">{t('evolution.n_sessions', { count: points.length })}</span>
                  </span>
                </div>
                <LineChart
                  data={chartData}
                  series={[{ key: effect, color, label: t(`evolution.med_effect_${effect}`, { defaultValue: effect }) }]}
                  yDomain={[0, 10]}
                  locale={i18n.language}
                />
              </div>
            )
          })}
        </EvolutionSection>
      )}

      {/* ── Thermomètre de la peur : SUDS avant/après ─────────────── */}
      {fearData.length > 0 && isShown('fear_thermometer') && (() => {
        const points = filterByRange(fearData, days)
        const chartData = points.map(p => ({
          date: p.date,
          suds_before: p.suds_before,
          suds_after:  p.suds_after,
        }))
        return (
          <EvolutionSection
            sectionKey="fear_thermometer"
            anchorId="evo-section-fear_thermometer"
            title={t('evolution.fear_title')}
            badge={t('evolution.n_sessions', { count: points.length })}
            metricReminder={metricReminders.get('fear_thermometer')}
            archivedLabel={isArchived('fear_thermometer') ? t('evolution.archived_badge') : undefined}
            expanded={isExpanded('fear_thermometer')}
            onToggle={handleToggleSection}
            viewDataLabel={t('evolution.view_data')}
            onViewData={handleViewData}
          >
            {chartData.length >= 2 ? (
              <>
                <LineChart
                  data={chartData}
                  series={[
                    { key: 'suds_before', color: FEAR_BEFORE_COLOR, label: t('evolution.fear_before') },
                    { key: 'suds_after',  color: FEAR_AFTER_COLOR, label: t('evolution.fear_after') },
                  ]}
                  yDomain={[0, 100]}
                  showLegend
                  showDots
                  locale={i18n.language}
                />
                <p className="evolution-card__mention">{t('evolution.fear_global_note')}</p>
              </>
            ) : (
              <p className="evolution-card__no-data">{t('evolution.not_enough_data')}</p>
            )}
          </EvolutionSection>
        )
      })()}

      {/* ── Décrocher d'une pensée (défusion) : 2 sous-graphes + filtre technique ── */}
      {defusionData.length > 0 && isShown('cognitive_saturation') && (
        <DefusionEvolutionSection
          points={defusionData}
          days={days}
          locale={i18n.language}
          expanded={isExpanded('cognitive_saturation')}
          archivedLabel={isArchived('cognitive_saturation') ? t('evolution.archived_badge') : undefined}
          onToggle={handleToggleSection}
          onViewData={handleViewData}
          viewDataLabel={t('evolution.view_data')}
        />
      )}

      {/* ── Rythmes & régularité (chronobiologie) ─────────────────── */}
      {chronoEntries.length > 0 && (
        <EvolutionSection
          sectionKey="chronobiology_tracker"
          anchorId="evo-section-chronobiology_tracker"
          title={t('evolution.chrono_section_title')}
          expanded={isExpanded('chronobiology_tracker')}
          onToggle={handleToggleSection}
        >
          <ChronoTrackingCard entries={chronoEntries} />
        </EvolutionSection>
      )}
    </div>
  )
}
