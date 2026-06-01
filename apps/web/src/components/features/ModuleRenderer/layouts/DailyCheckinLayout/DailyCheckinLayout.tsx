import { Info } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Aperçu passif du module mobile « 1 statut par jour ». L'écran patient se
// compose de 2 onglets (Aujourd'hui / Historique), d'une question + boutons de
// statut (couleurs depuis `props.color`/`bg_color`), d'une zone de notes, et
// d'un bouton de sauvegarde. Le rendu web est purement passif — pas de saisie
// possible, pas de logique conditionnelle, conformément à MDR 2017/745.
export function DailyCheckinLayout({ fields, footer, t }: Props) {
  const configField = fields.find(f => f.field_type === 'daily_checkin_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }
  const statusOptions = fields
    .filter(f => f.field_type === 'daily_status_option')
    .sort((a, b) => a.sort_order - b.sort_order)

  const tabTodayLabel = lbl('tab_today_label')
  const tabHistoryLabel = lbl('tab_history_label')
  const todayLabel = lbl('today_label')
  const question = lbl('question')
  const notesLabel = lbl('notes_label')
  const notesPlaceholder = lbl('notes_placeholder')
  const saveLabel = lbl('save_label')
  const historyEmpty = lbl('history_empty_text')

  return (
    <div className="preview-daily">
      {(tabTodayLabel || tabHistoryLabel) && (
        <div className="preview-daily__tabs" role="tablist">
          {tabTodayLabel && (
            <span className="preview-daily__tab preview-daily__tab--active" role="tab" aria-selected="true">
              {tabTodayLabel}
            </span>
          )}
          {tabHistoryLabel && (
            <span className="preview-daily__tab" role="tab" aria-selected="false">
              {tabHistoryLabel}
            </span>
          )}
        </div>
      )}

      {todayLabel && <div className="preview-daily__date">{todayLabel}</div>}

      {question && <p className="preview-daily__question">{question}</p>}

      {statusOptions.length > 0 && (
        <div className="preview-daily__statuses">
          {statusOptions.map(opt => {
            const color = opt.props['color'] ?? '#6B7280'
            const bgColor = opt.props['bg_color'] ?? '#F3F4F6'
            const label = opt.text_code ? t(opt.text_code) : (opt.props['value'] ?? '')
            return (
              <span
                key={opt.id}
                className="preview-daily__status"
                style={{ backgroundColor: bgColor, color, borderColor: color }}
              >
                <span className="preview-daily__status-dot" style={{ backgroundColor: color }} />
                {label}
              </span>
            )
          })}
        </div>
      )}

      {(notesLabel || notesPlaceholder) && (
        <div className="preview-daily__notes">
          {notesLabel && <span className="preview-daily__notes-label">{notesLabel}</span>}
          <span className="fw-textarea" aria-label={notesPlaceholder || notesLabel} />
        </div>
      )}

      {saveLabel && (
        <div className="preview-daily__save">
          <span className="preview-daily__save-btn">{saveLabel}</span>
        </div>
      )}

      {historyEmpty && (
        <div className="preview-daily__history-empty">{historyEmpty}</div>
      )}

      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}
    </div>
  )
}
