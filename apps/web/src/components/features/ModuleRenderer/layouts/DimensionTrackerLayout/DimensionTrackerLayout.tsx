import { useState } from 'react'
import { Info, Plus, Bell, Trash2, Flame, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'

// Aperçu praticien GÉNÉRIQUE d'un module « tracker multi-dimensions » (mood_tracker,
// medication_side_effects…). Reproduit fidèlement l'écran patient mobile : 3 onglets
// (Saisie / Évolution / Vue d'ensemble), courbes par dimension + composite, repères
// temporels, heatmap calendrier. Données MOCK déterministes (l'aperçu ne lit jamais
// les vraies données patient, qui vivent en local sur le téléphone).
//
// Conformité MDR : affichage de chiffres bruts uniquement — aucun score interprétatif,
// seuil, alerte ou couleur de jugement. Les couleurs par dimension sont décoratives.

export interface DimensionTrackerLayoutProps {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
  /** Préfixe des clés i18n : modules.{moduleId}.* */
  moduleId: string
  /** Couleur d'accent du module (onglet actif, calendrier, rappel…) */
  accent: string
}

type Tab = 'entry' | 'charts' | 'month'
type TimeRange = '7J' | '1M' | '3M' | '1A'
const RANGES: TimeRange[] = ['7J', '1M', '3M', '1A']

// Palette de repli si une dimension n'a pas de couleur en field_props.
const FALLBACK_PALETTE = [
  '#8B5CF6', '#F59E0B', '#EF4444', '#059669', '#0EA5E9', '#10B981',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#A855F7', '#84CC16',
]

// ── Mock déterministe par dimension ──────────────────────────────────────────
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function rangeLength(range: TimeRange): number {
  if (range === '7J') return 7
  if (range === '1M') return 30
  if (range === '3M') return 13
  return 12
}

function getMockData(fieldId: string, range: TimeRange): number[] {
  const len = rangeLength(range)
  const seed = hashStr(fieldId)
  const base = 3 + (seed % 4)
  const amp = 1.5 + ((seed >> 3) % 3)
  const phase = seed % 7
  return Array.from({ length: len }, (_, i) => {
    const v = base + Math.sin((i + phase) / 2.2) * amp + (((i * 13 + seed) % 3) - 1) * 0.5
    return Math.max(0, Math.min(10, Math.round(v)))
  })
}

function mockCurrent(fieldId: string): number {
  return getMockData(fieldId, '7J')[6]
}

// ── Repères temporels mock ───────────────────────────────────────────────────
const RANGE_SPAN_DAYS: Record<TimeRange, number> = { '7J': 6, '1M': 29, '3M': 84, '1A': 334 }

function markerFraction(daysAgo: number, range: TimeRange): number | null {
  const f = 1 - daysAgo / RANGE_SPAN_DAYS[range]
  return f >= 0 && f <= 1 ? f : null
}

// ── Labels d'axe X ───────────────────────────────────────────────────────────
interface XLabel { i: number; label: string }
function buildXLabels(range: TimeRange): XLabel[] {
  const now = new Date()
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('fr-FR', o).replace(/\./g, '')
  if (range === '7J') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i))
      return { i, label: String(d.getDate()) }
    })
  }
  if (range === '1M') {
    return [0, 9, 19, 29].map(i => {
      const d = new Date(now); d.setDate(d.getDate() - (29 - i))
      return { i, label: fmt(d, { day: 'numeric', month: 'short' }) }
    })
  }
  if (range === '3M') {
    return [0, 5, 11].map(i => {
      const d = new Date(now); d.setDate(d.getDate() - (11 - i) * 7)
      return { i, label: fmt(d, { month: 'short' }).slice(0, 4) }
    })
  }
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return { i, label: fmt(d, { month: 'short' }).slice(0, 3) }
  })
}

// ── Géométrie SVG ────────────────────────────────────────────────────────────
const VB_W = 280
const PAD_LEFT = 18
const PAD_R = 8
const Y_TICKS = [10, 5, 0]

function lineFor(values: number[], plotTop: number, plotH: number): string {
  const n = values.length
  return values.map((v, i) => {
    const x = PAD_LEFT + (i / (n - 1)) * (VB_W - PAD_LEFT - PAD_R)
    const y = plotTop + plotH - (v / 10) * plotH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

interface MockMarker { id: string; daysAgo: number; labelKey: string }

// ── Graphique composite ──────────────────────────────────────────────────────
interface DimSeries { id: string; color: string; label: string; values: number[] }
function CompositeChart(
  { series, range, markers, moduleId, t }:
  { series: DimSeries[]; range: TimeRange; markers: MockMarker[]; moduleId: string; t: (k: string) => string },
) {
  const plotTop = 6, plotBottom = 84, plotH = plotBottom - plotTop
  const labelY = 96
  const totalH = 100
  const n = series[0]?.values.length ?? 0
  const xLabels = buildXLabels(range)

  const avg = Array.from({ length: n }, (_, i) =>
    series.reduce((s, d) => s + d.values[i], 0) / series.length)
  const avgMean = (avg.reduce((s, v) => s + v, 0) / (avg.length || 1)).toFixed(1)

  const yAt = (v: number) => plotTop + plotH - (v / 10) * plotH
  const xFrac = (f: number) => PAD_LEFT + f * (VB_W - PAD_LEFT - PAD_R)

  const visibleMarkers = markers
    .map(m => ({ ...m, fraction: markerFraction(m.daysAgo, range) }))
    .filter((m): m is typeof m & { fraction: number } => m.fraction !== null)
    .sort((a, b) => a.fraction - b.fraction)
    .map((m, idx) => ({ ...m, index: idx + 1 }))

  return (
    <div className="mt-chart-card">
      <div className="mt-chart-card__header">
        <span className="mt-chart-card__title">{t(`modules.${moduleId}.chart_composite`)}</span>
        <span className="mt-chart-card__avg">
          {t(`modules.${moduleId}.chart_avg`).replace('{{value}}', avgMean)}
        </span>
      </div>
      <svg viewBox={`0 0 ${VB_W} ${totalH}`} className="mt-svg" preserveAspectRatio="xMidYMid meet">
        {Y_TICKS.map(v => (
          <g key={v}>
            <line x1={PAD_LEFT} y1={yAt(v)} x2={VB_W - PAD_R} y2={yAt(v)} stroke="#F1F5F9" strokeWidth={1} />
            <text x={PAD_LEFT - 4} y={yAt(v) + 3} textAnchor="end" fontSize={7} fill="#CBD5E1">{v}</text>
          </g>
        ))}
        {visibleMarkers.map(m => (
          <g key={m.id}>
            <line x1={xFrac(m.fraction)} y1={plotTop} x2={xFrac(m.fraction)} y2={plotBottom}
              stroke="#94A3B8" strokeWidth={1} strokeDasharray="3 2" />
            <circle cx={xFrac(m.fraction)} cy={plotTop} r={6} fill="#475569" />
            <text x={xFrac(m.fraction)} y={plotTop + 2.5} textAnchor="middle" fontSize={7}
              fontWeight="bold" fill="#fff">{m.index}</text>
          </g>
        ))}
        {series.map(d => (
          <polyline key={d.id} points={lineFor(d.values, plotTop, plotH)} fill="none"
            stroke={d.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
        ))}
        <polyline points={lineFor(avg, plotTop, plotH)} fill="none" stroke="#fff" strokeWidth={3.5}
          strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={lineFor(avg, plotTop, plotH)} fill="none" stroke="#64748B" strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round" />
        {xLabels.map(({ i, label }) => {
          const x = PAD_LEFT + (i / (n - 1)) * (VB_W - PAD_LEFT - PAD_R)
          return <text key={i} x={x} y={labelY} textAnchor="middle" fontSize={7} fill="#9CA3AF">{label}</text>
        })}
      </svg>
      <div className="mt-legend">
        {series.map(d => (
          <span key={d.id} className="mt-legend__item">
            <span className="mt-legend__dot" style={{ background: d.color }} />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Graphique par dimension ──────────────────────────────────────────────────
function DimensionChart(
  { color, label, values, range, moduleId, t }:
  { color: string; label: string; values: number[]; range: TimeRange; moduleId: string; t: (k: string) => string },
) {
  const plotTop = 6, plotBottom = 52, plotH = plotBottom - plotTop
  const labelY = 64, totalH = 66
  const n = values.length
  const xLabels = buildXLabels(range)
  const avg = (values.reduce((s, v) => s + v, 0) / (values.length || 1)).toFixed(1)
  const isBar = range === '7J'
  const innerW = VB_W - PAD_LEFT - PAD_R
  const yAt = (v: number) => plotTop + plotH - (v / 10) * plotH

  return (
    <div className="mt-chart-card">
      <div className="mt-chart-card__header">
        <span className="mt-chart-card__title mt-chart-card__title--dim">{label}</span>
        <span className="mt-chart-card__avg" style={{ color }}>
          {t(`modules.${moduleId}.chart_avg`).replace('{{value}}', avg)}
        </span>
      </div>
      <svg viewBox={`0 0 ${VB_W} ${totalH}`} className="mt-svg" preserveAspectRatio="xMidYMid meet">
        {[10, 5].map(v => (
          <g key={v}>
            <line x1={PAD_LEFT} y1={yAt(v)} x2={VB_W - PAD_R} y2={yAt(v)} stroke="#F1F5F9" strokeWidth={1} />
            <text x={PAD_LEFT - 4} y={yAt(v) + 3} textAnchor="end" fontSize={6} fill="#CBD5E1">{v}</text>
          </g>
        ))}
        {isBar ? (
          values.map((v, i) => {
            const bw = innerW / n * 0.6
            const x = PAD_LEFT + (i + 0.5) / n * innerW
            const h = (v / 10) * plotH
            return (
              <g key={i}>
                <text x={x} y={yAt(v) - 3} textAnchor="middle" fontSize={7} fontWeight="bold" fill={color}>{v}</text>
                <rect x={x - bw / 2} y={plotBottom - h} width={bw} height={h} rx={2} fill={color} opacity={0.9} />
              </g>
            )
          })
        ) : (
          <>
            <polyline points={lineFor(values, plotTop, plotH)} fill="none" stroke={color}
              strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {values.map((v, i) => {
              const x = PAD_LEFT + (i / (n - 1)) * innerW
              return <circle key={i} cx={x} cy={yAt(v)} r={n <= 12 ? 2.5 : 1.8} fill={color} stroke="#fff" strokeWidth={1} />
            })}
          </>
        )}
        {xLabels.map(({ i, label: lab }) => {
          const x = isBar
            ? PAD_LEFT + (i + 0.5) / n * innerW
            : PAD_LEFT + (i / (n - 1)) * innerW
          return <text key={i} x={x} y={labelY} textAnchor="middle" fontSize={6} fill="#9CA3AF">{lab}</text>
        })}
      </svg>
    </div>
  )
}

// ── Calendrier mensuel ───────────────────────────────────────────────────────
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function MonthCalendar({ accent, moduleId, t }: { accent: string; moduleId: string; t: (k: string) => string }) {
  const today = new Date()
  const year = today.getFullYear(), month = today.getMonth()
  const todayDate = today.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7

  const dayAvg: Record<number, number> = {}
  let filled = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const base = 3 + ((d - 1) / (daysInMonth - 1)) * 6
    const wiggle = (((d * 7) % 3) - 1) * 0.5
    dayAvg[d] = Math.max(1, Math.min(10, Math.round(base + wiggle)))
    filled++
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="mt-cal">
      <div className="mt-cal__nav">
        <ChevronLeft size={18} className="mt-cal__chev" />
        <span className="mt-cal__month">{monthLabel}</span>
        <ChevronRight size={18} className="mt-cal__chev mt-cal__chev--off" />
      </div>
      <div className="mt-cal__badge" style={{ borderColor: accent, color: accent }}>
        {filled} / {daysInMonth} {t(`modules.${moduleId}.month_days_label`)}
      </div>
      <div className="mt-cal__grid">
        {WEEKDAYS.map((d, i) => <span key={i} className="mt-cal__wd">{d}</span>)}
        {weeks.flat().map((d, i) => {
          if (d === null) return <span key={i} className="mt-cal__cell" />
          const avg = dayAvg[d]
          const isToday = d === todayDate
          const isFuture = d > todayDate
          if (avg != null && !isFuture) {
            const opacity = 0.25 + 0.75 * ((avg - 1) / 9)
            return (
              <span key={i} className="mt-cal__cell">
                <span className="mt-cal__day mt-cal__day--filled"
                  style={{ background: accent, opacity, ...(isToday ? { outline: '2px solid #111827' } : {}) }}>
                  {d}
                </span>
              </span>
            )
          }
          return (
            <span key={i} className="mt-cal__cell">
              <span className={`mt-cal__day mt-cal__day--empty${isFuture ? ' mt-cal__day--future' : ''}`}
                style={isToday ? { borderColor: accent, borderWidth: 2 } : undefined}>
                {d}
              </span>
            </span>
          )
        })}
      </div>
      <div className="mt-cal__legend">
        <span className="mt-cal__legend-dot" style={{ background: accent }} />
        {t(`modules.${moduleId}.month_legend`)}
      </div>
    </div>
  )
}

// ── Composant principal ──────────────────────────────────────────────────────
export function DimensionTrackerLayout({ fields, footer, t, moduleId, accent }: DimensionTrackerLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('entry')
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')

  const instruction = fields.find(f => f.field_type === 'scale_instruction')
  const sliders = fields
    .filter(f => f.field_type === 'scale_slider_question')
    .sort((a, b) => a.sort_order - b.sort_order)
  const notesField = fields.find(f => f.field_type === 'scale_text_input')

  const colorFor = (f: ContentField, idx: number): string =>
    f.props['color'] ?? FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length]

  const rangeKey: Record<TimeRange, string> = {
    '7J': 'range_7j', '1M': 'range_1m', '3M': 'range_3m', '1A': 'range_1a',
  }

  const tabLabel = (tab: Tab) => t(`modules.${moduleId}.tab_${tab}`)

  const markers: MockMarker[] = [
    { id: 'm1', daysAgo: 20, labelKey: `modules.${moduleId}.markers_example_1` },
    { id: 'm2', daysAgo: 5, labelKey: `modules.${moduleId}.markers_example_2` },
  ]

  const series: DimSeries[] = sliders.map((f, idx) => ({
    id: f.id,
    color: colorFor(f, idx),
    label: t(f.text_code ?? ''),
    values: getMockData(f.id, timeRange),
  }))

  return (
    <div className="mt">
      <div className="mt__tabs">
        {(['entry', 'charts', 'month'] as Tab[]).map(tab => (
          <button
            key={tab}
            type="button"
            className={`mt__tab${activeTab === tab ? ' mt__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* ── Onglet SAISIE ── */}
      {activeTab === 'entry' && (
        <div className="mt__content">
          {instruction && <p className="mt__instruction">{t(instruction.text_code ?? '')}</p>}

          {sliders.map((field, idx) => {
            const color = colorFor(field, idx)
            const min = field.props['min'] != null ? Number(field.props['min']) : 1
            const max = field.props['max'] != null ? Number(field.props['max']) : 10
            const lowHint = field.props['low_hint_code'] ? t(field.props['low_hint_code']) : ''
            const midHint = field.props['mid_hint_code'] ? t(field.props['mid_hint_code']) : ''
            const highHint = field.props['high_hint_code'] ? t(field.props['high_hint_code']) : ''
            const mockVal = mockCurrent(field.id)
            const span = max - min || 1
            const thumbPct = ((mockVal - min) / span) * 100
            return (
              <div key={field.id} className="mt-slider-card">
                <div className="mt-slider-card__header">
                  <span className="mt-slider-card__dot" style={{ background: color }} />
                  <span className="mt-slider-card__label" style={{ color }}>{t(field.text_code ?? '')}</span>
                  <span className="mt-slider-card__value" style={{ color }}>{mockVal}</span>
                </div>
                <div className="mt-slider">
                  <div className="mt-slider__track">
                    <div className="mt-slider__fill" style={{ width: `${thumbPct}%`, background: color }} />
                    <div className="mt-slider__thumb" style={{ left: `${thumbPct}%`, background: color }} />
                  </div>
                  <div className="mt-slider__hints">
                    <span className="mt-slider__hint">{lowHint}</span>
                    {midHint ? <span className="mt-slider__hint mt-slider__hint--mid" style={{ color }}>{midHint}</span> : null}
                    <span className="mt-slider__hint">{highHint}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {notesField && (
            <div className="mt-notes">
              <span className="mt-notes__label">{t(notesField.text_code ?? '')}</span>
              <div className="mt-notes__input" data-placeholder={
                notesField.props['placeholder_code'] ? t(notesField.props['placeholder_code']) : ''
              } />
            </div>
          )}

          <button type="button" className="mt__save-btn" disabled>{t('common.save')}</button>

          <div className="mt-reminder">
            <span className="mt-reminder__title">{t(`modules.${moduleId}.reminder_section`)}</span>
            <div className="mt-reminder__row">
              <Bell size={15} style={{ color: accent }} />
              <span className="mt-reminder__time">
                {t(`modules.${moduleId}.reminder_active`).replace('{{time}}', t(`modules.${moduleId}.reminder_preview_time`))}
              </span>
              <button type="button" className="mt-reminder__btn" disabled>
                {t(`modules.${moduleId}.reminder_adjust`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Onglet ÉVOLUTION ── */}
      {activeTab === 'charts' && (
        <div className="mt__content">
          <div className="mt-streak">
            <Flame size={15} style={{ color: accent }} />
            {t(`modules.${moduleId}.streak_plural`).replace('{{count}}', '14')}
          </div>

          <div className="mt-range">
            {RANGES.map(r => (
              <button
                key={r}
                type="button"
                className={`mt-range__btn${timeRange === r ? ' mt-range__btn--active' : ''}`}
                onClick={() => setTimeRange(r)}
              >
                {t(`modules.${moduleId}.${rangeKey[r]}`) || r}
              </button>
            ))}
          </div>

          <CompositeChart series={series} range={timeRange} markers={markers} moduleId={moduleId} t={t} />

          <div className="mt-markers">
            <div className="mt-markers__header">
              <span className="mt-markers__title">{t(`modules.${moduleId}.markers_title`)}</span>
              <button type="button" className="mt-markers__add" disabled>
                <Plus size={13} /> {t(`modules.${moduleId}.markers_add`)}
              </button>
            </div>
            <div className="mt-markers__list">
              {markers
                .map(m => ({ ...m, fraction: markerFraction(m.daysAgo, timeRange) }))
                .filter((m): m is typeof m & { fraction: number } => m.fraction !== null)
                .sort((a, b) => a.fraction - b.fraction)
                .map((m, idx) => {
                  const d = new Date(); d.setDate(d.getDate() - m.daysAgo)
                  return (
                    <div key={m.id} className="mt-marker-row">
                      <span className="mt-marker-row__badge">{idx + 1}</span>
                      <span className="mt-marker-row__date">
                        {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="mt-marker-row__label">{t(m.labelKey)}</span>
                      <Trash2 size={14} className="mt-marker-row__del" />
                    </div>
                  )
                })}
            </div>
          </div>

          <p className="mt__history-title">{t(`modules.${moduleId}.chart_section`)}</p>
          <div className="mt-dim-grid">
            {sliders.map((field, idx) => (
              <DimensionChart
                key={field.id}
                color={colorFor(field, idx)}
                label={t(field.text_code ?? '')}
                values={getMockData(field.id, timeRange)}
                range={timeRange}
                moduleId={moduleId}
                t={t}
              />
            ))}
          </div>

          {footer && (
            <div className="preview-panel__info">
              <Info size={13} className="preview-panel__info-icon" />
              <FieldText field={footer} t={t} />
            </div>
          )}
        </div>
      )}

      {/* ── Onglet VUE D'ENSEMBLE ── */}
      {activeTab === 'month' && (
        <div className="mt__content">
          <MonthCalendar accent={accent} moduleId={moduleId} t={t} />
          {footer && (
            <div className="preview-panel__info">
              <Info size={13} className="preview-panel__info-icon" />
              <FieldText field={footer} t={t} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
