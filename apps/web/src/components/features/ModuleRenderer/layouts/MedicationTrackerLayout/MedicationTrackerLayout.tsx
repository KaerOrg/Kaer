import { Info, Flame, CalendarDays, Pill } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'
import { Tabs } from '../../../../ui/Tabs'
import type { TabItem } from '../../../../ui/Tabs/Tabs.types'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Aperçu passif (un seul écran montré) — onglets inertes.
const NOOP = () => {}

// Aperçu praticien du module mobile « suivi d'observance ». L'écran patient
// combine : un check global du jour (pastilles de statut neutres), un détail
// optionnel par molécule, des motifs de non-prise, un onglet calendrier mensuel
// passif et une série de « jours renseignés ». Rendu web purement passif — aucune
// saisie, aucune logique conditionnelle, conformément à MDR 2017/745 (le code
// affiche, ne conclut jamais : ni taux, ni alerte, ni tendance).
export function MedicationTrackerLayout({ fields, footer, t }: Props) {
  const configField = fields.find(f => f.field_type === 'medication_tracker_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }
  const statusOptions = fields
    .filter(f => f.field_type === 'daily_status_option')
    .sort((a, b) => a.sort_order - b.sort_order)
  const reasonOptions = fields
    .filter(f => f.field_type === 'medication_reason_option')
    .sort((a, b) => a.sort_order - b.sort_order)

  const tabs: TabItem[] = []
  const tabToday = lbl('tab_today_label')
  const tabCalendar = lbl('tab_calendar_label')
  const tabMeds = lbl('tab_meds_label')
  if (tabToday) tabs.push({ id: 'today', label: tabToday })
  if (tabCalendar) tabs.push({ id: 'calendar', label: tabCalendar })
  if (tabMeds) tabs.push({ id: 'meds', label: tabMeds })

  const streakLabel = lbl('streak_label')
  const question = lbl('question')
  const perMolecule = lbl('per_molecule_label')
  const reasonPrompt = lbl('reason_prompt')
  const notesLabel = lbl('notes_label')
  const notesPlaceholder = lbl('notes_placeholder')
  const saveLabel = lbl('save_label')
  const medsTitle = lbl('meds_title')
  const medsEmpty = lbl('meds_empty')
  const medsAdd = lbl('meds_add_label')
  const calendarLegend = lbl('calendar_legend_label')

  return (
    <div className="preview-daily">
      {tabs.length > 0 && (
        <Tabs tabs={tabs} activeTab="today" onChange={NOOP} variant="compact" />
      )}

      {streakLabel && (
        <div className="preview-streak">
          <Flame size={14} className="preview-streak__icon" />
          <span>{streakLabel}</span>
        </div>
      )}

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

      {perMolecule && (
        <div className="preview-section-label">
          <Pill size={13} className="preview-section-label__icon" />
          {perMolecule}
        </div>
      )}

      {reasonOptions.length > 0 && (
        <div className="preview-meds__reasons">
          {reasonPrompt && <span className="preview-daily__notes-label">{reasonPrompt}</span>}
          <div className="preview-daily__statuses">
            {reasonOptions.map(opt => {
              const label = opt.text_code ? t(opt.text_code) : (opt.props['value'] ?? '')
              return (
                <span key={opt.id} className="preview-chip">{label}</span>
              )
            })}
          </div>
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

      {(medsTitle || medsEmpty) && (
        <div className="preview-meds">
          {medsTitle && (
            <div className="preview-section-label">
              <Pill size={13} className="preview-section-label__icon" />
              {medsTitle}
            </div>
          )}
          {medsEmpty && <div className="preview-daily__history-empty">{medsEmpty}</div>}
          {medsAdd && <span className="preview-chip preview-chip--action">{medsAdd}</span>}
        </div>
      )}

      {calendarLegend && (
        <div className="preview-section-label">
          <CalendarDays size={13} className="preview-section-label__icon" />
          {calendarLegend}
        </div>
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
