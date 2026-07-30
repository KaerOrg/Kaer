// Composition des neuf écrans du parcours patient « Nommer ce que je ressens »
// (aperçu praticien, lecture seule).
//
// ── Contrepartie assumée ─────────────────────────────────────────────────────
// Comme `DefusionPatientView`, la composition de ces écrans est du CODE WEB. Les
// libellés viennent de l'i18n et la taxonomie (familles, teintes) de la base, mais
// une refonte du parcours mobile désynchronise cet aperçu : il faudra le remettre à
// jour à la main. Le `FieldRenderer` générique, lui, suit la base tout seul, mais ne
// sait montrer qu'UN écran, pas un parcours. Il n'y a pas de troisième voie sans un
// moteur de parcours partagé mobile/web, hors sujet ici.
//
// MDR 2017/745 : données d'exemple brutes, aucune interaction, aucun jugement porté
// sur les valeurs montrées.

import { ArrowLeft, Info, MoreHorizontal, Pencil, Trash2, Bell } from 'lucide-react'
import type { PatientScreen } from './PatientScreenRail'

/** Étapes du parcours, telles que proposées en filtre au praticien. */
export type NamingStage = 'discovery' | 'entry' | 'wordless' | 'review' | 'settings'

type TFn = (key: string, opts?: Record<string, unknown>) => string

/** Intensité de l'exemple, sur la borne lue en config. Aucune valeur interprétée. */
const SAMPLE_INTENSITY = 4

interface ScreenInput {
  readonly t: TFn
  /** Codes i18n des familles, dans l'ordre du seed. */
  readonly families: readonly string[]
  readonly colorByFamily: Readonly<Record<string, string>>
  /** Borne haute de l'échelle d'intensité, lue en config. */
  readonly intensityMax: number
}

function header(label: string, withInfo = false) {
  return (
    <p className="enpv-hdr">
      <ArrowLeft size={13} />
      <span className="enpv-hdr__label">{label}</span>
      {withInfo ? <Info size={13} className="enpv-hdr__info" /> : null}
    </p>
  )
}

/** Barre de progression du parcours : décorative, jamais un score. */
function progress(step: number) {
  return (
    <div className="enpv-progress" aria-hidden="true">
      <span className="enpv-progress__fill" style={{ width: `${step * 33}%` }} />
    </div>
  )
}

/** Carte d'une saisie de l'historique (exemple). */
function entryCard(opts: { path: string; intensity: string; note?: string; meta: string; menu?: boolean }) {
  return (
    <div className="enpv-entry">
      <div className="enpv-entry__head">
        <span className="enpv-entry__path">{opts.path}</span>
        <span className="enpv-entry__intensity">{opts.intensity}</span>
        {opts.menu ? <MoreHorizontal size={13} className="enpv-entry__more" /> : null}
      </div>
      {opts.note != null ? <span className="enpv-entry__note">{opts.note}</span> : null}
      <span className="enpv-entry__meta">{opts.meta}</span>
    </div>
  )
}

export function buildNamingScreens({ t, families, colorByFamily, intensityMax }: ScreenInput): PatientScreen<NamingStage>[] {
  const e = (key: string, opts?: Record<string, unknown>) => t(`patient.enpv_${key}`, opts)
  const node = (key: string) => t(`modules.emotion_wheel.node.${key}`)
  const intensity = `${SAMPLE_INTENSITY}/${intensityMax}`

  const sampleEntry = {
    path: `${node('fear__anxiete')} · ${node('fear__anxiete__tendu')}`,
    intensity,
    note: e('sample_note'),
    meta: e('sample_meta'),
  }

  return [
    {
      id: 'first_open', stage: 'discovery', caption: e('cap_first_open'),
      body: (
        <>
          <p className="enpv-app-title">{e('module_title')}</p>
          <h6 className="enpv-title">{e('first_title')}</h6>
          <p className="enpv-sub">{e('first_intro')}</p>
          <ul className="enpv-bullets">
            <li>{e('first_bullet_1')}</li>
            <li>{e('first_bullet_2')}</li>
          </ul>
          <p className="enpv-callout">{e('first_crisis')}</p>
          <div className="enpv-cta"><span className="enpv-btn enpv-btn--full">{e('first_cta')}</span></div>
        </>
      ),
    },
    {
      id: 'home', stage: 'discovery', caption: e('cap_home'),
      body: (
        <>
          {header(e('module_title'), true)}
          <span className="enpv-btn enpv-btn--full">{e('new_btn')}</span>
          <div className="enpv-reminder">
            <span>{e('reminder_next', { time: '18:00' })}</span>
            <span className="enpv-link">{e('reminder_edit')}</span>
          </div>
          <p className="enpv-section">{e('today')}</p>
          {entryCard(sampleEntry)}
          {entryCard({
            path: e('wordless_label'), intensity: `2/${intensityMax}`,
            note: e('sample_note_2'), meta: e('sample_meta_2'),
          })}
        </>
      ),
    },
    {
      id: 'step_family', stage: 'entry', caption: e('cap_family'),
      body: (
        <>
          {header(e('new_hdr'))}
          {progress(1)}
          <h6 className="enpv-title">{e('family_title')}</h6>
          <div className="enpv-family-grid">
            {families.map(code => (
              <span
                key={code}
                className="enpv-family"
                // Teinte pastel d'identité de famille, lue en base (jamais une gravité).
                style={{ borderColor: colorByFamily[code] ?? 'var(--color-border)' }}
              >
                {t(code)}
              </span>
            ))}
          </div>
          <span className="enpv-btn enpv-btn--ghost">{e('dont_know')}</span>
          <p className="enpv-hint">{e('family_hint')}</p>
        </>
      ),
    },
    {
      id: 'step_nuance', stage: 'entry', caption: e('cap_nuance'),
      body: (
        <>
          {header(node('fear'))}
          {progress(2)}
          <h6 className="enpv-title">{e('nuance_title')}</h6>
          <div className="enpv-nuance enpv-nuance--open" style={{ borderColor: colorByFamily['modules.emotion_wheel.node.fear'] ?? 'var(--color-border)' }}>
            <span className="enpv-nuance__name">{node('fear__anxiete')}</span>
            <span className="enpv-nuance__desc">{e('nuance_desc')}</span>
            <span className="enpv-words">
              <span className="enpv-word">{node('fear__anxiete__inquiet')}</span>
              <span className="enpv-word enpv-word--on">{node('fear__anxiete__tendu')}</span>
            </span>
          </div>
          <span className="enpv-nuance">{node('fear__insecurite')}</span>
          <span className="enpv-nuance">{node('fear__effroi')}</span>
          <span className="enpv-nuance">{node('fear__mefiance')}</span>
        </>
      ),
    },
    {
      id: 'step_sheet', stage: 'entry', caption: e('cap_sheet'),
      body: (
        <>
          {header(sampleEntry.path)}
          {progress(3)}
          <h6 className="enpv-title">{e('sheet_title')}</h6>
          <p className="enpv-label">{e('intensity_label')}</p>
          <span className="enpv-steps">
            {Array.from({ length: intensityMax }, (_, i) => (
              <span key={i} className={i < SAMPLE_INTENSITY ? 'enpv-step enpv-step--on' : 'enpv-step'} />
            ))}
            <span className="enpv-steps__value">{intensity}</span>
          </span>
          <p className="enpv-label">{e('context_label')}</p>
          <span className="enpv-chips">
            <span className="enpv-chip enpv-chip--on">{t('modules.emotion_wheel.context.work')}</span>
            <span className="enpv-chip">{t('modules.emotion_wheel.context.family')}</span>
          </span>
          <p className="enpv-label">{e('note_label')}</p>
          <div className="enpv-input">{e('sample_note')}</div>
          <div className="enpv-cta"><span className="enpv-btn enpv-btn--full">{e('save')}</span></div>
        </>
      ),
    },
    {
      id: 'wordless', stage: 'wordless', caption: e('cap_wordless'),
      body: (
        <>
          {header(e('new_hdr'))}
          <h6 className="enpv-title">{e('wordless_title')}</h6>
          <p className="enpv-sub">{e('wordless_intro')}</p>
          <p className="enpv-label">{e('note_label')}</p>
          <div className="enpv-input enpv-input--tall">{e('sample_note_2')}</div>
          <p className="enpv-hint">{e('wordless_hint')}</p>
          <div className="enpv-cta"><span className="enpv-btn enpv-btn--full">{e('save')}</span></div>
        </>
      ),
    },
    {
      id: 'entry_menu', stage: 'review', caption: e('cap_menu'),
      body: (
        <>
          {header(e('module_title'), true)}
          {entryCard({ ...sampleEntry, menu: true })}
          <div className="enpv-menu">
            <span className="enpv-menu__item"><Pencil size={13} /> {e('menu_edit')}</span>
            <span className="enpv-menu__item"><Trash2 size={13} /> {e('menu_delete')}</span>
          </div>
          <p className="enpv-hint">{e('menu_hint')}</p>
        </>
      ),
    },
    {
      id: 'info_sheet', stage: 'discovery', caption: e('cap_info'),
      body: (
        <>
          <p className="enpv-app-title">{e('info_title')}</p>
          <p className="enpv-sub">{e('info_what')}</p>
          <p className="enpv-label">{e('info_how_title')}</p>
          <p className="enpv-sub">{e('info_how')}</p>
          <p className="enpv-label">{e('info_data_title')}</p>
          <p className="enpv-sub">{e('info_data')}</p>
          <p className="enpv-callout">{e('first_crisis')}</p>
        </>
      ),
    },
    {
      id: 'reminders', stage: 'settings', caption: e('cap_reminders'),
      body: (
        <>
          {header(e('reminders_title'))}
          <p className="enpv-sub">{e('reminders_intro')}</p>
          <div className="enpv-row">
            <span className="enpv-row__label"><Bell size={13} /> {e('reminders_toggle')}</span>
            <span className="enpv-toggle enpv-toggle--on" aria-hidden="true" />
          </div>
          <div className="enpv-row">
            <span className="enpv-row__label">{e('reminders_time')}</span>
            <span className="enpv-row__value">18:00</span>
          </div>
          <div className="enpv-row">
            <span className="enpv-row__label">{e('reminders_days')}</span>
            <span className="enpv-row__value">{e('reminders_days_value')}</span>
          </div>
          <p className="enpv-hint">{e('reminders_hint')}</p>
        </>
      ),
    },
  ]
}
