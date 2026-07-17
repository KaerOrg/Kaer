import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@ui/Button'
import { SegmentedControl } from '@ui/SegmentedControl'
import { TrendChart, type TrendMarker, type TrendPoint } from '@ui/Chart'
import type { MoodWebDimension, MoodFrKey } from './moodDimensions'
import type { DimensionStats } from './moodTrend'

export type MoodCompareMode = 'none' | 'prev' | 'year'

// ─── Une ligne de la frise Humeur (page Évolution) ───────────────────────────
//
// Repliée : mini-courbe + stats (dernière valeur /10, min, max, moy, N). Dépliée :
// courbe détaillée (TrendChart partagé) avec repères datés et comparateur
// (Aucune / Mois -1 / Année A-A, série grise pointillée). Plusieurs lignes peuvent
// être dépliées à la fois. Stats descriptives sur la période affichée (MDR).
// Leaf mémoïsé à callbacks stables.

export interface MoodFriseLineProps {
  readonly dim: MoodWebDimension
  readonly trend: TrendPoint[]
  readonly stats: DimensionStats
  readonly expanded: boolean
  readonly onToggle: (frKey: MoodFrKey) => void
  readonly markers: TrendMarker[]
  readonly comparison: { data: TrendPoint[]; label: string } | undefined
  readonly compareMode: MoodCompareMode
  readonly onCompareChange: (frKey: MoodFrKey, mode: MoodCompareMode) => void
  readonly locale: string
}

export const MoodFriseLine = memo(function MoodFriseLine({
  dim, trend, stats, expanded, onToggle, markers, comparison, compareMode, onCompareChange, locale,
}: MoodFriseLineProps) {
  const { t } = useTranslation()
  const label = t(dim.labelKey)
  const handleToggle = useCallback(() => onToggle(dim.frKey), [onToggle, dim.frKey])
  const handleCompare = useCallback((m: MoodCompareMode) => onCompareChange(dim.frKey, m), [onCompareChange, dim.frKey])

  return (
    <div className="mood-frise__line">
      <div className="mood-frise__row">
        <Button
          variant="ghost"
          size="sm"
          icon={expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          aria-label={label}
          aria-expanded={expanded}
          onClick={handleToggle}
        />
        <span className="mood-frise__dot" style={{ background: dim.colors.mid }} />
        <span className="mood-frise__label">{label}</span>

        {!expanded ? (
          <span className="mood-frise__spark">
            <TrendChart data={trend} yDomain={[1, 10]} color={dim.colors.mid} locale={locale} height={44} />
          </span>
        ) : null}

        <span className="mood-frise__stats">
          <span className="mood-frise__last" style={{ color: dim.colors.ink }}>
            {stats.n > 0 && trend.length > 0 ? (trend.at(-1)?.value ?? stats.mean) : '-'}<small> / 10</small>
          </span>
          <span className="mood-frise__stat">{t('evolution.mood_stat_min')} {stats.min ?? '-'}</span>
          <span className="mood-frise__stat">{t('evolution.mood_stat_max')} {stats.max ?? '-'}</span>
          <span className="mood-frise__stat">{t('evolution.mood_stat_mean')} {stats.mean ?? '-'}</span>
          <span className="mood-frise__stat">{stats.n} {t('evolution.mood_stat_n')}</span>
        </span>
      </div>

      {expanded ? (
        <div className="mood-frise__detail">
          <div className="mood-frise__compare">
            <SegmentedControl
              options={[
                { value: 'none', label: t('evolution.mood_compare_none') },
                { value: 'prev', label: t('evolution.mood_compare_prev') },
                { value: 'year', label: t('evolution.mood_compare_year') },
              ]}
              value={compareMode}
              onChange={handleCompare}
              variant="pills"
              accentColor={dim.colors.mid}
              ariaLabel={t('evolution.mood_compare_label')}
            />
          </div>
          <TrendChart
            data={trend}
            unit="/10"
            yDomain={[1, 10]}
            color={dim.colors.mid}
            meanLabel={t('evolution.trend_mean')}
            markers={markers}
            comparison={comparison}
            locale={locale}
            height={220}
          />
        </div>
      ) : null}
    </div>
  )
})
