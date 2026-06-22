import { useCallback, useMemo, useState } from 'react'
import { Info, Plus, Bell, Trash2, Flame } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'
import { Button } from '../../../../ui/Button'
import { Tabs } from '../../../../ui/Tabs'
import type { TabItem } from '../../../../ui/Tabs/Tabs.types'
import { SegmentedControl } from '../../../../ui/SegmentedControl'
import type { SegmentOption } from '../../../../ui/SegmentedControl'
import { RatingSelector } from '../../../../ui/RatingSelector'
import { CompositeChart } from './CompositeChart'
import { DimensionChart } from './DimensionChart'
import { MonthCalendar } from './MonthCalendar'
import {
  FALLBACK_PALETTE, RANGES, getMockData, markerFraction, mockCurrent,
  type DimSeries, type MockMarker, type Tab, type TimeRange,
} from './chartGeom'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

const DEFAULT_ACCENT = 'var(--color-primary)'
const RANGE_KEY: Record<TimeRange, string> = {
  '7J': 'range_7j', '1M': 'range_1m', '3M': 'range_3m', '1A': 'range_1a',
}

/**
 * Layout générique « tableau de bord à sliders » (preview_kind `slider_dashboard`).
 * Aperçu praticien d'un module tracker multi-dimensions (mood_tracker,
 * medication_side_effects…) : 3 onglets (Saisie / Évolution / Vue d'ensemble),
 * courbes par dimension + composite, repères temporels, heatmap calendrier.
 *
 * Générique par construction : le `moduleId` est dérivé du `module_id` des fields
 * (aucun module hardcodé), la couleur d'accent est lue dans la config
 * (`accent_color` du field d'instruction). Réutilisable par tout module au même
 * motif sans toucher au code du layout.
 *
 * Conformité MDR : affichage de chiffres bruts uniquement — aucun score
 * interprétatif, seuil, alerte ou couleur de jugement. Données MOCK déterministes
 * (l'aperçu ne lit jamais les vraies données patient, qui vivent sur le téléphone).
 */
export function SliderDashboardLayout({ fields, footer, t }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('entry')
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')

  const moduleId = fields[0]?.module_id ?? ''
  const instruction = fields.find(f => f.field_type === 'scale_instruction')
  const accent = instruction?.props['accent_color'] ?? DEFAULT_ACCENT
  const sliders = fields
    .filter(f => f.field_type === 'scale_slider_question')
    .sort((a, b) => a.sort_order - b.sort_order)
  const notesField = fields.find(f => f.field_type === 'scale_text_input')

  const colorFor = useCallback(
    (f: ContentField, idx: number): string => f.props['color'] ?? FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
    [],
  )

  const tabs = useMemo<TabItem[]>(
    () => [
      { id: 'entry', label: t(`modules.${moduleId}.tab_entry`) },
      { id: 'charts', label: t(`modules.${moduleId}.tab_charts`) },
      { id: 'month', label: t(`modules.${moduleId}.tab_month`) },
    ],
    [t, moduleId],
  )
  const onTabChange = useCallback((id: string) => {
    setActiveTab(id === 'charts' ? 'charts' : id === 'month' ? 'month' : 'entry')
  }, [])

  const markers = useMemo<MockMarker[]>(
    () => [
      { id: 'm1', daysAgo: 20, labelKey: `modules.${moduleId}.markers_example_1` },
      { id: 'm2', daysAgo: 5, labelKey: `modules.${moduleId}.markers_example_2` },
    ],
    [moduleId],
  )

  const rangeOptions = useMemo<readonly SegmentOption<TimeRange>[]>(
    () => RANGES.map(r => ({ value: r, label: t(`modules.${moduleId}.${RANGE_KEY[r]}`) || r })),
    [t, moduleId],
  )

  const series = useMemo<DimSeries[]>(
    () => sliders.map((f, idx) => ({
      id: f.id,
      color: colorFor(f, idx),
      label: t(f.text_code ?? ''),
      values: getMockData(f.id, timeRange),
    })),
    [sliders, colorFor, t, timeRange],
  )

  return (
    <div className="mt">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} variant="compact" accentColor={accent} className="mt__tabs" />

      {/* ── Onglet SAISIE ── */}
      {activeTab === 'entry' ? (
        <div className="mt__content">
          {instruction ? <p className="mt__instruction">{t(instruction.text_code ?? '')}</p> : null}

          {sliders.map((field, idx) => {
            const color = colorFor(field, idx)
            const min = field.props['min'] != null ? Number(field.props['min']) : 1
            const max = field.props['max'] != null ? Number(field.props['max']) : 10
            const lowHint = field.props['low_hint_code'] ? t(field.props['low_hint_code']) : ''
            const midHint = field.props['mid_hint_code'] ? t(field.props['mid_hint_code']) : ''
            const highHint = field.props['high_hint_code'] ? t(field.props['high_hint_code']) : ''
            const mockVal = mockCurrent(field.id)
            return (
              <div key={field.id} className="mt-slider-card">
                <RatingSelector
                  variant="bar"
                  label={t(field.text_code ?? '')}
                  value={mockVal}
                  min={min}
                  max={max}
                  color={color}
                  lowHint={lowHint}
                  midHint={midHint}
                  highHint={highHint}
                />
              </div>
            )
          })}

          {notesField ? (
            <div className="mt-notes">
              <span className="mt-notes__label">{t(notesField.text_code ?? '')}</span>
              <div className="mt-notes__input" data-placeholder={
                notesField.props['placeholder_code'] ? t(notesField.props['placeholder_code']) : ''
              } />
            </div>
          ) : null}

          <Button type="button" variant="primary" fullWidth disabled>{t('common.save')}</Button>

          <div className="mt-reminder">
            <span className="mt-reminder__title">{t(`modules.${moduleId}.reminder_section`)}</span>
            <div className="mt-reminder__row">
              <Bell size={15} style={{ color: accent }} />
              <span className="mt-reminder__time">
                {t(`modules.${moduleId}.reminder_active`).replace('{{time}}', t(`modules.${moduleId}.reminder_preview_time`))}
              </span>
              <Button type="button" variant="secondary" size="sm" disabled>
                {t(`modules.${moduleId}.reminder_adjust`)}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Onglet ÉVOLUTION ── */}
      {activeTab === 'charts' ? (
        <div className="mt__content">
          <div className="mt-streak">
            <Flame size={15} style={{ color: accent }} />
            {t(`modules.${moduleId}.streak_plural`).replace('{{count}}', '14')}
          </div>

          <SegmentedControl
            variant="pills"
            options={rangeOptions}
            value={timeRange}
            onChange={setTimeRange}
            accentColor={accent}
            ariaLabel={t(`modules.${moduleId}.tab_charts`)}
          />

          <CompositeChart series={series} range={timeRange} markers={markers} moduleId={moduleId} t={t} />

          <div className="mt-markers">
            <div className="mt-markers__header">
              <span className="mt-markers__title">{t(`modules.${moduleId}.markers_title`)}</span>
              <Button type="button" variant="outline" size="xs" disabled icon={<Plus size={13} />}>
                {t(`modules.${moduleId}.markers_add`)}
              </Button>
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

          {footer ? (
            <div className="preview-panel__info">
              <Info size={13} className="preview-panel__info-icon" />
              <FieldText field={footer} t={t} />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Onglet VUE D'ENSEMBLE ── */}
      {activeTab === 'month' ? (
        <div className="mt__content">
          <MonthCalendar accent={accent} moduleId={moduleId} t={t} />
          {footer ? (
            <div className="preview-panel__info">
              <Info size={13} className="preview-panel__info-icon" />
              <FieldText field={footer} t={t} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
