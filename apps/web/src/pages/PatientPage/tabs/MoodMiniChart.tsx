import { memo, useCallback } from 'react'
import { Maximize2 } from 'lucide-react'
import { Button } from '@ui/Button'
import { TrendChart, lastFilledPoint, type TrendPoint } from '@ui/Chart'
import type { MoodWebDimension } from './moodDimensions'

// ─── Petit multiple d'une dimension d'humeur (praticien) ─────────────────────
//
// Mini-carte : en-tête (pastille + libellé + dernière valeur + bouton agrandir)
// puis courbe continue compacte. Le bouton « agrandir » ouvre le détail complet
// (géré par le parent). Leaf mémoïsé à callback stable.

export interface MoodMiniChartProps {
  readonly dim: MoodWebDimension
  readonly label: string
  readonly trend: TrendPoint[]
  readonly locale: string
  readonly expandLabel: string
  readonly onExpand: (frKey: MoodWebDimension['frKey']) => void
}

export const MoodMiniChart = memo(function MoodMiniChart({
  dim, label, trend, locale, expandLabel, onExpand,
}: MoodMiniChartProps) {
  const last = lastFilledPoint(trend)
  const handleExpand = useCallback(() => onExpand(dim.frKey), [onExpand, dim.frKey])

  return (
    <div className="mood-data__multiple">
      <div className="mood-data__multiple-head">
        <span className="mood-data__dot" style={{ background: dim.colors.mid }} />
        <span className="mood-data__multiple-label">{label}</span>
        {last ? <span className="mood-data__multiple-value" style={{ color: dim.colors.ink }}>{last.value}</span> : null}
        <Button
          variant="ghost"
          size="sm"
          icon={<Maximize2 size={14} />}
          aria-label={expandLabel}
          onClick={handleExpand}
        />
      </div>
      <TrendChart
        data={trend}
        yDomain={[1, 10]}
        color={dim.colors.mid}
        locale={locale}
        height={120}
      />
    </div>
  )
})
