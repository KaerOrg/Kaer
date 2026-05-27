import { useState } from 'react'
import { Info } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Données mock pour les sparklines 30 jours (1–10) et valeurs courantes
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

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 80
  const H = 24
  const step = W / (values.length - 1)
  const points = values
    .map((v, i) => `${i * step},${H - ((v - 1) / 9) * H}`)
    .join(' ')
  return (
    <svg width={W} height={H} className="mt-sparkline" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MoodTrackerLayout({ fields, footer, t }: Props) {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today')

  const instruction = fields.find(f => f.field_type === 'scale_instruction')
  const sliders = fields
    .filter(f => f.field_type === 'scale_slider_question')
    .sort((a, b) => a.sort_order - b.sort_order)
  const notesField = fields.find(f => f.field_type === 'scale_text_input')

  const tabTodayLabel   = t('modules.mood_tracker.tab_today')   || "Aujourd'hui"
  const tabHistoryLabel = t('modules.mood_tracker.tab_history') || 'Historique'
  const historyTitle    = t('modules.mood_tracker.history_title')
  const scoreLabel      = t('modules.mood_tracker.score_label')
  const notesLabel      = notesField ? t(notesField.text_code ?? '') : ''
  const notesPh         = notesField ? t(notesField.props['placeholder_code'] ?? '') : ''
  const saveLabel       = t('common.save')

  return (
    <div className="mt">
      {/* ── Onglets internes ─────────────────────────────────────────────── */}
      <div className="mt__tabs">
        <button
          type="button"
          className={`mt__tab${activeTab === 'today' ? ' mt__tab--active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          {tabTodayLabel}
        </button>
        <button
          type="button"
          className={`mt__tab${activeTab === 'history' ? ' mt__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {tabHistoryLabel}
        </button>
      </div>

      {/* ── Onglet Aujourd'hui : saisie avec sliders ─────────────────────── */}
      {activeTab === 'today' && (
        <div className="mt__content">
          {instruction && (
            <p className="mt__instruction">{t(instruction.text_code ?? '')}</p>
          )}

          {sliders.map(field => {
            const color    = field.props['color'] ?? '#6366F1'
            const lowHint  = field.props['low_hint_code']  ? t(field.props['low_hint_code'])  : ''
            const highHint = field.props['high_hint_code'] ? t(field.props['high_hint_code']) : ''
            const mockVal  = MOCK_THUMB[field.id] ?? 6
            const thumbPct = ((mockVal - 1) / 9) * 100

            return (
              <div key={field.id} className="mt-slider-card">
                <div className="mt-slider-card__header">
                  <span className="mt-slider-card__dot" style={{ background: color }} />
                  <span className="mt-slider-card__label" style={{ color }}>
                    {t(field.text_code ?? '')}
                  </span>
                  <span className="mt-slider-card__value" style={{ color }}>
                    {mockVal}
                  </span>
                </div>
                <div className="mt-slider">
                  <div className="mt-slider__track">
                    <div
                      className="mt-slider__fill"
                      style={{ width: `${thumbPct}%`, background: color }}
                    />
                    <div
                      className="mt-slider__thumb"
                      style={{ left: `${thumbPct}%`, background: color }}
                    />
                  </div>
                  <div className="mt-slider__hints">
                    <span className="mt-slider__hint">{lowHint}</span>
                    <span className="mt-slider__hint">{highHint}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {notesField && (
            <div className="mt-notes">
              {notesLabel && <span className="mt-notes__label">{notesLabel}</span>}
              <div className="mt-notes__input" data-placeholder={notesPh} />
            </div>
          )}

          <button type="button" className="mt__save-btn" disabled>
            {saveLabel}
          </button>
        </div>
      )}

      {/* ── Onglet Historique : sparklines 30 jours ─────────────────────── */}
      {activeTab === 'history' && (
        <div className="mt__content">
          {historyTitle && (
            <p className="mt__history-title">{historyTitle}</p>
          )}

          <div className="mt-history">
            {sliders.map(field => {
              const color     = field.props['color'] ?? '#6366F1'
              const sparkData = MOCK_SPARKLINE[field.id] ?? Array(30).fill(5) as number[]
              const currentVal = MOCK_CURRENT[field.id] ?? 6

              return (
                <div key={field.id} className="mt-history__row">
                  <div className="mt-history__meta">
                    <span className="mt-history__dot" style={{ background: color }} />
                    <span className="mt-history__dim">{t(field.text_code ?? '')}</span>
                  </div>
                  <Sparkline values={sparkData} color={color} />
                  <span className="mt-history__val" style={{ color }}>{currentVal}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-history__chips">
            {scoreLabel && (
              <span className="mt-history__score-label">{scoreLabel} :</span>
            )}
            {sliders.map(field => {
              const color = field.props['color'] ?? '#6366F1'
              const val   = MOCK_CURRENT[field.id] ?? 6
              return (
                <span
                  key={field.id}
                  className="mt-history__chip"
                  style={{
                    background: `${color}22`,
                    color,
                    border: `1px solid ${color}55`,
                  }}
                >
                  {t(field.text_code ?? '')} {val}
                </span>
              )
            })}
          </div>

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
