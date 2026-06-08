import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ModuleType } from '../../../lib/database.types'
import {
  fetchScaleEvolution,
  fetchMoodEvolution,
  fetchFearEvolution,
  fetchMedSideEffectsEvolution,
  fetchModuleSummary,
  type ScorePoint,
  type MoodPoint,
  type FearPoint,
  type MedEffectPoint,
  type ModuleSummary,
} from '../../../services/engagementService'
import { colorAt } from '../../../lib/chartConfig'
import {
  SCALE_CONFIG,
  MOOD_DIMENSIONS,
  DEFAULT_SCALE_COLOR,
  FEAR_BEFORE_COLOR,
  FEAR_AFTER_COLOR,
} from './clinicalChartConfig'
import { ModuleChart } from './ModuleChart'
import { ModuleSummaryPanel } from './ModuleSummaryPanel'
import './ModuleDataPanel.css'

type ChartKind = 'scale' | 'mood' | 'fear' | 'med'

// Modules « évidents » pour un graphique d'évolution : séries temporelles
// numériques. Les autres modules retombent sur un tableau résumé.
function chartKind(moduleType: string): ChartKind | null {
  if (moduleType === 'mood_tracker') return 'mood'
  if (moduleType === 'fear_thermometer') return 'fear'
  if (moduleType === 'medication_side_effects') return 'med'
  if (moduleType in SCALE_CONFIG) return 'scale'
  return null
}

type Fetched =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'summary'; summary: ModuleSummary }
  | { status: 'scale'; points: ScorePoint[] }
  | { status: 'mood'; points: MoodPoint[] }
  | { status: 'fear'; points: FearPoint[] }
  | { status: 'med'; effects: string[]; points: MedEffectPoint[] }

interface Props {
  patientId: string
  moduleType: ModuleType
}

/**
 * Panneau « Données » d'une card module : restitue les vraies données patient
 * synchronisées — graphique d'évolution pour les modules à séries temporelles
 * (échelles, humeur, peur, effets indésirables), tableau résumé sinon.
 * Self-fetch (aligné sur ModulePreviewPanel/ModuleSourcesPanel).
 * Conforme MDR : valeurs brutes uniquement, aucun seuil ni couleur de jugement.
 */
export function ModuleDataPanel({ patientId, moduleType }: Props) {
  const { t, i18n } = useTranslation()
  const [state, setState] = useState<Fetched>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    const kind = chartKind(moduleType)

    async function load() {
      if (kind === 'scale') {
        const points = await fetchScaleEvolution(patientId, moduleType)
        if (!cancelled) setState(points.length === 0 ? { status: 'empty' } : { status: 'scale', points })
      } else if (kind === 'mood') {
        const points = await fetchMoodEvolution(patientId)
        if (!cancelled) setState(points.length === 0 ? { status: 'empty' } : { status: 'mood', points })
      } else if (kind === 'fear') {
        const points = await fetchFearEvolution(patientId)
        if (!cancelled) setState(points.length === 0 ? { status: 'empty' } : { status: 'fear', points })
      } else if (kind === 'med') {
        const res = await fetchMedSideEffectsEvolution(patientId)
        if (!cancelled) setState(res.data.length === 0 ? { status: 'empty' } : { status: 'med', effects: res.effects, points: res.data })
      } else {
        const summary = await fetchModuleSummary(patientId, moduleType)
        if (!cancelled) setState(summary.count === 0 ? { status: 'empty' } : { status: 'summary', summary })
      }
    }

    load()
    return () => { cancelled = true }
  }, [patientId, moduleType])

  // Tableau résumé : ModuleSummaryPanel porte son propre cadre (chrome identique).
  if (state.status === 'summary') {
    return <ModuleSummaryPanel summary={state.summary} moduleType={moduleType} loading={false} />
  }

  const locale = i18n.language

  return (
    <div className="module-data-panel">
      {state.status === 'loading' && (
        <p className="module-data-panel__message">{t('common.loading')}</p>
      )}

      {state.status === 'empty' && (
        <p className="module-data-panel__message">{t('patient.summary_empty')}</p>
      )}

      {state.status === 'scale' && (() => {
        const cfg = SCALE_CONFIG[moduleType] ?? { color: DEFAULT_SCALE_COLOR, yMax: 27 }
        return (
          <ModuleChart
            title={t(`evolution.scale_${moduleType}`, { defaultValue: t(`modules.${moduleType}.label`) })}
            count={state.points.length}
            data={state.points.map(p => ({ date: p.date, score: p.score }))}
            series={[{ key: 'score', color: cfg.color, label: t(`evolution.scale_${moduleType}`, { defaultValue: t(`modules.${moduleType}.label`) }) }]}
            yDomain={[0, cfg.yMax]}
            locale={locale}
          />
        )
      })()}

      {state.status === 'mood' && (
        <ModuleChart
          title={t('evolution.mood_title')}
          count={state.points.length}
          data={state.points}
          series={MOOD_DIMENSIONS.map(d => ({ key: d.key, color: d.color, label: t(`evolution.mood_${d.key}`) }))}
          yDomain={[1, 10]}
          showLegend
          locale={locale}
        />
      )}

      {state.status === 'fear' && (
        <ModuleChart
          title={t('evolution.fear_title')}
          count={state.points.length}
          data={state.points.map(p => ({ date: p.date, suds_before: p.suds_before, suds_after: p.suds_after }))}
          series={[
            { key: 'suds_before', color: FEAR_BEFORE_COLOR, label: t('evolution.fear_before') },
            { key: 'suds_after', color: FEAR_AFTER_COLOR, label: t('evolution.fear_after') },
          ]}
          yDomain={[0, 100]}
          showLegend
          locale={locale}
        />
      )}

      {state.status === 'med' && (
        <ModuleChart
          title={t('evolution.med_effects_title')}
          count={state.points.length}
          data={state.points}
          series={state.effects.map((e, i) => ({
            key: e,
            color: colorAt(i),
            label: t(`evolution.med_effect_${e}`, { defaultValue: e }),
          }))}
          yDomain={[0, 10]}
          showLegend
          locale={locale}
        />
      )}
    </div>
  )
}
