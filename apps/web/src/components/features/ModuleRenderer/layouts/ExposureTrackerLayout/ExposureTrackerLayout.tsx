import { Check, Info, MapPin, Pencil, Plus, Thermometer, Trash2 } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Aperçu fidèle au mobile : reproduit le module fear_thermometer (preview_kind
// 'exposure_tracker') — tabs Saisies/Situations + 1 carte de saisie mock
// (situation, barres SUDs avant/après, stratégies, notes), puis aperçu du
// formulaire d'entrée. Source mobile : ExposureTrackerLayout.tsx.
export function ExposureTrackerLayout({ fields, footer, t }: Props) {
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }

  const tabEntries = ft('exposure_tracker_tab_entries_label')
  const tabSituations = ft('exposure_tracker_tab_situations_label')
  const addBtn = ft('exposure_tracker_add_btn')
  const sectionTrigger = ft('exposure_tracker_section_trigger_title')
  const sectionBefore = ft('exposure_tracker_section_before_title')
  const sectionStrategies = ft('exposure_tracker_section_strategies_title')
  const sectionAfter = ft('exposure_tracker_section_after_title')
  const sectionNotes = ft('exposure_tracker_section_notes_title')
  const modeCatalogue = ft('exposure_tracker_situation_mode_catalogue')
  const modeFree = ft('exposure_tracker_situation_mode_free')
  const sudsBefore = ft('exposure_tracker_suds_before_label')
  const sudsAfter = ft('exposure_tracker_suds_after_label')
  const strategiesHint = ft('exposure_tracker_strategies_hint')
  const customPlaceholder = ft('exposure_tracker_strategy_custom_placeholder')
  const notesPlaceholder = ft('exposure_tracker_notes_placeholder')
  const saveLabel = ft('exposure_tracker_save_label')

  const strategies = fields
    .filter(f => f.field_type === 'exposure_tracker_strategy')
    .slice(0, 4)
    .map(f => (f.text_code ? t(f.text_code) : ''))
    .filter(Boolean)

  return (
    <div className="et">
      {/* Tabs Saisies / Situations ─────────────────────────────────────── */}
      {(tabEntries || tabSituations) && (
        <div className="et-tabs">
          {tabEntries && (
            <span className="et-tab et-tab--active">
              <Thermometer size={14} />
              {tabEntries}
            </span>
          )}
          {tabSituations && (
            <span className="et-tab">
              <MapPin size={14} />
              {tabSituations}
            </span>
          )}
        </div>
      )}

      {/* Carte mock d'une saisie passée ─────────────────────────────────── */}
      <article className="et-entry-card">
        <header className="et-entry-card__head">
          <div className="et-entry-card__title-block">
            <span className="et-entry-card__title">Conduire en ville</span>
            <span className="et-entry-card__date">aujourd'hui · 14:30</span>
          </div>
          <div className="et-entry-card__actions">
            <Pencil size={14} className="et-entry-card__action" />
            <Trash2 size={14} className="et-entry-card__action" />
          </div>
        </header>
        <div className="et-suds-row">
          <span className="et-suds__label" style={{ color: '#DC2626' }}>{sudsBefore || 'Avant'}</span>
          <div className="et-suds__bar">
            <div className="et-suds__fill" style={{ width: '75%', background: '#DC2626' }} />
          </div>
          <span className="et-suds__value" style={{ color: '#DC2626' }}>75</span>
        </div>
        <div className="et-suds-row">
          <span className="et-suds__label" style={{ color: '#059669' }}>{sudsAfter || 'Après'}</span>
          <div className="et-suds__bar">
            <div className="et-suds__fill" style={{ width: '40%', background: '#059669' }} />
          </div>
          <span className="et-suds__value" style={{ color: '#059669' }}>40</span>
        </div>
        {strategies.length > 0 && (
          <div className="et-strategy-chips">
            {strategies.slice(0, 2).map(s => (
              <span key={s} className="et-strategy-chip">{s}</span>
            ))}
          </div>
        )}
      </article>

      {addBtn && (
        <div className="et-fab">
          <Plus size={18} />
          <span>{addBtn}</span>
        </div>
      )}

      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}

      {/* Mode entry ──────────────────────────────────────────────────── */}
      <div className="et-entry">
        {sectionTrigger && (
          <section className="et-section">
            <span className="et-section__title">{sectionTrigger}</span>
            <div className="et-mode-toggle">
              <span className="et-mode-toggle__option et-mode-toggle__option--active">
                {modeCatalogue}
              </span>
              <span className="et-mode-toggle__option">{modeFree}</span>
            </div>
            <div className="et-section__card">
              <div className="et-radio-row et-radio-row--selected">
                <span className="et-radio et-radio--on" />
                <span>Conduire en ville</span>
              </div>
              <div className="et-radio-row">
                <span className="et-radio" />
                <span>Faire la queue dans un magasin</span>
              </div>
              <div className="et-radio-row">
                <span className="et-radio" />
                <span>Prendre la parole en réunion</span>
              </div>
            </div>
          </section>
        )}

        {sectionBefore && (
          <section className="et-section">
            <span className="et-section__title">{sectionBefore}</span>
            <SudsPicker color="#DC2626" value={75} />
          </section>
        )}

        {sectionStrategies && (
          <section className="et-section">
            <span className="et-section__title">{sectionStrategies}</span>
            {strategiesHint && <span className="et-section__hint">{strategiesHint}</span>}
            <div className="et-strategy-grid">
              {strategies.map((s, i) => (
                <span key={s} className={`et-strategy${i < 2 ? ' et-strategy--on' : ''}`}>
                  {i < 2 && <Check size={11} />}
                  {s}
                </span>
              ))}
            </div>
            {customPlaceholder && (
              <div className="et-text-input" data-placeholder={customPlaceholder} />
            )}
          </section>
        )}

        {sectionAfter && (
          <section className="et-section">
            <span className="et-section__title">{sectionAfter}</span>
            <SudsPicker color="#059669" value={40} />
          </section>
        )}

        {sectionNotes && (
          <section className="et-section">
            <span className="et-section__title">{sectionNotes}</span>
            <div className="et-textarea" data-placeholder={notesPlaceholder} />
          </section>
        )}

        {saveLabel && (
          <button type="button" className="et-save-btn" disabled>
            {saveLabel}
          </button>
        )}
      </div>
    </div>
  )
}

interface SudsPickerProps {
  color: string
  value: number
}

function SudsPicker({ color, value }: SudsPickerProps) {
  return (
    <div className="et-suds-picker">
      <div className="et-suds-picker__big" style={{ color }}>{value}</div>
      <div className="et-suds-picker__pips">
        {Array.from({ length: 11 }, (_, i) => {
          const v = i * 10
          const isOn = v === value
          return (
            <span
              key={v}
              className={`et-suds-picker__pip${isOn ? ' et-suds-picker__pip--on' : ''}`}
              style={isOn ? { borderColor: color, color, background: color + '15' } : undefined}
            >
              {v}
            </span>
          )
        })}
      </div>
    </div>
  )
}
