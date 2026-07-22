import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Eye, ChevronRight, Play, Pause, ArrowLeft } from 'lucide-react'
import { Banner } from '../../ui/Banner'
import { Chip } from '../../ui/Chip'
import { moduleQueries } from '../../../hooks/queries'
import { DEFUSION_TECHNIQUES, type DefusionTechnique } from '../../../lib/defusionTechniques'
import { DEFUSION_AFTER_COLOR } from '../../../pages/PatientPage/tabs/clinicalChartConfig'
import { DefusionScreenCard } from './DefusionScreenCard'
import './DefusionPatientView.css'

interface Props {
  /** Row `patient_modules.id` : pilote les techniques activées (aperçu config-driven). */
  patientModuleId?: string
}

type DefusionStage = 'home' | 'word_repetition' | 'linguistic_distancing' | 'history'
type StageFilter = 'all' | DefusionStage
type TFn = (key: string, opts?: Record<string, unknown>) => string

// Données d'exemple (aperçu praticien, lecture seule) — alignées sur les maquettes.
const SAMPLE_WORD = 'nul'
const SAMPLE_THOUGHT = 'Je suis nul'

const mk = (key: string) => `modules.cognitive_saturation.${key}`

// ── Fragments d'écran réutilisés ─────────────────────────────────────────────

function readerHeader(label: string): ReactNode {
  return <p className="dpv-hdr">{label}</p>
}

function sliderRow(label: string, value: number | null): ReactNode {
  return (
    <div className="dpv-mcard">
      <div className="dpv-mcard__head">
        <span className="dpv-mcard__label">{label}</span>
        {value !== null ? <span className="dpv-mcard__val">{value}</span> : null}
      </div>
      <div className="dpv-slider">
        <div className="dpv-slider__fill" style={{ width: value === null ? '0%' : `${value * 10}%`, background: DEFUSION_AFTER_COLOR }} />
        {value !== null ? <span className="dpv-slider__thumb" style={{ left: `${value * 10}%`, background: DEFUSION_AFTER_COLOR }} /> : null}
      </div>
    </div>
  )
}

function measureGrid(t: TFn, metaLabel: string, dBefore: string, dAfter: string, bBefore: string, bAfter: string): ReactNode {
  return (
    <>
      <h6 className="dpv-title">{t('patient.dpv_finish_title')}</h6>
      <p className="dpv-sub">{metaLabel}</p>
      <div className="dpv-grid">
        <div className="dpv-grid__row dpv-grid__row--head">
          <span />
          <span>{t('patient.dpv_grid_before')}</span>
          <span>{t('patient.dpv_grid_after')}</span>
        </div>
        <div className="dpv-grid__row">
          <span>{t('patient.dpv_grid_discomfort')}</span><span>{dBefore}</span><span>{dAfter}</span>
        </div>
        <div className="dpv-grid__row">
          <span>{t('patient.dpv_grid_belief')}</span><span>{bBefore}</span><span>{bAfter}</span>
        </div>
      </div>
      <p className="dpv-hint">{t('patient.dpv_finish_note')}</p>
    </>
  )
}

// ── Écrans du parcours ───────────────────────────────────────────────────────

interface ScreenDef { id: string; stage: DefusionStage; caption: string; body: ReactNode }

function buildScreens(t: TFn, enabled: DefusionTechnique[]): ScreenDef[] {
  const dpv = (k: string, opts?: Record<string, unknown>) => t(`patient.dpv_${k}`, opts)

  const home: ScreenDef = {
    id: 'home', stage: 'home', caption: dpv('cap_home'),
    body: (
      <>
        <h6 className="dpv-home-title">{t(mk('label'))}</h6>
        <p className="dpv-intro">{dpv('home_intro')}</p>
        {enabled.map((tech, i) => (
          <div key={tech} className={i === 0 ? 'dpv-tcard dpv-tcard--primary' : 'dpv-tcard'}>
            <strong className="dpv-tcard__name">{t(mk(`technique_${tech}_name`))}</strong>
            <span className="dpv-tcard__sub">{dpv(tech === 'word_repetition' ? 'home_word_sub' : 'home_dist_sub')}</span>
            {i === 0 ? <span className="dpv-btn">{dpv('start')}</span> : null}
          </div>
        ))}
        <p className="dpv-section">{dpv('home_sessions')}</p>
        <p className="dpv-empty">{dpv('home_empty')}</p>
      </>
    ),
  }

  const wordScreens: ScreenDef[] = [
    {
      id: 'word_input', stage: 'word_repetition', caption: dpv('cap_word_input'),
      body: (
        <>
          {readerHeader(dpv('hdr_word'))}
          <h6 className="dpv-title">{dpv('word_title')}</h6>
          <p className="dpv-sub">{dpv('word_hint')}</p>
          <div className="dpv-input">{SAMPLE_WORD}<span className="dpv-caret" /></div>
          <p className="dpv-hint">{dpv('privacy')}</p>
          <div className="dpv-cta"><span className="dpv-btn dpv-btn--full">{dpv('continue')}</span></div>
        </>
      ),
    },
    {
      id: 'word_before', stage: 'word_repetition', caption: dpv('cap_word_before'),
      body: (
        <>
          {readerHeader(dpv('hdr_word'))}
          <h6 className="dpv-title">{dpv('before_title')}</h6>
          {sliderRow(dpv('slider_discomfort'), 8)}
          {sliderRow(dpv('slider_belief'), 7)}
          <div className="dpv-cta">
            <span className="dpv-btn dpv-btn--full">{dpv('continue')}</span>
            <span className="dpv-ghost">{dpv('skip')}</span>
          </div>
        </>
      ),
    },
    {
      id: 'word_exercise', stage: 'word_repetition', caption: dpv('cap_word_exercise'),
      body: (
        <div className="dpv-exercise">
          {readerHeader(dpv('hdr_word'))}
          <div className="dpv-halo"><div className="dpv-halo__inner"><span className="dpv-word">{SAMPLE_WORD}</span></div></div>
          <p className="dpv-hint dpv-hint--center">{dpv('exercise_hint')}</p>
          <div className="dpv-progress"><div className="dpv-progress__fill" style={{ background: DEFUSION_AFTER_COLOR }} /></div>
          <span className="dpv-remaining">{dpv('remaining')}</span>
          <div className="dpv-cta">
            <span className="dpv-btn dpv-btn--soft"><Pause size={13} /> {dpv('pause')}</span>
            <span className="dpv-ghost">{dpv('stop')}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'word_pause', stage: 'word_repetition', caption: dpv('cap_word_pause'),
      body: (
        <div className="dpv-exercise">
          {readerHeader(dpv('hdr_word'))}
          <div className="dpv-halo dpv-halo--paused"><div className="dpv-halo__inner"><span className="dpv-word dpv-word--paused">{SAMPLE_WORD}</span></div></div>
          <span className="dpv-remaining">{dpv('paused')}</span>
          <div className="dpv-progress"><div className="dpv-progress__fill" style={{ background: DEFUSION_AFTER_COLOR }} /></div>
          <span className="dpv-remaining">{dpv('remaining')}</span>
          <div className="dpv-cta">
            <span className="dpv-btn dpv-btn--full"><Play size={13} /> {dpv('resume')}</span>
            <span className="dpv-ghost">{dpv('stop_session')}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'word_after', stage: 'word_repetition', caption: dpv('cap_word_after'),
      body: (
        <>
          {readerHeader(dpv('hdr_word'))}
          <h6 className="dpv-title">{dpv('after_title')}</h6>
          {sliderRow(dpv('slider_discomfort'), 5)}
          {sliderRow(dpv('slider_belief'), 6)}
          <div className="dpv-cta">
            <span className="dpv-btn dpv-btn--full">{dpv('finish_word')}</span>
            <span className="dpv-ghost">{dpv('skip')}</span>
          </div>
        </>
      ),
    },
    {
      id: 'word_finish', stage: 'word_repetition', caption: dpv('cap_word_finish'),
      body: (
        <>
          {readerHeader(dpv('hdr_word'))}
          {measureGrid(t, dpv('finish_word_meta'), '8', '5', '7', '6')}
          <div className="dpv-cta">
            <span className="dpv-btn dpv-btn--full">{dpv('close')}</span>
            <span className="dpv-ghost">{dpv('redo')}</span>
          </div>
        </>
      ),
    },
  ]

  const distScreens: ScreenDef[] = [
    {
      id: 'dist_input', stage: 'linguistic_distancing', caption: dpv('cap_dist_input'),
      body: (
        <>
          {readerHeader(dpv('hdr_dist'))}
          <h6 className="dpv-title">{dpv('thought_title')}</h6>
          <p className="dpv-sub">{dpv('thought_hint')}</p>
          <div className="dpv-input dpv-input--multiline">{SAMPLE_THOUGHT}<span className="dpv-caret" /></div>
          <p className="dpv-hint">{dpv('thought_privacy')}</p>
          <div className="dpv-cta"><span className="dpv-btn dpv-btn--full">{dpv('continue')}</span></div>
        </>
      ),
    },
    {
      id: 'dist_paliers', stage: 'linguistic_distancing', caption: dpv('cap_dist_paliers'),
      body: (
        <>
          {readerHeader(dpv('hdr_dist'))}
          <p className="dpv-sub">{dpv('paliers_hint')}</p>
          <div className="dpv-palier">
            <span className="dpv-palier__tag">{dpv('palier_thought_label')}</span>
            <span className="dpv-palier__text">« {SAMPLE_THOUGHT} »</span>
          </div>
          <div className="dpv-palier dpv-palier--active" style={{ borderColor: DEFUSION_AFTER_COLOR }}>
            <span className="dpv-palier__tag" style={{ color: DEFUSION_AFTER_COLOR }}>{dpv('palier_n', { n: 2 })}</span>
            <span className="dpv-palier__text">{dpv('palier_2', { thought: SAMPLE_THOUGHT })}</span>
          </div>
          <div className="dpv-palier dpv-palier--ghost">
            <span className="dpv-palier__tag">{dpv('palier_n', { n: 3 })}</span>
            <span className="dpv-palier__ghost-text">{dpv('palier_3_ghost')}</span>
          </div>
          <div className="dpv-cta"><span className="dpv-btn dpv-btn--full">{dpv('next_palier')}</span></div>
        </>
      ),
    },
    {
      id: 'dist_finish', stage: 'linguistic_distancing', caption: dpv('cap_dist_finish'),
      body: (
        <>
          {readerHeader(dpv('hdr_dist'))}
          {measureGrid(t, dpv('finish_dist_meta'), '6', '6', '8', '5')}
          <div className="dpv-cta">
            <span className="dpv-btn dpv-btn--full">{dpv('close')}</span>
            <span className="dpv-ghost">{dpv('redo')}</span>
          </div>
        </>
      ),
    },
  ]

  const history: ScreenDef = {
    id: 'history', stage: 'history', caption: dpv('cap_history'),
    body: (
      <>
        <p className="dpv-hdr dpv-hdr--nav"><ArrowLeft size={13} /> {dpv('history_title')}</p>
        <div className="dpv-hrow">
          <div className="dpv-hrow__head">
            <span className="dpv-dot" style={{ background: DEFUSION_AFTER_COLOR }} />
            <span className="dpv-hrow__name">{t(mk('technique_word_repetition_name'))}</span>
            <span className="dpv-hrow__meta">{dpv('history_meta_1')}</span>
          </div>
          <span className="dpv-hrow__measures">{dpv('history_line', { d1: 8, d2: 5, b1: 7, b2: 6 })}</span>
          <span className="dpv-chip"><Eye size={11} /> {dpv('reveal_word')}</span>
        </div>
        <div className="dpv-hrow">
          <div className="dpv-hrow__head">
            <span className="dpv-dot" style={{ background: 'var(--color-text-muted)' }} />
            <span className="dpv-hrow__name">{t(mk('technique_linguistic_distancing_name'))}</span>
            <span className="dpv-hrow__meta">{dpv('history_meta_2')}</span>
          </div>
          <span className="dpv-hrow__measures">{dpv('history_line', { d1: 6, d2: 6, b1: 8, b2: 5 })}</span>
          <span className="dpv-chip dpv-chip--revealed">« {SAMPLE_THOUGHT} » · {dpv('hide_word')}</span>
        </div>
        <div className="dpv-hrow">
          <div className="dpv-hrow__head">
            <span className="dpv-dot" style={{ background: DEFUSION_AFTER_COLOR }} />
            <span className="dpv-hrow__name">{t(mk('technique_word_repetition_name'))}</span>
            <span className="dpv-hrow__meta">{dpv('history_meta_3')}</span>
          </div>
          <span className="dpv-hrow__measures">{dpv('history_line_skipped', { d1: 7, d2: 6 })}</span>
          <span className="dpv-chip"><Eye size={11} /> {dpv('reveal_word')}</span>
        </div>
      </>
    ),
  }

  const screens = [home]
  if (enabled.includes('word_repetition')) screens.push(...wordScreens)
  if (enabled.includes('linguistic_distancing')) screens.push(...distScreens)
  screens.push(history)
  return screens
}

/**
 * « Vue patient » de « Décrocher d'une pensée » : rail horizontal des écrans du
 * parcours patient (accueil, répétition de mot, distanciation, historique),
 * numérotés et légendés, données d'exemple, lecture seule. Reflète la configuration
 * (une technique désactivée n'apparaît ni dans le rail ni dans les filtres). Aperçu
 * praticien — aucune interaction patient, aucune valeur interprétée (MDR).
 */
export function DefusionPatientView({ patientModuleId }: Props) {
  const { t } = useTranslation()
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')

  const techniquesQuery = useQuery({
    ...moduleQueries.defusionTechniques(patientModuleId ?? ''),
    enabled: patientModuleId != null,
  })
  const enabled: DefusionTechnique[] = techniquesQuery.data ?? [...DEFUSION_TECHNIQUES]

  const screens = useMemo(() => buildScreens(t, enabled), [t, enabled])

  const stageFilters = useMemo(() => {
    const filters: { value: StageFilter; label: string }[] = [
      { value: 'all', label: t('patient.dpv_filter_all') },
      { value: 'home', label: t('patient.dpv_filter_home') },
    ]
    if (enabled.includes('word_repetition')) filters.push({ value: 'word_repetition', label: t(mk('technique_word_repetition_name')) })
    if (enabled.includes('linguistic_distancing')) filters.push({ value: 'linguistic_distancing', label: t(mk('technique_linguistic_distancing_name')) })
    filters.push({ value: 'history', label: t('patient.dpv_filter_history') })
    return filters
  }, [t, enabled])

  const visible = stageFilter === 'all' ? screens : screens.filter(s => s.stage === stageFilter)

  return (
    <div className="preview-panel__inner">
      <Banner variant="info" icon={<Eye size={16} />}>{t('patient.preview_banner')}</Banner>

      <div className="dpv-filters">
        {stageFilters.map(f => (
          <Chip key={f.value} label={f.label} selectable selected={stageFilter === f.value} onClick={() => setStageFilter(f.value)} />
        ))}
      </div>

      <div className="dpv-rail">
        {visible.map((s, i) => (
          <DefusionScreenCard key={s.id} number={i + 1} caption={s.caption}>{s.body}</DefusionScreenCard>
        ))}
      </div>

      <div className="dpv-footer">
        <span>{t('patient.dpv_footer', { count: screens.length })}</span>
        <span className="dpv-footer__scroll">{t('patient.dpv_scroll')} <ChevronRight size={13} /></span>
      </div>
    </div>
  )
}
