import { useCallback, useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'
import { Tabs } from '../../../../ui/Tabs'
import type { TabItem } from '../../../../ui/Tabs/Tabs.types'
import { ValueBar } from '../../../../ui/ValueBar'
import { Sparkline } from '../../../../ui/Sparkline'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

type TabId = 'today' | 'history'

// Données mock d'illustration (aperçu praticien — aucune donnée patient réelle).
const MOCK_SPARKLINE: Record<string, number[]> = {
  'mood_tracker.q_mood':     [6,7,6,5,7,8,7,6,7,7,8,7,6,7,8,8,7,6,7,7,8,9,8,7,8,7,8,7,8,7],
  'mood_tracker.q_energy':   [5,5,6,5,4,6,7,6,5,6,6,7,6,5,6,7,7,6,6,5,6,7,8,7,6,7,7,6,7,6],
  'mood_tracker.q_anxiety':  [6,7,8,7,6,5,6,7,6,5,6,5,6,7,5,4,5,6,5,6,5,4,5,4,5,4,5,5,4,5],
  'mood_tracker.q_pleasure': [5,6,6,5,7,7,6,5,6,7,7,8,7,6,7,8,7,6,7,8,8,7,8,8,7,8,8,7,8,8],
}
const MOCK_CURRENT: Record<string, number> = {
  'mood_tracker.q_mood': 7,
  'mood_tracker.q_energy': 6,
  'mood_tracker.q_anxiety': 5,
  'mood_tracker.q_pleasure': 8,
}
const MOCK_THUMB: Record<string, number> = {
  'mood_tracker.q_mood': 7,
  'mood_tracker.q_energy': 6,
  'mood_tracker.q_anxiety': 4,
  'mood_tracker.q_pleasure': 8,
}
const FALLBACK_SPARK: number[] = Array(30).fill(5)
const DEFAULT_COLOR = 'var(--color-primary)'

/**
 * Layout générique « tableau de bord à sliders » : saisie multi-dimensions (onglet
 * Aujourd'hui, une ValueBar par dimension) + historique en mini-courbes (onglet
 * Historique). Réutilisable par tout module au même motif — les libellés sont
 * résolus via le `module_id` des fields, jamais hardcodés.
 */
export function SliderDashboardLayout({ fields, footer, t }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('today')

  const moduleId = fields[0]?.module_id ?? ''

  const instruction = fields.find(f => f.field_type === 'scale_instruction')
  const sliders = fields
    .filter(f => f.field_type === 'scale_slider_question')
    .sort((a, b) => a.sort_order - b.sort_order)
  const notesField = fields.find(f => f.field_type === 'scale_text_input')

  const tabTodayLabel   = t(`modules.${moduleId}.tab_today`)
  const tabHistoryLabel = t(`modules.${moduleId}.tab_history`)
  const historyTitle    = t(`modules.${moduleId}.history_title`)
  const scoreLabel      = t(`modules.${moduleId}.score_label`)
  const notesLabel      = notesField ? t(notesField.text_code ?? '') : ''
  const notesPh         = notesField ? t(notesField.props['placeholder_code'] ?? '') : ''
  const saveLabel       = t('common.save')

  const tabs = useMemo<TabItem[]>(
    () => [
      { id: 'today', label: tabTodayLabel },
      { id: 'history', label: tabHistoryLabel },
    ],
    [tabTodayLabel, tabHistoryLabel],
  )
  const onTabChange = useCallback((id: string) => setActiveTab(id === 'history' ? 'history' : 'today'), [])

  return (
    <div className="sd">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} variant="compact" className="sd__tabs" />

      {activeTab === 'today' ? (
        <div className="sd__content">
          {instruction ? (
            <p className="sd__instruction">{t(instruction.text_code ?? '')}</p>
          ) : null}

          {sliders.map(field => (
            <ValueBar
              key={field.id}
              label={t(field.text_code ?? '')}
              value={MOCK_THUMB[field.id] ?? 6}
              min={Number(field.props['min'] ?? 1)}
              max={Number(field.props['max'] ?? 10)}
              color={field.props['color'] ?? DEFAULT_COLOR}
              lowHint={field.props['low_hint_code'] ? t(field.props['low_hint_code']) : undefined}
              highHint={field.props['high_hint_code'] ? t(field.props['high_hint_code']) : undefined}
            />
          ))}

          {notesField ? (
            <div className="sd-notes">
              {notesLabel ? <span className="sd-notes__label">{notesLabel}</span> : null}
              <div className="sd-notes__input" data-placeholder={notesPh} />
            </div>
          ) : null}

          <button type="button" className="sd__save-btn" disabled>
            {saveLabel}
          </button>
        </div>
      ) : (
        <div className="sd__content">
          {historyTitle ? <p className="sd__history-title">{historyTitle}</p> : null}

          <div className="sd-history">
            {sliders.map(field => {
              const color = field.props['color'] ?? DEFAULT_COLOR
              return (
                <div key={field.id} className="sd-history__row">
                  <div className="sd-history__meta">
                    <span className="sd-history__dot" style={{ background: color }} />
                    <span className="sd-history__dim">{t(field.text_code ?? '')}</span>
                  </div>
                  <Sparkline
                    values={MOCK_SPARKLINE[field.id] ?? FALLBACK_SPARK}
                    color={color}
                    className="sd-history__spark"
                  />
                  <span className="sd-history__val" style={{ color }}>{MOCK_CURRENT[field.id] ?? 6}</span>
                </div>
              )
            })}
          </div>

          <div className="sd-history__chips">
            {scoreLabel ? <span className="sd-history__score-label">{scoreLabel} :</span> : null}
            {sliders.map(field => {
              const color = field.props['color'] ?? DEFAULT_COLOR
              return (
                <span
                  key={field.id}
                  className="sd-history__chip"
                  style={{
                    background: `color-mix(in srgb, ${color} 13%, transparent)`,
                    color,
                    border: `1px solid color-mix(in srgb, ${color} 33%, transparent)`,
                  }}
                >
                  {t(field.text_code ?? '')} {MOCK_CURRENT[field.id] ?? 6}
                </span>
              )
            })}
          </div>

          {footer ? (
            <div className="preview-panel__info">
              <Info size={13} className="preview-panel__info-icon" />
              <FieldText field={footer} t={t} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
