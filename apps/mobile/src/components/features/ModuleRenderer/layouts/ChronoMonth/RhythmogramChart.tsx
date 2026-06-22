import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { buildRhythmogram, minutesToHourLabel, type RhythmEntry } from '@kaer/shared'
import { colors, spacing } from '../../../../../theme'
import type { AnchorSpec } from './chronoMonthUtils'

interface Props {
  /** Saisies du patient (tous mois) — filtrées au mois affiché par le helper. */
  entries: readonly RhythmEntry[]
  year: number
  month: number // 1-12
  anchors: readonly AnchorSpec[]
}

const SVG_W = 320
const PAD_L = 30
const PAD_R = 10
const PAD_T = 10
const PAD_B = 6
const DATA_H = 150
const LABEL_H = 14
const SVG_H = DATA_H + LABEL_H

function hourTicks(yMin: number, yMax: number): number[] {
  const out: number[] = []
  for (let m = Math.ceil(yMin / 120) * 120; m <= yMax; m += 120) out.push(m)
  return out
}

/**
 * Rythmogramme : l'heure de chaque repère tracée jour par jour sur le mois
 * affiché. Une courbe par repère ; ligne plate = rythme régulier, bosses
 * récurrentes = décalage. Traits verticaux = débuts de semaine (repères pour
 * situer chaque jour dans la semaine et le mois).
 * MDR 2017/745 : horaires bruts uniquement, aucune analyse, aucun seuil.
 */
export function RhythmogramChart({ entries, year, month, anchors }: Props) {
  const { t } = useTranslation()

  const model = useMemo(() => {
    const anchorKeys = anchors.map(a => a.key)
    const result = buildRhythmogram(entries, anchorKeys, year, month)
    const nDays = result.data.length
    const [yMin, yMax] = result.yDomain
    const innerW = SVG_W - PAD_L - PAD_R
    const innerH = DATA_H - PAD_T - PAD_B
    const span = yMax - yMin || 1

    const xAt = (day: number) => PAD_L + (nDays <= 1 ? innerW / 2 : ((day - 1) / (nDays - 1)) * innerW)
    const yAt = (v: number) => PAD_T + ((v - yMin) / span) * innerH

    // Une série de segments (interrompus sur les jours non saisis) par repère.
    const series = anchors.map(a => {
      const segments: string[][] = []
      const dots: { x: number; y: number }[] = []
      let current: string[] = []
      for (const row of result.data) {
        const v = row[a.key]
        if (v == null) {
          if (current.length > 1) segments.push(current)
          current = []
          continue
        }
        const day = row.day as number
        const x = xAt(day)
        const y = yAt(v)
        current.push(`${x.toFixed(1)},${y.toFixed(1)}`)
        dots.push({ x, y })
      }
      if (current.length > 1) segments.push(current)
      const stat = result.anchors.find(s => s.key === a.key)
      return {
        key: a.key,
        color: a.color,
        label: t(a.labelCode),
        sdMinutes: stat?.sdMinutes ?? 0,
        count: stat?.count ?? 0,
        segments,
        dots,
      }
    }).filter(s => s.count >= 1)

    const ticks = hourTicks(yMin, yMax).map(m => ({ m, y: yAt(m), label: minutesToHourLabel(m) }))
    const weeks = result.weekStarts.map(day => ({ day, x: xAt(day) }))

    return { series, ticks, weeks, nDays, fewPoints: result.loggedDays <= 12 }
  }, [entries, year, month, anchors, t])

  const labelY = DATA_H + LABEL_H - 3

  return (
    <View style={styles.wrapper} testID="chrono-rhythmogram">
      <Text style={styles.axisTitleY}>{t('modules.chronobiology_tracker.axis_time')}</Text>
      <Svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none">
        {/* Lignes d'heures + libellés (axe Y) */}
        {model.ticks.map(tk => (
          <React.Fragment key={`h${tk.m}`}>
            <Line x1={PAD_L} y1={tk.y} x2={SVG_W - PAD_R} y2={tk.y} stroke={colors.border} strokeWidth={StyleSheet.hairlineWidth} />
            <SvgText x={PAD_L - 4} y={tk.y + 3} textAnchor="end" fontSize="8" fill={colors.textMuted}>
              {tk.label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Débuts de semaine (axe X, repères) */}
        {model.weeks.map(w => (
          <React.Fragment key={`w${w.day}`}>
            <Line x1={w.x} y1={PAD_T} x2={w.x} y2={DATA_H - PAD_B} stroke={colors.border} strokeWidth={StyleSheet.hairlineWidth} />
            <SvgText x={w.x} y={labelY} textAnchor="middle" fontSize="8" fill={colors.textMuted}>
              {String(w.day)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Une courbe par repère */}
        {model.series.map(s =>
          s.segments.map((seg, si) => (
            <Polyline
              key={`${s.key}_${si}`}
              points={seg.join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )),
        )}
        {model.series.map(s =>
          s.dots.map((d, di) => (
            <Circle
              key={`${s.key}_d${di}`}
              cx={d.x}
              cy={d.y}
              r={model.fewPoints ? 3 : 2}
              fill={s.color}
              stroke={colors.white}
              strokeWidth="1"
            />
          )),
        )}
      </Svg>
      <Text style={styles.axisTitleX}>{t('modules.chronobiology_tracker.axis_day')}</Text>

      {/* Légende : repère + écart-type brut (valeur neutre, MDR-safe) */}
      <View style={styles.legend}>
        {model.series.map(s => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{s.label}</Text>
            <Text style={styles.legendSd}>±{s.sdMinutes} min</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: spacing.lg, marginTop: spacing.xs },
  axisTitleY: { fontSize: 10, color: colors.textMuted, fontWeight: '600', marginBottom: 1 },
  axisTitleX: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textAlign: 'center', marginTop: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendLabel: { fontSize: 11, color: colors.text },
  legendSd: { fontSize: 11, color: colors.textMuted, fontVariant: ['tabular-nums'] },
})
