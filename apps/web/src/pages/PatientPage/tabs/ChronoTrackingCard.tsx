import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { buildRhythmogram, buildRangeStats, minutesToClock, type RhythmEntry } from '@kaer/shared'
import { AnchorRangeBar } from '../../../components/features/AnchorRangeBar'
import { CHRONO_ANCHORS, CHRONO_ANCHOR_KEYS, monthsWithData } from '../../../lib/chronoAnchors'
import { resolveChronoIcon } from '../../../lib/chronoIcons'
import './ChronoTrackingCard.css'

interface Props {
  entries: RhythmEntry[]
}

/**
 * Carte de suivi « Régularité des horaires » (onglet Évolution) : une ligne par
 * repère sur un axe 0 h → 24 h — plage réelle du mois (segment min→max) + point
 * médian + écart brut `±NN`. Rendu pensé lisibilité praticien (pas identique au
 * mobile). Réutilise `AnchorRangeBar` (mutualisé avec l'onglet Données).
 * MDR 2017/745 : valeurs brutes descriptives, aucun seuil ni couleur de gravité.
 */
export function ChronoTrackingCard({ entries }: Props) {
  const { t, i18n } = useTranslation()

  const month = useMemo(() => {
    const months = monthsWithData(entries)
    return months.length ? months[months.length - 1] : null
  }, [entries])

  const rows = useMemo(() => {
    if (!month) return []
    const result = buildRhythmogram(entries, CHRONO_ANCHOR_KEYS, month.year, month.month)
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
  }, [entries, month, t])

  const monthLabel = useMemo(() => {
    if (!month) return ''
    const raw = new Date(month.year, month.month - 1, 1).toLocaleDateString(i18n.language, {
      month: 'long',
      year: 'numeric',
    })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [month, i18n.language])

  if (rows.length === 0) return null

  return (
    <div className="chrono-tracking">
      <div className="chrono-tracking__head">
        <p className="chrono-tracking__title">{t('modules.chronobiology_tracker.regularity_title')}</p>
        <span className="chrono-tracking__month">{monthLabel}</span>
      </div>

      <ul className="chrono-tracking__list">
        {rows.map(row => {
          const Icon = resolveChronoIcon(row.iconName)
          return (
            <li key={row.key} className="chrono-tracking__row">
              <span className="chrono-tracking__anchor">
                <span className="chrono-tracking__tile" style={{ background: `${row.color}1A` }}>
                  <Icon size={14} color={row.color} />
                </span>
                {row.label}
              </span>
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
              <span className="chrono-tracking__median">
                {row.median !== null ? minutesToClock(row.median) : '-'}
              </span>
              <span className="chrono-tracking__gap">±{row.sdMinutes}</span>
            </li>
          )
        })}
      </ul>

      <p className="chrono-tracking__legend">{t('modules.chronobiology_tracker.tracking_legend')}</p>
    </div>
  )
}
