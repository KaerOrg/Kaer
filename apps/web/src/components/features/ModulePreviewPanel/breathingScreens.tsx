import { Bell, Pause, Square, Volume2, Wind } from 'lucide-react'
import { formatRhythm, type BreathingTechniqueSpec } from '@kaer/shared'
import type { PatientScreen } from './PatientScreenRail'

// ─── Écrans du parcours patient « Respiration » (aperçu praticien, W5) ────────
//
// Les quatre écrans mobiles miniaturisés : hub, préparation, session, clôture.
// Tout ce qui est affiché vient soit de la CONFIGURATION du patient (techniques
// activées, technique principale, objectif hebdomadaire), soit de valeurs d'EXEMPLE
// déclarées ici. Aucune vraie saisie patient n'entre dans cet aperçu : les données
// ont leur propre onglet.
//
// MDR 2017/745 : les trois choix de ressenti de l'écran de clôture portent une teinte
// UNIQUE. Proposer un « bon » et un « mauvais » bouton au moment de répondre
// orienterait la réponse du patient.

export type BreathingStage = 'hub' | 'preparation' | 'session' | 'closing'

type TFn = (key: string, opts?: Record<string, unknown>) => string

/** Valeurs d'exemple de l'aperçu : jamais des sessions réelles du patient. */
const SAMPLE_WEEK_DONE = 2
const SAMPLE_WEEK_DAYS = [true, false, true, false, false, false, false]
const SAMPLE_DURATIONS_MIN = [3, 5, 10]
const SAMPLE_CYCLES = 30
const SAMPLE_ELAPSED = '2:30'
const SAMPLE_PROGRESS_PERCENT = 50
const SAMPLE_REMINDER_TIME = '21:00'

export interface BreathingPreviewConfig {
  /** Techniques activées pour ce patient, dans l'ordre de la config. */
  readonly techniques: readonly BreathingTechniqueSpec[]
  /** Technique mise en avant sur le hub, `null` si aucune n'est activée. */
  readonly primary: BreathingTechniqueSpec | null
  /** Objectif hebdomadaire réglé par le patient, `null` s'il n'en a pas. */
  readonly weeklyGoal: number | null
}

export function buildBreathingScreens(
  t: TFn,
  config: BreathingPreviewConfig,
): PatientScreen<BreathingStage>[] {
  const bpv = (key: string, opts?: Record<string, unknown>) => t(`patient.bpv_${key}`, opts)
  const name = (key: string) => t(`modules.breathing_techniques.${key}_name`)
  const accent = config.primary?.color ?? 'var(--color-primary)'
  const others = config.techniques.filter(technique => technique.key !== config.primary?.key)

  return [
    {
      id: 'hub', stage: 'hub', caption: bpv('cap_hub'),
      body: (
        <>
          <h6 className="bpv-title">{bpv('hub_title')}</h6>

          {config.primary == null ? (
            <p className="bpv-empty">{bpv('hub_no_technique')}</p>
          ) : (
            <div className="bpv-primary" style={{ borderColor: accent }}>
              <span className="bpv-primary__name">{name(config.primary.key)}</span>
              <span className="bpv-primary__rhythm">{formatRhythm(config.primary.phases)}</span>
              <span className="bpv-primary__meta">
                {bpv('minutes', { count: config.primary.recommendedDurationMin })}
              </span>
              <span className="bpv-btn" style={{ background: accent }}>{bpv('start')}</span>
            </div>
          )}

          <div className="bpv-week">
            <span className="bpv-week__label">
              {config.weeklyGoal == null
                ? bpv('week_no_goal')
                : bpv('week_goal', { done: SAMPLE_WEEK_DONE, goal: config.weeklyGoal })}
            </span>
            <span className="bpv-week__dots">
              {SAMPLE_WEEK_DAYS.map((done, index) => (
                <span
                  key={index}
                  className={done ? 'bpv-dot bpv-dot--done' : 'bpv-dot'}
                  style={done ? { background: accent } : undefined}
                />
              ))}
            </span>
          </div>

          <div className="bpv-row">
            <Bell size={12} />
            <span>{bpv('reminder', { time: SAMPLE_REMINDER_TIME })}</span>
          </div>

          {others.length > 0 && (
            <>
              <p className="bpv-section">{bpv('other_techniques')}</p>
              {others.map(technique => (
                <div className="bpv-trow" key={technique.key}>
                  <span className="bpv-trow__dot" style={{ background: technique.color }} />
                  <span className="bpv-trow__name">{name(technique.key)}</span>
                  <span className="bpv-trow__rhythm">{formatRhythm(technique.phases)}</span>
                </div>
              ))}
            </>
          )}
        </>
      ),
    },

    {
      id: 'preparation', stage: 'preparation', caption: bpv('cap_preparation'),
      body: (
        <>
          <h6 className="bpv-title">{config.primary == null ? bpv('hub_title') : name(config.primary.key)}</h6>
          <p className="bpv-sub">{bpv('prep_duration')}</p>
          <div className="bpv-durations">
            {SAMPLE_DURATIONS_MIN.map((minutes, index) => (
              <span
                key={minutes}
                className={index === 1 ? 'bpv-chip bpv-chip--on' : 'bpv-chip'}
                style={index === 1 ? { borderColor: accent, color: accent } : undefined}
              >
                {bpv('minutes', { count: minutes })}
              </span>
            ))}
          </div>

          <div className="bpv-row bpv-row--between">
            <span className="bpv-row__label"><Volume2 size={12} /> {bpv('prep_ambient')}</span>
            <span className="bpv-switch" />
          </div>
          <div className="bpv-row bpv-row--between">
            <span className="bpv-row__label"><Wind size={12} /> {bpv('prep_guided')}</span>
            <span className="bpv-switch bpv-switch--on" style={{ background: accent }} />
          </div>

          <p className="bpv-hint">{bpv('prep_note')}</p>
          <div className="bpv-cta">
            <span className="bpv-btn bpv-btn--full" style={{ background: accent }}>{bpv('start')}</span>
          </div>
        </>
      ),
    },

    {
      id: 'session', stage: 'session', caption: bpv('cap_session'),
      body: (
        <div className="bpv-session">
          <div className="bpv-orb" style={{ borderColor: accent }}>
            <span className="bpv-orb__phase">{bpv('session_inhale')}</span>
            <span className="bpv-orb__count">4</span>
          </div>
          <div className="bpv-progress">
            <div
              className="bpv-progress__fill"
              style={{ width: `${SAMPLE_PROGRESS_PERCENT}%`, background: accent }}
            />
          </div>
          <span className="bpv-remaining">{bpv('session_elapsed', { elapsed: SAMPLE_ELAPSED })}</span>
          <div className="bpv-cta">
            <span className="bpv-btn bpv-btn--soft"><Pause size={12} /> {bpv('pause')}</span>
            <span className="bpv-ghost"><Square size={11} /> {bpv('stop')}</span>
          </div>
        </div>
      ),
    },

    {
      id: 'closing', stage: 'closing', caption: bpv('cap_closing'),
      body: (
        <>
          <h6 className="bpv-title">{bpv('closing_title')}</h6>
          <div className="bpv-stats">
            <span className="bpv-stat">
              <strong>{bpv('minutes', { count: 5 })}</strong>{bpv('closing_duration')}
            </span>
            <span className="bpv-stat">
              <strong>{SAMPLE_CYCLES}</strong>{bpv('closing_cycles')}
            </span>
          </div>

          <p className="bpv-sub">{bpv('closing_question')}</p>
          {/* Une seule teinte pour les trois réponses : un « bon » et un « mauvais »
              bouton orienteraient la réponse (MDR 2017/745). */}
          <div className="bpv-feelings">
            {['calmer', 'same', 'tenser'].map(feeling => (
              <span className="bpv-feeling" key={feeling} style={{ borderColor: accent }}>
                {t(`patient.breathing_feeling_${feeling}`)}
              </span>
            ))}
          </div>

          <div className="bpv-cta">
            <span className="bpv-ghost">{bpv('closing_skip')}</span>
          </div>
        </>
      ),
    },
  ]
}
