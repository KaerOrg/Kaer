import { Bed, BedDouble, Calendar, ChevronRight, Clock, Ghost, Moon, Pill, Sparkles } from 'lucide-react'
import { Button } from '../../../../ui/Button'
import { RatingSelector } from '../../../../ui/RatingSelector'
import type { ContentField } from '@services/moduleService'

const QUALITY_STEPS = [1, 2, 3, 4, 5]

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
  const qualityLabel = lbl('quality_label')
  const restednessLabel = lbl('restedness_label')
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
            <RatingSelector
              variant="icon"
              icon="star"
              iconSize={12}
              label={qualityLabel || sectionQuality}
              value={4}
              steps={QUALITY_STEPS}
              showHeader={false}
              className="sj-history__stars"
            />
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
            <RatingSelector
              variant="icon"
              icon="star"
              iconSize={12}
              label={qualityLabel || sectionQuality}
              value={3}
              steps={QUALITY_STEPS}
              showHeader={false}
              className="sj-history__stars"
            />
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
                <span className="sj-row__label">{inBedLabel}</span>
                <div className="sj-time-btn">
                  <BedDouble size={16} className="sj-time-btn__icon" />
                  <span className="sj-time-btn__value">22:45</span>
                </div>
              </div>
              <div className="sj-divider" />
              <div className="sj-row">
                <span className="sj-row__label">{bedtimeLabel}</span>
                <div className="sj-time-btn">
                  <Clock size={16} className="sj-time-btn__icon" />
                  <span className="sj-time-btn__value">23:00</span>
                </div>
              </div>
              <div className="sj-divider" />
              <div className="sj-row">
                <span className="sj-row__label">{wakeTimeLabel}</span>
                <div className="sj-time-btn">
                  <Clock size={16} className="sj-time-btn__icon" />
                  <span className="sj-time-btn__value">07:00</span>
                </div>
              </div>
              <div className="sj-divider" />
              <div className="sj-row">
                <span className="sj-row__label">{outOfBedLabel}</span>
                <div className="sj-time-btn">
                  <Bed size={16} className="sj-time-btn__icon" />
                  <span className="sj-time-btn__value">07:15</span>
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

        {sectionNaps && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionNaps}</span>
            <div className="sj-section__card">
              <div className="sj-row">
                <span className="sj-row__label">{napLabel}</span>
                <div className="sj-minutes">
                  <span className="sj-minutes__input">0</span>
                  <span className="sj-minutes__unit">{minutesUnit}</span>
                </div>
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
              <span className="sj-switch">
                <span className="sj-switch__thumb" />
              </span>
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
              <RatingSelector
                variant="icon"
                icon="star"
                iconSize={32}
                label={qualityLabel || sectionQuality}
                value={4}
                steps={QUALITY_STEPS}
                showHeader={false}
              />
            </div>
          </section>
        )}

        {sectionRestedness && (
          <section className="sj-section">
            <span className="sj-section__title">{sectionRestedness}</span>
            <div className="sj-section__card sj-section__card--center">
              {restednessLabel && <span className="sj-row__label sj-row__label--center">{restednessLabel}</span>}
              <RatingSelector
                variant="icon"
                icon="sun"
                iconSize={28}
                label={restednessLabel || sectionRestedness}
                value={4}
                steps={QUALITY_STEPS}
                showHeader={false}
              />
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
          <Button type="button" variant="primary" fullWidth disabled>
            {saveLabel}
          </Button>
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
