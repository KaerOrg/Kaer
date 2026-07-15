import { memo, useCallback } from 'react'
import { Chip } from '@ui/Chip'
import type { SleepMetricKey } from './sleepMetrics'

interface Props {
  metricKey: SleepMetricKey
  label: string
  active: boolean
  onSelect: (key: SleepMetricKey) => void
}

// Puce de sélection d'une métrique du graphe de tendance. Mémoïsée + callback figé :
// rendue dans une liste de 6 chips, ne re-rend que si son état actif change.
function MetricChipInner({ metricKey, label, active, onSelect }: Props) {
  const handleClick = useCallback(() => onSelect(metricKey), [metricKey, onSelect])
  return <Chip selectable selected={active} label={label} onClick={handleClick} />
}

export const MetricChip = memo(MetricChipInner)
