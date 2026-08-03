import { useCallback, useMemo, useState } from 'react'
import { Info, Plus, Bell, Trash2, Flame } from 'lucide-react'
import type { ContentField } from '@services/moduleService'
import { FieldText } from '../../fields'
import { Button } from '../../../../ui/Button'
import { Tabs } from '../../../../ui/Tabs'
import type { TabItem } from '../../../../ui/Tabs/Tabs.types'
import { SegmentedControl } from '../../../../ui/SegmentedControl'
import type { SegmentOption } from '../../../../ui/SegmentedControl'
import { RatingSelector } from '../../../../ui/RatingSelector'
import { DimensionFingerprint, type FingerprintBar } from '../../../DimensionFingerprint'
import { SymptomRibbon, type RibbonRow } from '../../../SymptomRibbon'
import { DimensionChart } from './DimensionChart'
import {
  FALLBACK_PALETTE, RANGES, RIBBON_DAYS, getMockData, markerFraction, mockCurrent,
  ribbonLoggedMask, type MockMarker, type Tab, type TimeRange,
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
// Deux saisies d'historique fictives (jour courant, veille) pour l'onglet Saisie.
const HISTORY_OFFSETS = [0, 1]

/**
 * Layout générique « tableau de bord à sliders » (preview_kind `slider_dashboard`).
 * Aperçu praticien d'un module tracker multi-dimensions (mood_tracker,
 * medication_side_effects…), à parité avec l'app mobile refondue (#161) :
 * 2 onglets (Saisie / Suivi), curseurs + empreinte à l'entrée, ruban « Vue par
 * symptôme » + courbes par dimension au suivi.
 *
 * Générique par construction : le `moduleId` est dérivé du `module_id` des fields
 * (aucun module hardcodé), la couleur d'accent est lue dans la config
 * (`accent_color` du field d'instruction), les couleurs de dimension dans
 * `field_props.color`. Réutilisable par tout module au même motif.
 *
 * Conformité MDR 2017/745 : affichage de chiffres bruts uniquement, aucun score
 * composite « bien-être » agrégé, aucun seuil, alerte ou couleur de jugement. Le
 * ruban et l'empreinte lisent N valeurs brutes, jamais une moyenne globale.
 * Données MOCK déterministes (l'aperçu ne lit jamais les vraies données patient,
 * qui vivent sur le téléphone).
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
      { id: 'tracking', label: t(`modules.${moduleId}.tab_tracking`) },
    ],
    [t, moduleId],
  )
  const onTabChange = useCallback((id: string) => {
    setActiveTab(id === 'tracking' ? 'tracking' : 'entry')
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

  // Historique de l'onglet Saisie : une carte d'empreinte 6 barres par saisie
  // récente (miroir des cartes mobiles), valeurs brutes mock, aucun agrégat.
  const history = useMemo(
    () => HISTORY_OFFSETS.map(offset => ({
      offset,
      bars: sliders.map((f, idx): FingerprintBar => ({
        key: f.id,
        label: t(f.text_code ?? ''),
        value: getMockData(f.id, '7J')[6 - offset],
        color: colorFor(f, idx),
      })),
    })),
    [sliders, colorFor, t],
  )

  // Ruban « Vue par symptôme » : une ligne par dimension sur 30 jours, ~1 jour
  // sur 7 non renseigné (masque d'assiduité mock partagé par les dimensions).
  const ribbonMask = useMemo(() => ribbonLoggedMask(moduleId, RIBBON_DAYS), [moduleId])
  const ribbonFilled = useMemo(() => ribbonMask.filter(Boolean).length, [ribbonMask])
  const ribbonRows = useMemo<RibbonRow[]>(
    () => sliders.map((f, idx) => {
      const raw = getMockData(f.id, '1M')
      return {
        key: f.id,
        label: t(f.text_code ?? ''),
        color: colorFor(f, idx),
        values: raw.map((v, i) => (ribbonMask[i] ? v : null)),
      }
    }),
    [sliders, colorFor, t, ribbonMask],
  )
  const ribbonAssiduity = t(`modules.${moduleId}.assiduity`)
    .replace('{{done}}', String(ribbonFilled))
    .replace('{{total}}', String(RIBBON_DAYS))

  // Repères mock visibles dans la fenêtre courante, ordonnés (onglet Suivi).
  const visibleMarkers = useMemo(
    () => markers
      .map(m => ({ ...m, fraction: markerFraction(m.daysAgo, timeRange) }))
      .filter((m): m is typeof m & { fraction: number } => m.fraction !== null)
      .sort((a, b) => a.fraction - b.fraction),
    [markers, timeRange],
  )

  // Série « jours renseignés » : valorise le suivi, jamais un score (MDR).
  const streak = (
    <span className="mt-streak">
      <Flame size={15} style={{ color: accent }} />
      {t(`modules.${moduleId}.streak_plural`).replace('{{count}}', '14')}
    </span>
  )

  return (
    <div className="mt">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} variant="compact" accentColor={accent} className="mt__tabs" />

      {/* ── Onglet SAISIE ── */}
      {activeTab === 'entry' ? (
        <div className="mt__content">
          {streak}

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

          {history.length > 0 ? (
            <>
              <p className="mt__history-title">{t(`modules.${moduleId}.entries_recent`)}</p>
              <div className="mt-hist">
                {history.map(h => (
                  <div key={h.offset} className="mt-hist__card">
                    <DimensionFingerprint bars={h.bars} yMax={10} barAreaHeight={38} />
                  </div>
                ))}
              </div>
            </>
          ) : null}

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

      {/* ── Onglet SUIVI ── */}
      {activeTab === 'tracking' ? (
        <div className="mt__content">
          {streak}

          <SymptomRibbon
            rows={ribbonRows}
            yMax={10}
            title={t(`modules.${moduleId}.ribbon_title`)}
            assiduityLabel={ribbonAssiduity}
            legendLabel={t(`modules.${moduleId}.ribbon_legend`)}
          />

          <div className="mt-markers">
            <div className="mt-markers__header">
              <span className="mt-markers__title">{t(`modules.${moduleId}.markers_title`)}</span>
              <Button type="button" variant="outline" size="xs" disabled icon={<Plus size={13} />}>
                {t(`modules.${moduleId}.markers_add`)}
              </Button>
            </div>
            <div className="mt-markers__list">
              {visibleMarkers
                .map((m, idx) => (
                  <div key={m.id} className="mt-marker-row">
                    <span className="mt-marker-row__badge">{idx + 1}</span>
                    <span className="mt-marker-row__label">{t(m.labelKey)}</span>
                    <Trash2 size={14} className="mt-marker-row__del" />
                  </div>
                ))}
            </div>
          </div>

          <p className="mt__history-title">{t(`modules.${moduleId}.chart_section`)}</p>
          <SegmentedControl
            variant="pills"
            options={rangeOptions}
            value={timeRange}
            onChange={setTimeRange}
            accentColor={accent}
            ariaLabel={t(`modules.${moduleId}.chart_section`)}
          />
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
    </div>
  )
}
