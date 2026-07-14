import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  buildRhythmogram,
  buildRangeStats,
  minutesToClock,
  type RhythmEntry,
  type RhythmRangeStat,
} from '@kaer/shared'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable'
import { AnchorRangeBar } from '../../../components/features/AnchorRangeBar'
import { CHRONO_ANCHORS, CHRONO_ANCHOR_KEYS, monthsWithData } from '../../../lib/chronoAnchors'
import { resolveChronoIcon } from '../../../lib/chronoIcons'
import './ChronoDataPanel.css'

interface Props {
  entries: RhythmEntry[]
}

interface AnchorRow extends RhythmRangeStat {
  color: string
  iconName: string
  label: string
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
}

/**
 * Onglet « Données » du module « Rythmes & régularité » (praticien) : lecture
 * analytique en VALEURS BRUTES — synthèse (jours saisis, repères suivis, écart
 * médian) + tableau par repère (médiane, plage min→max, écart). Aucune courbe :
 * la « bande de rythme » reste côté Vue patient. Navigation entre mois saisis.
 * Conforme MDR 2017/745 : valeurs descriptives, barres neutres, aucun seuil.
 */
export function ChronoDataPanel({ entries }: Props) {
  const { t, i18n } = useTranslation()
  const months = useMemo(() => monthsWithData(entries), [entries])
  const [idx, setIdx] = useState(months.length - 1)

  // Hooks inconditionnels (Rules of Hooks) : l'écran vide est géré APRÈS les hooks.
  const safeIdx = months.length === 0 ? 0 : Math.min(Math.max(idx, 0), months.length - 1)
  const current = months[safeIdx] ?? null

  const result = useMemo(
    () => (current ? buildRhythmogram(entries, CHRONO_ANCHOR_KEYS, current.year, current.month) : null),
    [entries, current],
  )

  const rows = useMemo<AnchorRow[]>(() => {
    if (!result) return []
    const stats = buildRangeStats(result, CHRONO_ANCHOR_KEYS)
    return CHRONO_ANCHORS.map(cfg => {
      const s = stats.find(x => x.key === cfg.key)
      return {
        key: cfg.key,
        color: cfg.color,
        iconName: cfg.iconName,
        label: t(cfg.labelCode),
        count: s?.count ?? 0,
        sdMinutes: s?.sdMinutes ?? 0,
        min: s?.min ?? null,
        median: s?.median ?? null,
        max: s?.max ?? null,
      }
    }).filter(r => r.count >= 1)
  }, [result, t])

  const summary = useMemo(() => {
    if (!current || !result) return null
    return {
      daysLogged: `${result.loggedDays} / ${daysInMonth(current.year, current.month)}`,
      anchorsTracked: String(rows.length),
      medianGap: `±${median(rows.map(r => r.sdMinutes))} ${t('modules.chronobiology_tracker.spread_unit')}`,
    }
  }, [current, result, rows, t])

  const monthLabel = useMemo(() => {
    if (!current) return ''
    const raw = new Date(current.year, current.month - 1, 1).toLocaleDateString(i18n.language, {
      month: 'long',
      year: 'numeric',
    })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [current, i18n.language])

  const goPrev = useCallback(() => setIdx(safeIdx - 1), [safeIdx])
  const goNext = useCallback(() => setIdx(safeIdx + 1), [safeIdx])

  const columns = useMemo<DataTableColumn<AnchorRow>[]>(() => [
    {
      id: 'anchor',
      header: t('modules.chronobiology_tracker.col_anchor'),
      cell: row => {
        const Icon = resolveChronoIcon(row.iconName)
        return (
          <span className="chrono-data__anchor">
            <span className="chrono-data__anchor-tile" style={{ background: `${row.color}1A` }}>
              <Icon size={15} color={row.color} />
            </span>
            {row.label}
          </span>
        )
      },
    },
    {
      id: 'median',
      header: t('modules.chronobiology_tracker.col_median'),
      cell: row => (row.median !== null ? minutesToClock(row.median) : '-'),
    },
    {
      id: 'range',
      header: t('modules.chronobiology_tracker.col_range'),
      cellClassName: 'chrono-data__range-cell',
      cell: row => (
        <AnchorRangeBar
          color={row.color}
          min={row.min}
          median={row.median}
          max={row.max}
          ariaLabel={
            row.min !== null && row.max !== null
              ? `${row.label} ${minutesToClock(row.min)} ${t('modules.chronobiology_tracker.range_to')} ${minutesToClock(row.max)}`
              : undefined
          }
        />
      ),
    },
    {
      id: 'gap',
      header: t('modules.chronobiology_tracker.col_gap'),
      cell: row => <span className="chrono-data__gap">±{row.sdMinutes}</span>,
    },
  ], [t])

  if (!current || !result || !summary) {
    return (
      <div className="module-data-panel">
        <p className="module-data-panel__message">{t('patient.summary_empty')}</p>
      </div>
    )
  }

  return (
    <div className="module-data-panel chrono-data">
      <div className="chrono-data__header">
        <div>
          <p className="chrono-data__title">{t('modules.chronobiology_tracker.regularity_title')}</p>
          <p className="chrono-data__note">{t('modules.chronobiology_tracker.regularity_note')}</p>
        </div>
        <div className="chrono-data__nav">
          <Button
            variant="ghost"
            size="xs"
            icon={<ChevronLeft size={18} />}
            aria-label={t('common.previous')}
            disabled={safeIdx === 0}
            onClick={goPrev}
          />
          <span className="chrono-data__month">{monthLabel}</span>
          <Button
            variant="ghost"
            size="xs"
            icon={<ChevronRight size={18} />}
            aria-label={t('common.next')}
            disabled={safeIdx === months.length - 1}
            onClick={goNext}
          />
        </div>
      </div>

      <div className="chrono-data__summary">
        <Card variant="outlined">
          <p className="chrono-data__stat-value">{summary.daysLogged}</p>
          <p className="chrono-data__stat-label">{t('modules.chronobiology_tracker.days_logged')}</p>
        </Card>
        <Card variant="outlined">
          <p className="chrono-data__stat-value">{summary.anchorsTracked}</p>
          <p className="chrono-data__stat-label">{t('modules.chronobiology_tracker.anchors_tracked')}</p>
        </Card>
        <Card variant="outlined">
          <p className="chrono-data__stat-value">{summary.medianGap}</p>
          <p className="chrono-data__stat-label">{t('modules.chronobiology_tracker.median_gap')}</p>
        </Card>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={row => row.key}
        ariaLabel={t('modules.chronobiology_tracker.regularity_title')}
      />

      <p className="chrono-data__mdr-note">{t('modules.chronobiology_tracker.raw_values_note')}</p>
    </div>
  )
}
