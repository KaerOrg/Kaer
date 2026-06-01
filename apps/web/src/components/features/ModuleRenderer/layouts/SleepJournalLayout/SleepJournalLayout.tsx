import { Calendar, ChevronRight, Clock, Ghost, Moon, Star, Sparkles } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

// Aperçu fidèle au mobile : reproduit l'écran de saisie d'une nuit (mode entry)
// avec ses sections (Horaires, Réveils, Cauchemars, Ressenti, Notes), un en-tête
// de date et le bouton de sauvegarde. Précédé d'un récap "list mode" : CTA
// "Saisir ma nuit d'hier", bouton mensuel et bandeau 14 dernières nuits.
//
// Source : apps/mobile/src/components/ModuleRenderer/FieldRenderer.tsx —
// SleepJournalLayout (modes list + entry).
export function SleepJournalLayout({ fields, t }: Props) {
  const configField = fields.find(f => f.field_type === 'sleep_journal_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const ctaTitle = lbl('cta_title')
  const monthlyLabel = lbl('monthly_button_label')
  const listHeader = lbl('list_header')
  const incompleteLabel = lbl('incomplete_label')
  const emptyDayLabel = lbl('empty_day_label')

  const dateLabel = lbl('date_label')
  const sectionSchedule = lbl('section_schedule_title')
  const sectionAwakenings = lbl('section_awakenings_title')
  const sectionNightmares = lbl('section_nightmares_title')
  const sectionQuality = lbl('section_quality_title')
  const sectionNotes = lbl('section_notes_title')

  const bedtimeLabel = lbl('bedtime_label')
  const wakeTimeLabel = lbl('wake_time_label')
  const onsetLabel = lbl('onset_label')
  const awakeningsLabel = lbl('awakenings_label')
  const awakDurationLabel = lbl('awakenings_duration_label')
  const nightmaresLabel = lbl('nightmares_label')
  const qualityLabel = lbl('quality_label')
  const notesPlaceholder = lbl('notes_placeholder')
  const minutesUnit = lbl('minutes_unit') || 'min'
  const efficiencyLabel = lbl('efficiency_label')
  const saveLabel = lbl('save_label')

  const todayShort = mockDayLabel(0)

  return (
    <div className="sj">
      {/* List mode : CTA + bouton mois + 14 dernières nuits ─────────────── */}
      <div className="sj-cta">
        <Moon size={28} className="sj-cta__icon" />
        <div className="sj-cta__texts">
          {ctaTitle && <span className="sj-cta__title">{ctaTitle}</span>}
          <span className="sj-cta__subtitle">{mockDayLabel(-1)}</span>
        </div>
        <ChevronRight size={20} className="sj-cta__chevron" />
      </div>

      {monthlyLabel && (
        <div className="sj-month-btn">
          <Calendar size={18} className="sj-month-btn__icon" />
          <span className="sj-month-btn__label">{monthlyLabel}</span>
          <ChevronRight size={16} className="sj-month-btn__chevron" />
        </div>
      )}

      {listHeader && <div className="sj-list-header">{listHeader}</div>}

      <ul className="sj-history">
        {/* 5 jours mock : 2 remplis, 1 incomplet, 2 vides — pour montrer les 3 états */}
        <li className="sj-history__row sj-history__row--filled">
          <span className="sj-history__dot sj-history__dot--filled" />
          <div className="sj-history__info">
            <span className="sj-history__date">{mockDayLabel(-1)}</span>
            <span className="sj-history__meta">
              22:30 → 06:45 <strong>(7h45)</strong>
            </span>
            <span className="sj-history__stars">
              {[0, 1, 2, 3].map(i => (
                <Star key={i} size={12} className="sj-history__star sj-history__star--on" fill="currentColor" />
              ))}
              <Star size={12} className="sj-history__star sj-history__star--off" />
            </span>
          </div>
          <ChevronRight size={14} className="sj-history__chevron" />
        </li>
        <li className="sj-history__row sj-history__row--filled">
          <span className="sj-history__dot sj-history__dot--filled" />
          <div className="sj-history__info">
            <span className="sj-history__date">{mockDayLabel(-2)}</span>
            <span className="sj-history__meta">
              23:15 → 07:00 <strong>(7h15)</strong>
            </span>
            <span className="sj-history__stars">
              {[0, 1, 2].map(i => (
                <Star key={i} size={12} className="sj-history__star sj-history__star--on" fill="currentColor" />
              ))}
              <Star size={12} className="sj-history__star sj-history__star--off" />
              <Star size={12} className="sj-history__star sj-history__star--off" />
            </span>
          </div>
          <ChevronRight size={14} className="sj-history__chevron" />
        </li>
        <li className="sj-history__row sj-history__row--filled">
          <span className="sj-history__dot sj-history__dot--filled" />
          <div className="sj-history__info">
            <span className="sj-history__date">{mockDayLabel(-3)}</span>
            {incompleteLabel && <span className="sj-history__meta-muted">{incompleteLabel}</span>}
          </div>
          <ChevronRight size={14} className="sj-history__chevron" />
        </li>
        <li className="sj-history__row">
          <span className="sj-history__dot" />
          <div className="sj-history__info">
            <span className="sj-history__date">{mockDayLabel(-4)}</span>
            {emptyDayLabel && <span className="sj-history__empty">{emptyDayLabel}</span>}
          </div>
          <ChevronRight size={14} className="sj-history__chevron" />
        </li>
        <li className="sj-history__row">
          <span className="sj-history__dot" />
          <div className="sj-history__info">
            <span className="sj-history__date">{mockDayLabel(-5)}</span>
            {emptyDayLabel && <span className="sj-history__empty">{emptyDayLabel}</span>}
          </div>
          <ChevronRight size={14} className="sj-history__chevron" />
        </li>
      </ul>

      {/* Entry mode : aperçu de la saisie ──────────────────────────────── */}
      <div className="sj-entry">
        <div className="sj-entry__date-header">
          {dateLabel && <span className="sj-entry__date-label">{dateLabel}</span>}
          <span className="sj-entry__date-value">{todayShort}</span>
        </div>

        {sectionSchedule && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionSchedule}</span>
            <div className="sj-section__card">
              <div className="sj-row">
                <span className="sj-row__label">{bedtimeLabel}</span>
                <div className="sj-time-btn">
                  <Clock size={16} className="sj-time-btn__icon" />
                  <span className="sj-time-btn__value">22:30</span>
                </div>
              </div>
              <div className="sj-divider" />
              <div className="sj-row">
                <span className="sj-row__label">{wakeTimeLabel}</span>
                <div className="sj-time-btn">
                  <Clock size={16} className="sj-time-btn__icon" />
                  <span className="sj-time-btn__value">06:45</span>
                </div>
              </div>
              <div className="sj-divider" />
              <div className="sj-row">
                <span className="sj-row__label">{onsetLabel}</span>
                <div className="sj-minutes">
                  <span className="sj-minutes__input">15</span>
                  <span className="sj-minutes__unit">{minutesUnit}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {sectionAwakenings && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionAwakenings}</span>
            <div className="sj-section__card">
              <div className="sj-row">
                <span className="sj-row__label">{awakeningsLabel}</span>
                <div className="sj-counter">
                  <span className="sj-counter__btn">−</span>
                  <span className="sj-counter__value">2</span>
                  <span className="sj-counter__btn">+</span>
                </div>
              </div>
              <div className="sj-divider" />
              <div className="sj-row">
                <span className="sj-row__label">{awakDurationLabel}</span>
                <div className="sj-minutes">
                  <span className="sj-minutes__input">20</span>
                  <span className="sj-minutes__unit">{minutesUnit}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {sectionNightmares && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionNightmares}</span>
            <div className="sj-toggle-row">
              <Ghost size={20} className="sj-toggle-row__icon" />
              <span className="sj-toggle-row__label">{nightmaresLabel}</span>
              <span className="sj-switch">
                <span className="sj-switch__thumb" />
              </span>
            </div>
          </section>
        )}

        {sectionQuality && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionQuality}</span>
            <div className="sj-section__card sj-section__card--center">
              {qualityLabel && <span className="sj-row__label sj-row__label--center">{qualityLabel}</span>}
              <div className="sj-stars-big">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    size={32}
                    className={n <= 4 ? 'sj-star sj-star--on' : 'sj-star sj-star--off'}
                    fill={n <= 4 ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {sectionNotes && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionNotes}</span>
            <div className="sj-section__card">
              <div className="sj-notes" data-placeholder={notesPlaceholder} />
            </div>
          </section>
        )}

        {efficiencyLabel && (
          <div className="sj-efficiency">
            <Sparkles size={18} className="sj-efficiency__icon" />
            <span className="sj-efficiency__label">{efficiencyLabel}</span>
            <span className="sj-efficiency__value">88 %</span>
          </div>
        )}

        {saveLabel && (
          <button type="button" className="sj-save-btn" disabled>
            {saveLabel}
          </button>
        )}
      </div>
    </div>
  )
}

// Étiquette de date courte côté UI (déterministe pour l'aperçu : « auj. », « -1 j », …)
function mockDayLabel(offset: number): string {
  if (offset === 0) return new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
