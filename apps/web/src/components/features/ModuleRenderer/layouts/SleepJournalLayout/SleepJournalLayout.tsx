import { useTranslation } from 'react-i18next'
import { Bed, BedDouble, ChartColumnBig, ChevronRight, Clock, Ghost, Moon, Pill } from 'lucide-react'
import { Button } from '@ui/Button'
import { RatingSelector } from '@ui/RatingSelector'
import { ProgressRing } from '@ui/ProgressRing'
import type { ContentField } from '@services/moduleService'
import { SleepPreviewNight } from './SleepPreviewNight'

const QUALITY_STEPS = [1, 2, 3, 4, 5]

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

// Aperçu « Vue patient » — miroir STRICT du mobile redessiné (thème clair) :
// liste avec barres « fenêtre de sommeil » par nuit + accès « Mon bilan », puis
// écran de saisie (horaires en grille 2×2, sections, anneau d'efficacité).
// Source : apps/mobile/.../SleepJournal (modes list + entry). Le teal code
// « renseigné », jamais la qualité (MDR côté patient).
export function SleepJournalLayout({ fields, t }: Props) {
  const { i18n } = useTranslation()
  const locale = i18n.language

  const configField = fields.find(f => f.field_type === 'sleep_journal_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const ctaTitle = lbl('cta_title')
  const bilanLabel = lbl('bilan_button_label') || lbl('monthly_button_label')
  const listHeader = lbl('list_header')
  const incompleteLabel = lbl('incomplete_label')
  const emptyDayLabel = lbl('empty_day_label')
  const qualityLabel = lbl('quality_label')

  const dateLabel = lbl('date_label')
  const sectionSchedule = lbl('section_schedule_title')
  const sectionAwakenings = lbl('section_awakenings_title')
  const sectionNightmares = lbl('section_nightmares_title')
  const sectionQuality = lbl('section_quality_title')
  const sectionNotes = lbl('section_notes_title')
  const sectionNaps = lbl('section_naps_title')
  const sectionSleepAid = lbl('section_sleep_aid_title')
  const sectionRestedness = lbl('section_restedness_title')
  const inBedLabel = lbl('in_bed_label')
  const outOfBedLabel = lbl('out_of_bed_label')
  const bedtimeLabel = lbl('bedtime_label')
  const wakeTimeLabel = lbl('wake_time_label')
  const onsetLabel = lbl('onset_label')
  const awakeningsLabel = lbl('awakenings_label')
  const awakDurationLabel = lbl('awakenings_duration_label')
  const napLabel = lbl('nap_label')
  const sleepAidLabel = lbl('sleep_aid_label')
  const nightmaresLabel = lbl('nightmares_label')
  const restednessLabel = lbl('restedness_label')
  const notesPlaceholder = lbl('notes_placeholder')
  const minutesUnit = lbl('minutes_unit') || 'min'
  const efficiencyLabel = lbl('efficiency_label')
  const efficiencyExplanation = lbl('efficiency_explanation')
  const saveLabel = lbl('save_label')

  return (
    <div className="sj">
      {/* List mode : CTA + « Mon bilan » + barres « fenêtre de sommeil » ──── */}
      <div className="sj-cta">
        <Moon size={28} className="sj-cta__icon" />
        <div className="sj-cta__texts">
          {ctaTitle && <span className="sj-cta__title">{ctaTitle}</span>}
          <span className="sj-cta__subtitle">{mockDayLabel(-1, locale)}</span>
        </div>
        <ChevronRight size={20} className="sj-cta__chevron" />
      </div>

      {bilanLabel && (
        <div className="sj-month-btn">
          <ChartColumnBig size={18} className="sj-month-btn__icon" />
          <span className="sj-month-btn__label">{bilanLabel}</span>
          <ChevronRight size={16} className="sj-month-btn__chevron" />
        </div>
      )}

      {listHeader && <div className="sj-list-header">{listHeader}</div>}

      <ul className="sj-history">
        <SleepPreviewNight
          date={mockDayLabel(-1, locale)} variant="filled"
          window={{ left: 25, width: 45.8 }} start="22:30" end="06:45" duration="7h45" quality={4}
          qualityLabel={qualityLabel} incompleteLabel={incompleteLabel} emptyLabel={emptyDayLabel}
        />
        <SleepPreviewNight
          date={mockDayLabel(-2, locale)} variant="filled"
          window={{ left: 29.2, width: 43.1 }} start="23:15" end="07:00" duration="7h15" quality={3}
          qualityLabel={qualityLabel} incompleteLabel={incompleteLabel} emptyLabel={emptyDayLabel}
        />
        <SleepPreviewNight
          date={mockDayLabel(-3, locale)} variant="incomplete"
          qualityLabel={qualityLabel} incompleteLabel={incompleteLabel} emptyLabel={emptyDayLabel}
        />
        <SleepPreviewNight
          date={mockDayLabel(-4, locale)} variant="empty"
          qualityLabel={qualityLabel} incompleteLabel={incompleteLabel} emptyLabel={emptyDayLabel}
        />
      </ul>

      {/* Entry mode : aperçu de la saisie ──────────────────────────────── */}
      <div className="sj-entry">
        <div className="sj-entry__date-header">
          {dateLabel && <span className="sj-entry__date-label">{dateLabel}</span>}
          <span className="sj-entry__date-value">{mockDayLabel(0, locale)}</span>
        </div>

        {sectionSchedule && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionSchedule}</span>
            <div className="sj-time-grid">
              <div className="sj-time-cell">
                <span className="sj-time-cell__label">{inBedLabel}</span>
                <div className="sj-time-btn"><BedDouble size={16} className="sj-time-btn__icon" /><span className="sj-time-btn__value">22:45</span></div>
              </div>
              <div className="sj-time-cell">
                <span className="sj-time-cell__label">{bedtimeLabel}</span>
                <div className="sj-time-btn"><Clock size={16} className="sj-time-btn__icon" /><span className="sj-time-btn__value">23:00</span></div>
              </div>
              <div className="sj-time-cell">
                <span className="sj-time-cell__label">{wakeTimeLabel}</span>
                <div className="sj-time-btn"><Clock size={16} className="sj-time-btn__icon" /><span className="sj-time-btn__value">07:00</span></div>
              </div>
              <div className="sj-time-cell">
                <span className="sj-time-cell__label">{outOfBedLabel}</span>
                <div className="sj-time-btn"><Bed size={16} className="sj-time-btn__icon" /><span className="sj-time-btn__value">07:15</span></div>
              </div>
            </div>
            <div className="sj-section__card">
              <div className="sj-row">
                <span className="sj-row__label">{onsetLabel}</span>
                <div className="sj-minutes"><span className="sj-minutes__input">15</span><span className="sj-minutes__unit">{minutesUnit}</span></div>
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
                <div className="sj-counter"><span className="sj-counter__btn">−</span><span className="sj-counter__value">2</span><span className="sj-counter__btn">+</span></div>
              </div>
              <div className="sj-divider" />
              <div className="sj-row">
                <span className="sj-row__label">{awakDurationLabel}</span>
                <div className="sj-minutes"><span className="sj-minutes__input">20</span><span className="sj-minutes__unit">{minutesUnit}</span></div>
              </div>
            </div>
          </section>
        )}

        {sectionNaps && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionNaps}</span>
            <div className="sj-section__card">
              <div className="sj-row">
                <span className="sj-row__label">{napLabel}</span>
                <div className="sj-minutes"><span className="sj-minutes__input">0</span><span className="sj-minutes__unit">{minutesUnit}</span></div>
              </div>
            </div>
          </section>
        )}

        {sectionSleepAid && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionSleepAid}</span>
            <div className="sj-toggle-row">
              <Pill size={20} className="sj-toggle-row__icon" />
              <span className="sj-toggle-row__label">{sleepAidLabel}</span>
              <span className="sj-switch"><span className="sj-switch__thumb" /></span>
            </div>
          </section>
        )}

        {sectionNightmares && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionNightmares}</span>
            <div className="sj-toggle-row">
              <Ghost size={20} className="sj-toggle-row__icon" />
              <span className="sj-toggle-row__label">{nightmaresLabel}</span>
              <span className="sj-switch"><span className="sj-switch__thumb" /></span>
            </div>
          </section>
        )}

        {sectionQuality && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionQuality}</span>
            <div className="sj-section__card sj-section__card--center">
              {qualityLabel && <span className="sj-row__label sj-row__label--center">{qualityLabel}</span>}
              <RatingSelector variant="icon" icon="star" iconSize={32} label={qualityLabel || sectionQuality} value={4} steps={QUALITY_STEPS} showHeader={false} />
            </div>
          </section>
        )}

        {sectionRestedness && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionRestedness}</span>
            <div className="sj-section__card sj-section__card--center">
              {restednessLabel && <span className="sj-row__label sj-row__label--center">{restednessLabel}</span>}
              <RatingSelector variant="icon" icon="sun" iconSize={28} label={restednessLabel || sectionRestedness} value={4} steps={QUALITY_STEPS} showHeader={false} />
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
            <ProgressRing value={88} size={72} strokeWidth={8} label="88 %" ariaLabel={efficiencyLabel} />
            <div className="sj-efficiency__texts">
              <span className="sj-efficiency__label">{efficiencyLabel}</span>
              {efficiencyExplanation && <span className="sj-efficiency__hint">{efficiencyExplanation}</span>}
            </div>
          </div>
        )}

        {saveLabel && (
          <Button type="button" variant="primary" fullWidth disabled>
            {saveLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

// Étiquette de date courte pour l'aperçu (déterministe), dans la langue courante.
function mockDayLabel(offset: number, locale: string): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
}
