import { Clock, Info, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Aperçu fidèle au mobile : reproduit le module beck_columns (preview_kind
// 'column_form') — entête avec liste mock d'une entrée passée, puis aperçu
// du formulaire d'entrée colonne-par-colonne (texte + slider). Source
// mobile : ColumnFormLayout (FieldRenderer.tsx).
export function ColumnFormLayout({ fields, footer, t }: Props) {
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }

  const newBtn = ft('column_form_new_btn_label')
  const saveLabel = ft('column_form_save_label')
  const emptyTitle = ft('column_form_empty_title')
  const emptyText = ft('column_form_empty_text')

  // Colonnes : header + ses enfants text/slider
  const headers = fields
    .filter(f => f.field_type === 'column_header')
    .sort((a, b) => a.sort_order - b.sort_order)

  const childrenByHeader = new Map<string, ContentField[]>()
  for (const f of fields) {
    if (
      f.field_type === 'column_text_field' ||
      f.field_type === 'column_slider_field' ||
      f.field_type === 'column_time_field'
    ) {
      if (!f.parent_field_id) continue
      if (!childrenByHeader.has(f.parent_field_id)) childrenByHeader.set(f.parent_field_id, [])
      childrenByHeader.get(f.parent_field_id)!.push(f)
    }
  }

  // Mock content pour rendre l'aperçu plus parlant — basé sur Beck
  const mockTexts: Record<string, string> = {
    beck_col1_text: 'Réunion d\'équipe ce matin',
    beck_col2_text: 'Anxiété, frustration',
    beck_col3_text: 'Je vais perdre mes mots, ils vont me juger',
    beck_col4_text: 'J\'ai préparé ma présentation, j\'ai le droit de parler',
    beck_col5_text: 'Anxiété diminue, je me sens plus en confiance',
  }

  return (
    <div className="cf">
      {/* État vide / intro ─────────────────────────────────────────────── */}
      {(emptyTitle || emptyText) && (
        <div className="cf-empty">
          {emptyTitle && <span className="cf-empty__title">{emptyTitle}</span>}
          {emptyText && <span className="cf-empty__text">{emptyText}</span>}
        </div>
      )}

      {/* Liste mock d'une entrée ───────────────────────────────────────── */}
      <article className="cf-entry-card">
        <header className="cf-entry-card__head">
          <span className="cf-entry-card__date">aujourd'hui · 09:30</span>
          <div className="cf-entry-card__actions">
            <Pencil size={14} className="cf-entry-card__action" />
            <Trash2 size={14} className="cf-entry-card__action" />
          </div>
        </header>
        <div className="cf-entry-card__body">
          <div className="cf-entry-card__field">
            <span className="cf-entry-card__field-label" style={{ color: '#0EA5E9' }}>Situation</span>
            <span className="cf-entry-card__field-value">Réunion d'équipe ce matin</span>
          </div>
          <div className="cf-entry-card__field">
            <span className="cf-entry-card__field-label" style={{ color: '#EF4444' }}>Pensée</span>
            <span className="cf-entry-card__field-value">Je vais perdre mes mots…</span>
            <span className="cf-entry-card__field-meta">Croyance 80%</span>
          </div>
        </div>
      </article>

      {newBtn && (
        <div className="cf-new-btn">
          <Plus size={16} />
          <span>{newBtn}</span>
        </div>
      )}

      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}

      {/* Mode entry — colonnes empilées ────────────────────────────────── */}
      <div className="cf-entry">
        {headers.map((h, idx) => {
          const color = h.props['color'] ?? '#6366F1'
          const stepNumber = h.props['step_number'] ?? String(idx + 1)
          const hintCode = h.props['hint_code']
          const headerLabel = h.text_code ? t(h.text_code) : ''
          const children = childrenByHeader.get(h.id) ?? []

          return (
            <section key={h.id} className="cf-column">
              <div className="cf-column__head">
                <span className="cf-column__num" style={{ background: color }}>{stepNumber}</span>
                <div className="cf-column__titles">
                  <span className="cf-column__title" style={{ color }}>{headerLabel}</span>
                  {hintCode && <span className="cf-column__hint">{t(hintCode)}</span>}
                </div>
              </div>
              <div className="cf-column__body">
                {children.map(child => {
                  if (child.field_type === 'column_text_field') {
                    const placeholder = child.text_code ? t(child.text_code) : ''
                    const key = child.props['key']
                    const mock = key ? mockTexts[`beck_${key}_text`] : undefined
                    return (
                      <div key={child.id} className="cf-text-input">
                        {mock ? (
                          <span className="cf-text-input__value">{mock}</span>
                        ) : (
                          <span className="cf-text-input__placeholder">{placeholder}</span>
                        )}
                      </div>
                    )
                  }
                  if (child.field_type === 'column_slider_field') {
                    const sliderLabel = child.text_code ? t(child.text_code) : ''
                    const min = Number(child.props['min'] ?? 0)
                    const max = Number(child.props['max'] ?? 100)
                    const sliderColor = child.props['color'] ?? color
                    const value = Math.round((min + max) * 0.7) // mock: 70%
                    const ratio = max > min ? (value - min) / (max - min) : 0.5
                    return (
                      <div key={child.id} className="cf-slider">
                        <div className="cf-slider__head">
                          <span className="cf-slider__label">{sliderLabel}</span>
                          <span className="cf-slider__value" style={{ color: sliderColor }}>{value}%</span>
                        </div>
                        <div className="cf-slider__track">
                          <div
                            className="cf-slider__fill"
                            style={{ width: `${ratio * 100}%`, background: sliderColor }}
                          />
                        </div>
                      </div>
                    )
                  }
                  if (child.field_type === 'column_time_field') {
                    const timeLabel = child.text_code ? t(child.text_code) : ''
                    const mockValue = child.props['preview_value'] ?? '07:30'
                    return (
                      <div key={child.id} className="cf-time">
                        {timeLabel ? <span className="cf-time__label">{timeLabel}</span> : null}
                        <div className="cf-time__chip" style={{ borderColor: color }}>
                          <Clock size={14} style={{ color }} />
                          <span className="cf-time__value">{mockValue}</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </section>
          )
        })}

        {saveLabel && (
          <button type="button" className="cf-save-btn" disabled>
            <Save size={16} />
            {saveLabel}
          </button>
        )}
      </div>
    </div>
  )
}
