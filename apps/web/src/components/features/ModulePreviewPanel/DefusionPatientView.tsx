import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
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

// Données d'exemple (aperçu praticien, lecture seule).
const SAMPLE_WORD = 'échec'
const SAMPLE_THOUGHT = 'Je ne vais pas y arriver'

interface ScreenDef {
  id: string
  stage: DefusionStage
  caption: string
  body: ReactNode
}

type TFn = (key: string, opts?: Record<string, unknown>) => string

const mk = (key: string) => `modules.cognitive_saturation.${key}`

function renderMiniSlider(value: number | null): ReactNode {
  return (
    <div className="dpv-slider">
      <div className="dpv-slider__fill" style={{ width: value === null ? '0%' : `${value * 10}%`, background: DEFUSION_AFTER_COLOR }} />
    </div>
  )
}

function renderMeasureGrid(t: TFn): ReactNode {
  return (
    <div className="dpv-grid">
      <div className="dpv-grid__row dpv-grid__row--head">
        <span />
        <span>{t('patient.defusion_series_before')}</span>
        <span>{t('patient.defusion_series_after')}</span>
      </div>
      <div className="dpv-grid__row">
        <span>{t('patient.defusion_chart_discomfort')}</span><span>8</span><span>5</span>
      </div>
      <div className="dpv-grid__row">
        <span>{t('patient.defusion_chart_belief')}</span><span>7</span><span>6</span>
      </div>
    </div>
  )
}

/**
 * « Vue patient » de « Décrocher d'une pensée » : rail horizontal des écrans du
 * parcours patient (accueil, répétition de mot, distanciation, historique),
 * numérotés et légendés, données d'exemple, lecture seule. Reflète la configuration
 * (une technique désactivée n'apparaît pas). Aperçu praticien — aucune interaction
 * patient, aucune valeur interprétée (MDR).
 */
export function DefusionPatientView({ patientModuleId }: Props) {
  const { t } = useTranslation()
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')

  const techniquesQuery = useQuery({
    ...moduleQueries.defusionTechniques(patientModuleId ?? ''),
    enabled: patientModuleId != null,
  })
  // Défaut = les deux techniques (aperçu standalone sans patient, ou config absente).
  const enabled: DefusionTechnique[] = techniquesQuery.data ?? [...DEFUSION_TECHNIQUES]

  const screens = useMemo<ScreenDef[]>(() => {
    const all: ScreenDef[] = [
      {
        id: 'home', stage: 'home', caption: t('patient.dpv_cap_home'),
        body: (
          <>
            <p className="dpv-intro">{t(mk('intro'))}</p>
            {enabled.map((tech, i) => (
              <div key={tech} className={i === 0 ? 'dpv-card dpv-card--primary' : 'dpv-card'}>
                <strong>{t(mk(`technique_${tech}_name`))}</strong>
                {i === 0 ? <span className="dpv-btn">{t('patient.dpv_start')}</span> : null}
              </div>
            ))}
          </>
        ),
      },
      {
        id: 'word_input', stage: 'word_repetition', caption: t('patient.dpv_cap_word_input'),
        body: (
          <>
            <h6 className="dpv-title">{t('patient.dpv_word_title')}</h6>
            <div className="dpv-input">{SAMPLE_WORD}</div>
            <p className="dpv-hint">{t('patient.dpv_privacy')}</p>
          </>
        ),
      },
      {
        id: 'word_before', stage: 'word_repetition', caption: t('patient.dpv_cap_word_before'),
        body: (
          <>
            <h6 className="dpv-title">{t('patient.dpv_before_title')}</h6>
            <span className="dpv-label">{t('patient.defusion_chart_discomfort')}</span>{renderMiniSlider(null)}
            <span className="dpv-label">{t('patient.defusion_chart_belief')}</span>{renderMiniSlider(null)}
          </>
        ),
      },
      {
        id: 'word_exercise', stage: 'word_repetition', caption: t('patient.dpv_cap_word_exercise'),
        body: (
          <div className="dpv-exercise">
            <div className="dpv-halo" style={{ background: `${DEFUSION_AFTER_COLOR}22` }}>
              <span className="dpv-word">{SAMPLE_WORD}</span>
            </div>
            <div className="dpv-progress"><div className="dpv-progress__fill" style={{ background: DEFUSION_AFTER_COLOR }} /></div>
            <span className="dpv-hint">{t('patient.dpv_remaining')}</span>
          </div>
        ),
      },
      {
        id: 'word_pause', stage: 'word_repetition', caption: t('patient.dpv_cap_word_pause'),
        body: (
          <div className="dpv-exercise">
            <div className="dpv-halo dpv-halo--paused"><span className="dpv-word dpv-word--paused">{SAMPLE_WORD}</span></div>
            <span className="dpv-hint">{t('patient.dpv_paused')}</span>
          </div>
        ),
      },
      {
        id: 'word_after', stage: 'word_repetition', caption: t('patient.dpv_cap_word_after'),
        body: (
          <>
            <h6 className="dpv-title">{t('patient.dpv_after_title')}</h6>
            <span className="dpv-label">{t('patient.defusion_chart_discomfort')}</span>{renderMiniSlider(5)}
            <span className="dpv-label">{t('patient.defusion_chart_belief')}</span>{renderMiniSlider(6)}
          </>
        ),
      },
      {
        id: 'word_finish', stage: 'word_repetition', caption: t('patient.dpv_cap_word_finish'),
        body: (
          <>
            <h6 className="dpv-title">{t(mk('finish_title'))}</h6>
            {renderMeasureGrid(t)}
            <p className="dpv-hint">{t('patient.dpv_finish_note')}</p>
          </>
        ),
      },
      {
        id: 'dist_input', stage: 'linguistic_distancing', caption: t('patient.dpv_cap_dist_input'),
        body: (
          <>
            <h6 className="dpv-title">{t('patient.dpv_thought_title')}</h6>
            <div className="dpv-input dpv-input--multiline">{SAMPLE_THOUGHT}</div>
          </>
        ),
      },
      {
        id: 'dist_paliers', stage: 'linguistic_distancing', caption: t('patient.dpv_cap_dist_paliers'),
        body: (
          <div className="dpv-paliers">
            <div className="dpv-palier dpv-palier--active" style={{ borderColor: DEFUSION_AFTER_COLOR }}>{SAMPLE_THOUGHT}</div>
            <div className="dpv-palier">{t('patient.dpv_palier_2', { thought: SAMPLE_THOUGHT })}</div>
            <div className="dpv-palier dpv-palier--ghost" />
          </div>
        ),
      },
      {
        id: 'dist_finish', stage: 'linguistic_distancing', caption: t('patient.dpv_cap_dist_finish'),
        body: (
          <>
            <h6 className="dpv-title">{t(mk('finish_title'))}</h6>
            {renderMeasureGrid(t)}
          </>
        ),
      },
      {
        id: 'history', stage: 'history', caption: t('patient.dpv_cap_history'),
        body: (
          <div className="dpv-history">
            <div className="dpv-history__row">
              <span className="dpv-dot" style={{ background: DEFUSION_AFTER_COLOR }} />
              <span>{t('patient.dpv_history_line', { d1: 8, d2: 5, b1: 7, b2: 6 })}</span>
            </div>
            <span className="dpv-chip">{t('patient.defusion_reveal_word')}</span>
          </div>
        ),
      },
    ]
    // Config : masque les écrans d'une technique désactivée.
    return all.filter(s => s.stage === 'home' || s.stage === 'history' || enabled.includes(s.stage))
  }, [t, enabled])

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
    </div>
  )
}
