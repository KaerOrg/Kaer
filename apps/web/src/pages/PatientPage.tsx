import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Eye, EyeOff, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { Accordion } from '../components/Accordion'
import { StatusBadge } from '../components/StatusBadge'
import {
  MODULE_LABELS,
  MODULE_DESCRIPTIONS,
  PSYCHO_CARD_CATALOG,
  type ModuleType,
  type PatientModule,
  type PsychoeducationCardEntry,
} from '../lib/database.types'
import {
  MODULE_PREVIEW,
  getModulePreview,
  markdownToHtml,
  type ModulePreview,
} from '../lib/modulePreviewContent'
import { CLINICAL_SCALES } from '../data/scales'
import { CSSRSScreenPanel } from '../components/CSSRSScreenPanel'
import './PatientPage.css'

const SCALE_IDS = new Set(CLINICAL_SCALES.map(s => s.id))

// ─── Structure en catégories ─────────────────────────────────────────────────

interface ModuleSubgroup {
  label: string
  modules: ModuleType[]
}

interface ModuleCategory {
  id: string
  labelKey: string
  subtitleKey: string
  modules: ModuleType[]
  subgroups?: ModuleSubgroup[]
}

const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    id: 'safety',
    labelKey: 'patient.cat_safety_label',
    subtitleKey: 'patient.cat_safety_subtitle',
    modules: ['crisis_plan', 'therapeutic_commitment', 'distress_tolerance'],
  },
  {
    id: 'iatrogenic',
    labelKey: 'patient.cat_iatrogenic_label',
    subtitleKey: 'patient.cat_iatrogenic_subtitle',
    modules: ['medication_side_effects', 'medication_adherence', 'psychoeducation'],
  },
  {
    id: 'lifestyle',
    labelKey: 'patient.cat_lifestyle_label',
    subtitleKey: 'patient.cat_lifestyle_subtitle',
    modules: ['sleep_diary', 'psyedu_sleep', 'psyedu_nutrition', 'psyedu_activity', 'diet_weight_psycho', 'chronobiology_tracker'],
  },
  {
    id: 'emotion',
    labelKey: 'patient.cat_emotion_label',
    subtitleKey: 'patient.cat_emotion_subtitle',
    modules: ['mood_tracker', 'emotion_wheel', 'behavioral_activation'],
  },
  {
    id: 'cognitive',
    labelKey: 'patient.cat_cognitive_label',
    subtitleKey: 'patient.cat_cognitive_subtitle',
    modules: ['beck_columns', 'cognitive_distortions', 'grounding', 'rim'],
  },
  {
    id: 'anxiety',
    labelKey: 'patient.cat_anxiety_label',
    subtitleKey: 'patient.cat_anxiety_subtitle',
    modules: ['fear_thermometer', 'exposure_hierarchy', 'breathing_techniques', 'cognitive_saturation'],
  },
  {
    id: 'addiction',
    labelKey: 'patient.cat_addiction_label',
    subtitleKey: 'patient.cat_addiction_subtitle',
    modules: ['craving_journal', 'decisional_balance'],
  },
]

// ─── Helpers psychoéducation ─────────────────────────────────────────────────

function getPsychoCards(mod: PatientModule): PsychoeducationCardEntry[] {
  const config = mod.config as { unlocked_cards?: PsychoeducationCardEntry[] }
  return config?.unlocked_cards ?? []
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function PatientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { practitioner } = useAuthStore()
  const { t, i18n } = useTranslation()

  const [patientEmail, setPatientEmail] = useState('')
  const [patientAlias, setPatientAlias] = useState<string | null>(null)
  const [modules, setModules] = useState<PatientModule[]>([])
  const [loading, setLoading] = useState(true)
  const [unlockingModule, setUnlockingModule] = useState<ModuleType | null>(null)
  const [revokingModuleId, setRevokingModuleId] = useState<string | null>(null)
  const [teenMode, setTeenMode] = useState(false)
  const [togglingTeen, setTogglingTeen] = useState(false)

  const [previewModule, setPreviewModule] = useState<ModuleType | null>(null)
  const [expandedPreviewCard, setExpandedPreviewCard] = useState<string | null>(null)

  const togglePreview = useCallback((type: ModuleType) => {
    setPreviewModule(prev => (prev === type ? null : type))
    setExpandedPreviewCard(null)
  }, [])

  const [psychoPickerMode, setPsychoPickerMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())
  const [savingPsycho, setSavingPsycho] = useState(false)
  const [psychoError, setPsychoError] = useState<string | null>(null)

  const [showDietSources, setShowDietSources] = useState(false)

  const [rimEditorMode, setRimEditorMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [rimAlternative, setRimAlternative] = useState('')
  const [rimOriginal, setRimOriginal] = useState('')
  const [savingRim, setSavingRim] = useState(false)
  const [rimError, setRimError] = useState<string | null>(null)

  useEffect(() => {
    loadPatient()
  }, [id])

  const loadPatient = async () => {
    if (!id || !practitioner) return
    setLoading(true)

    interface RelationRow { patient_alias: string | null; teen_mode: boolean; patients: { email: string } | { email: string }[] | null }
    const { data: relation } = await supabase
      .from('practitioner_patients')
      .select('patient_alias, teen_mode, patients(email)')
      .eq('practitioner_id', practitioner.id)
      .eq('patient_id', id)
      .single() as { data: RelationRow | null }

    if (!relation) { navigate('/'); return }

    const patient = Array.isArray(relation.patients) ? relation.patients[0] : relation.patients
    setPatientEmail((patient as { email: string } | null)?.email ?? '')
    setPatientAlias(relation.patient_alias)
    setTeenMode(relation.teen_mode ?? false)

    const { data: mods } = await supabase
      .from('patient_modules')
      .select('*')
      .eq('patient_id', id)

    setModules(mods ?? [])
    setLoading(false)
  }

  // ── Module standard ──────────────────────────────────────────────────────

  const unlockModule = async (moduleType: ModuleType) => {
    if (!id || !practitioner) return
    setUnlockingModule(moduleType)
    const insertRow: Database['public']['Tables']['patient_modules']['Insert'] = {
      patient_id: id, practitioner_id: practitioner.id, module_type: moduleType,
    }
    const { error } = await supabase.from('patient_modules').insert(insertRow)
    if (!error) await loadPatient()
    setUnlockingModule(null)
  }

  const revokeModule = async (moduleId: string) => {
    await supabase.from('patient_modules').delete().eq('id', moduleId)
    await loadPatient()
  }

  const revokeScale = async (moduleId: string) => {
    setRevokingModuleId(moduleId)
    await supabase.from('patient_modules').delete().eq('id', moduleId)
    await loadPatient()
    setRevokingModuleId(null)
  }

  const activeScales = modules.filter(m => SCALE_IDS.has(m.module_type))
  const autoScales = activeScales.filter(
    m => CLINICAL_SCALES.find(s => s.id === m.module_type)?.evaluationType === 'auto'
  )
  const heteroScales = activeScales.filter(
    m => CLINICAL_SCALES.find(s => s.id === m.module_type)?.evaluationType === 'hetero'
  )

  const isUnlocked = (type: ModuleType) => modules.some(m => m.module_type === type)

  const toggleTeenMode = async () => {
    if (!id || !practitioner) return
    setTogglingTeen(true)
    const next = !teenMode
    const { error } = await supabase
      .from('practitioner_patients')
      .update({ teen_mode: next } as never)
      .eq('practitioner_id', practitioner.id)
      .eq('patient_id', id)
    if (!error) setTeenMode(next)
    setTogglingTeen(false)
  }

  // ── Psychoéducation : sélecteur de cartes ────────────────────────────────

  const psychoModule = modules.find(m => m.module_type === 'psychoeducation')

  const openPsychoPicker = (mode: 'unlock' | 'edit') => {
    setPsychoError(null)
    if (mode === 'edit' && psychoModule) {
      setSelectedCardIds(new Set(getPsychoCards(psychoModule).map(c => c.card_id)))
    } else {
      setSelectedCardIds(new Set(PSYCHO_CARD_CATALOG.map(c => c.id)))
    }
    setPsychoPickerMode(mode)
  }

  const toggleCard = (cardId: string) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev)
      next.has(cardId) ? next.delete(cardId) : next.add(cardId)
      return next
    })
  }

  const confirmPsycho = async () => {
    if (!id || !practitioner) return
    if (selectedCardIds.size === 0) {
      setPsychoError(t('patient.psycho_pick_error'))
      return
    }

    setSavingPsycho(true)
    setPsychoError(null)
    const now = new Date().toISOString()

    if (psychoPickerMode === 'unlock') {
      const cards: PsychoeducationCardEntry[] = [...selectedCardIds].map(card_id => ({
        card_id,
        is_read: false,
        unlocked_at: now,
      }))
      const psychoInsert: Database['public']['Tables']['patient_modules']['Insert'] = {
        patient_id: id, practitioner_id: practitioner.id, module_type: 'psychoeducation',
        config: { unlocked_cards: cards } as Record<string, unknown>,
      }
      const { error } = await supabase.from('patient_modules').insert(psychoInsert)
      if (error) {
        setPsychoError(t('patient.psycho_error_unlock'))
        setSavingPsycho(false)
        return
      }
    } else if (psychoPickerMode === 'edit' && psychoModule) {
      const existingById: Record<string, PsychoeducationCardEntry> = Object.fromEntries(
        getPsychoCards(psychoModule).map(c => [c.card_id, c])
      )
      const cards: PsychoeducationCardEntry[] = [...selectedCardIds].map(card_id =>
        existingById[card_id] ?? { card_id, is_read: false, unlocked_at: now }
      )
      const psychoUpdate: Database['public']['Tables']['patient_modules']['Update'] = {
        config: { unlocked_cards: cards } as Record<string, unknown>,
      }
      const { error } = await supabase
        .from('patient_modules')
        .update(psychoUpdate)
        .eq('id', psychoModule.id)
      if (error) {
        setPsychoError(t('patient.psycho_error_update'))
        setSavingPsycho(false)
        return
      }
    }

    setSavingPsycho(false)
    setPsychoPickerMode('off')
    await loadPatient()
  }

  const cancelPsychoPicker = () => {
    setPsychoPickerMode('off')
    setPsychoError(null)
  }

  // ── RIM : éditeur de scénarios ──────────────────────────────────────────

  const rimModule = modules.find(m => m.module_type === 'rim')

  const openRimEditor = (mode: 'unlock' | 'edit') => {
    setRimError(null)
    if (mode === 'edit' && rimModule) {
      const cfg = rimModule.config as { alternative_scenario?: string; original_scenario?: string }
      setRimAlternative(cfg.alternative_scenario ?? '')
      setRimOriginal(cfg.original_scenario ?? '')
    } else {
      setRimAlternative('')
      setRimOriginal('')
    }
    setRimEditorMode(mode)
  }

  const cancelRimEditor = () => {
    setRimEditorMode('off')
    setRimError(null)
  }

  const confirmRim = async () => {
    if (!id || !practitioner) return
    if (!rimAlternative.trim()) {
      setRimError(t('patient.rim_error_required'))
      return
    }
    setSavingRim(true)
    setRimError(null)
    const alt = rimAlternative.trim()
    const orig = rimOriginal.trim()
    const rimCfg: Record<string, unknown> = { alternative_scenario: alt }
    if (orig) rimCfg['original_scenario'] = orig

    if (rimEditorMode === 'unlock') {
      const rimInsert: Database['public']['Tables']['patient_modules']['Insert'] = {
        patient_id: id, practitioner_id: practitioner.id, module_type: 'rim', config: rimCfg,
      }
      const { error } = await supabase.from('patient_modules').insert(rimInsert)
      if (error) { setRimError(t('patient.rim_error_unlock')); setSavingRim(false); return }
    } else if (rimEditorMode === 'edit' && rimModule) {
      const rimUpdate: Database['public']['Tables']['patient_modules']['Update'] = { config: rimCfg }
      const { error } = await supabase
        .from('patient_modules')
        .update(rimUpdate)
        .eq('id', rimModule.id)
      if (error) { setRimError(t('patient.rim_error_update')); setSavingRim(false); return }
    }
    setSavingRim(false)
    setRimEditorMode('off')
    await loadPatient()
  }

  // ── Radar ────────────────────────────────────────────────────────────────

  const unreadPsychoCards = psychoModule
    ? getPsychoCards(psychoModule).filter(c => !c.is_read).length
    : 0
  const totalPsychoCards = psychoModule ? getPsychoCards(psychoModule).length : 0

  // ── Rendu du panneau d'aperçu ────────────────────────────────────────────

  const renderPreviewPanel = (preview: ModulePreview) => {
    if (preview.kind === 'coming_soon') {
      return (
        <div className="preview-panel__coming-soon">
          {t('patient.coming_soon')}
        </div>
      )
    }

    if (preview.kind === 'steps') {
      return (
        <>
          <ol className="preview-steps">
            {preview.steps.map(step => (
              <li key={step.number} className="preview-step">
                <span className="preview-step__num" style={{ backgroundColor: step.color }}>{step.number}</span>
                <div>
                  <div className="preview-step__title">{step.title}</div>
                  <div className="preview-step__hint">"{step.hint}"</div>
                </div>
              </li>
            ))}
          </ol>
          {preview.footer && <p className="preview-panel__footer">{preview.footer}</p>}
        </>
      )
    }

    if (preview.kind === 'fields') {
      return (
        <>
          <ul className="preview-fields">
            {preview.fields.map(field => (
              <li key={field.label} className="preview-field">
                <span className="preview-field__icon">{field.icon}</span>
                <span className="preview-field__label">{field.label}</span>
                {field.detail && <span className="preview-field__detail">{field.detail}</span>}
              </li>
            ))}
          </ul>
          {preview.footer && (
            <div className="preview-panel__info">
              <Info size={13} className="preview-panel__info-icon" />
              <p>{preview.footer}</p>
            </div>
          )}
        </>
      )
    }

    if (preview.kind === 'grid2x2') {
      return (
        <>
          <div className="preview-grid2x2">
            {preview.quadrants.map(q => (
              <div key={q.title} className="preview-quadrant" style={{ borderTopColor: q.color }}>
                <div className="preview-quadrant__title" style={{ color: q.color }}>{q.title}</div>
                <div className="preview-quadrant__subtitle">{q.subtitle}</div>
              </div>
            ))}
          </div>
          {preview.footer && <p className="preview-panel__footer">{preview.footer}</p>}
        </>
      )
    }

    if (preview.kind === 'cards') {
      return (
        <div className="preview-cards">
          {preview.cards.map(card => (
            <div key={card.id} className="preview-card">
              <button
                className="preview-card__header"
                onClick={() => setExpandedPreviewCard(prev => prev === card.id ? null : card.id)}
              >
                <div className="preview-card__meta">
                  <span className="preview-card__title">{card.title}</span>
                  <span className="preview-card__summary">{card.summary}</span>
                </div>
                <span className="preview-card__toggle">
                  {expandedPreviewCard === card.id ? '▲' : '▼'}
                </span>
              </button>
              {expandedPreviewCard === card.id && (
                <div
                  className="preview-card__body"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(card.content) }}
                />
              )}
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  // ── Rendu d'une carte module ─────────────────────────────────────────────

  const renderModuleCard = (moduleType: ModuleType) => {
    const mod = modules.find(m => m.module_type === moduleType)
    const unlocked = !!mod

    if (moduleType === 'psychoeducation') {
      const cards = mod ? getPsychoCards(mod) : []
      const readCount = cards.filter(c => c.is_read).length

      return (
        <div key="psychoeducation" className="module-card-wrapper module-card-wrapper-block">
          <Card
            state={unlocked ? 'active' : undefined}
            header={{ title: MODULE_LABELS['psychoeducation'], subtitle: MODULE_DESCRIPTIONS['psychoeducation'] }}
            actions={
              <>
                {MODULE_PREVIEW['psychoeducation'] && (
                  <button
                    className={`preview-toggle-btn ${previewModule === 'psychoeducation' ? 'preview-toggle-btn--active' : ''}`}
                    onClick={() => togglePreview('psychoeducation')}
                    title={t('patient.patient_view')}
                  >
                    {previewModule === 'psychoeducation' ? <EyeOff size={14} /> : <Eye size={14} />}
                    {t('patient.preview_button')}
                  </button>
                )}
                {unlocked && mod ? (
                  <>
                    <StatusBadge variant="success" label={t('patient.active_badge')} />
                    {psychoPickerMode !== 'edit' && (
                      <Button variant="ghost" size="sm" onClick={() => openPsychoPicker('edit')}>
                        {t('patient.psycho_edit_cards')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="module-card__revoke"
                      onClick={() => { cancelPsychoPicker(); revokeModule(mod.id) }}
                    >
                      {t('patient.revoke_button')}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      psychoPickerMode === 'unlock' ? cancelPsychoPicker() : openPsychoPicker('unlock')
                    }
                  >
                    {psychoPickerMode === 'unlock' ? t('common.cancel') : t('patient.unlock_button')}
                  </Button>
                )}
              </>
            }
          >
            {unlocked && mod && (
              <>
                <div className="module-card__date">
                  {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                  {' · '}
                  <span className="psycho-observance-summary">
                    {cards.length === 1
                      ? t('patient.psycho_read_count', { read: readCount, total: cards.length })
                      : t('patient.psycho_read_count_plural', { read: readCount, total: cards.length })}
                  </span>
                </div>
                {cards.length > 0 && (
                  <ul className="psycho-observance-list">
                    {cards.map(card => {
                      const meta = PSYCHO_CARD_CATALOG.find(c => c.id === card.card_id)
                      return (
                        <li key={card.card_id} className="psycho-observance-item">
                          <span className="psycho-observance-item__title">
                            {meta?.title ?? card.card_id}
                          </span>
                          {card.is_read
                            ? <StatusBadge variant="success" label="Lu" />
                            : <StatusBadge variant="neutral" label="Non lu" />
                          }
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}
          </Card>

          {previewModule === 'psychoeducation' && (() => {
            const mp = getModulePreview('psychoeducation', teenMode)
            if (!mp) return null
            return (
              <div className="preview-panel" style={{ borderTopColor: mp.accentColor }}>
                <div className="preview-panel__header" style={{ color: mp.accentColor }}>
                  <Eye size={14} />
                  {t('patient.patient_view')}
                </div>
                {renderPreviewPanel(mp.preview)}
              </div>
            )
          })()}

          {(psychoPickerMode === 'unlock' || psychoPickerMode === 'edit') && (
            <div className={`psycho-card-picker ${psychoPickerMode === 'edit' ? 'psycho-card-picker--edit' : ''}`}>
              <p className="psycho-card-picker__label">
                {psychoPickerMode === 'unlock'
                  ? t('patient.psycho_pick_unlock')
                  : t('patient.psycho_pick_edit')}
              </p>
              <ul className="psycho-card-picker__list">
                {PSYCHO_CARD_CATALOG.map(card => (
                  <li key={card.id} className="psycho-card-option">
                    <label className="psycho-card-option__label">
                      <input
                        type="checkbox"
                        className="psycho-card-option__checkbox"
                        checked={selectedCardIds.has(card.id)}
                        onChange={() => toggleCard(card.id)}
                      />
                      <div>
                        <div className="psycho-card-option__title">{card.title}</div>
                        <div className="psycho-card-option__desc">{card.description}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
              {psychoError && <p className="psycho-card-picker__error">{psychoError}</p>}
              <div className="psycho-card-picker__actions">
                <Button size="sm" loading={savingPsycho} onClick={confirmPsycho}>
                  {psychoPickerMode === 'unlock'
                    ? (selectedCardIds.size === 1
                        ? t('patient.psycho_unlock_btn', { count: selectedCardIds.size })
                        : t('patient.psycho_unlock_btn_plural', { count: selectedCardIds.size }))
                    : t('patient.psycho_save_btn')}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelPsychoPicker}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (moduleType === 'rim') {
      const cfg = mod?.config as { alternative_scenario?: string; original_scenario?: string } | undefined
      return (
        <div key="rim" className="module-card-wrapper module-card-wrapper-block">
          <Card
            state={unlocked ? 'active' : undefined}
            header={{ title: MODULE_LABELS['rim'], subtitle: MODULE_DESCRIPTIONS['rim'] }}
            actions={
              <>
                {unlocked && mod ? (
                  <>
                    <StatusBadge variant="success" label={t('patient.active_badge')} />
                    {rimEditorMode !== 'edit' && (
                      <Button variant="ghost" size="sm" onClick={() => openRimEditor('edit')}>
                        {t('patient.rim_edit_scenario')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="module-card__revoke"
                      onClick={() => { cancelRimEditor(); revokeModule(mod.id) }}
                    >
                      {t('patient.revoke_button')}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      rimEditorMode === 'unlock' ? cancelRimEditor() : openRimEditor('unlock')
                    }
                  >
                    {rimEditorMode === 'unlock' ? t('common.cancel') : t('patient.unlock_button')}
                  </Button>
                )}
              </>
            }
          >
            {unlocked && mod && (
              <div className="module-card__date">
                {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                {cfg?.alternative_scenario && (
                  <span className="psycho-observance-summary"> · {t('patient.rim_scenario_configured')}</span>
                )}
              </div>
            )}
          </Card>

          {(rimEditorMode === 'unlock' || rimEditorMode === 'edit') && (
            <div className="psycho-card-picker">
              <p className="psycho-card-picker__label">
                {rimEditorMode === 'unlock'
                  ? t('patient.rim_write_unlock')
                  : t('patient.rim_write_edit')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {t('patient.rim_alt_label')} <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder={t('patient.rim_alt_placeholder')}
                    value={rimAlternative}
                    onChange={e => setRimAlternative(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {t('patient.rim_orig_label')}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t('patient.rim_orig_placeholder')}
                    value={rimOriginal}
                    onChange={e => setRimOriginal(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              {rimError && <p className="psycho-card-picker__error">{rimError}</p>}
              <div className="psycho-card-picker__actions">
                <Button size="sm" loading={savingRim} onClick={confirmRim}>
                  {rimEditorMode === 'unlock' ? t('patient.rim_btn_unlock') : t('patient.rim_btn_save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelRimEditor}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    const mp = getModulePreview(moduleType, teenMode)

    const isDietWeight = moduleType === 'diet_weight_psycho'

    return (
      <div key={moduleType} className="module-card-wrapper-block">
        <Card
          state={unlocked ? 'active' : undefined}
          header={{ title: MODULE_LABELS[moduleType], subtitle: MODULE_DESCRIPTIONS[moduleType] }}
          actions={
            <>
              {mp && (
                <button
                  className={`preview-toggle-btn ${previewModule === moduleType ? 'preview-toggle-btn--active' : ''}`}
                  onClick={() => togglePreview(moduleType)}
                  title={t('patient.patient_view')}
                >
                  {previewModule === moduleType ? <EyeOff size={14} /> : <Eye size={14} />}
                  {t('patient.preview_button')}
                </button>
              )}
              {isDietWeight && (
                <div style={{ position: 'relative' }}>
                  <button
                    className={`preview-toggle-btn ${showDietSources ? 'preview-toggle-btn--active' : ''}`}
                    onClick={() => setShowDietSources(p => !p)}
                    title="Sources & références"
                  >
                    <Info size={14} />
                    Sources
                  </button>
                  {showDietSources && (
                    <div className="diet-sources-popover">
                      <p className="diet-sources-popover__title">Références bibliographiques</p>
                      <ul className="diet-sources-popover__list">
                        <li>
                          <strong>HAS (2017).</strong> Recommandations de bonne pratique — Antipsychotiques.
                          Surveillance métabolique systématique (glycémie, lipides, IMC, tour de taille).{' '}
                          <em>has-sante.fr</em>
                        </li>
                        <li>
                          <strong>ANSM.</strong> Résumés des caractéristiques du produit (RCP) — psychotropes.
                          Sections 4.4 (mises en garde) et 4.8 (effets indésirables).{' '}
                          <em>base-donnees-publique.medicaments.gouv.fr</em>
                        </li>
                        <li>
                          <strong>OMS (2013–2030).</strong> Plan d'action pour la santé mentale.
                          Recommandations sur la prise en charge des comorbidités somatiques et métaboliques.{' '}
                          <em>who.int</em>
                        </li>
                        <li>
                          <strong>De Hert M. et al. (2011).</strong> Metabolic and cardiovascular adverse effects
                          associated with antipsychotic drugs.{' '}
                          <em>Nature Reviews Endocrinology, 7(2), 114–126.</em>
                        </li>
                        <li>
                          <strong>Werneke U. et al. (2003).</strong> Options for pharmacological management of
                          obesity in patients treated with atypical antipsychotics.{' '}
                          <em>International Clinical Psychopharmacology, 18(3), 145–160.</em>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {unlocked && mod ? (
                <>
                  <StatusBadge variant="success" label={t('patient.active_badge')} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="module-card__revoke"
                    onClick={() => revokeModule(mod.id)}
                  >
                    {t('patient.revoke_button')}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  loading={unlockingModule === moduleType}
                  onClick={() => unlockModule(moduleType)}
                >
                  {t('patient.unlock_button')}
                </Button>
              )}
            </>
          }
        >
          {unlocked && mod && (
            <div className="module-card__date">
              {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
            </div>
          )}
        </Card>

        {previewModule === moduleType && mp && (
          <div className="preview-panel" style={{ borderTopColor: mp.accentColor }}>
            <div className="preview-panel__header" style={{ color: mp.accentColor }}>
              <Eye size={14} />
              {t('patient.patient_view')}
            </div>
            {renderPreviewPanel(mp.preview)}
          </div>
        )}
      </div>
    )
  }

  const renderScalesGroup = (type: 'auto' | 'hetero', extra?: ReactNode) => {
    const scales = type === 'auto' ? autoScales : heteroScales
    const label = type === 'auto' ? 'Auto-questionnaires' : 'Hétéro-questionnaires'
    const subtitle = scales.length > 0
      ? `${scales.length} questionnaire${scales.length > 1 ? 's' : ''} actif${scales.length > 1 ? 's' : ''}`
      : 'Aucun questionnaire actif pour ce patient'

    return (
      <div className={`scales-section scales-section--${type}`}>
        <div className="scales-section__header">
          <div className="scales-section__left">
            <span className="scales-section__icon">
              <BookOpen size={18} />
            </span>
            <div>
              <span className="scales-section__label">{label}</span>
              <span className="scales-section__sub">{subtitle}</span>
            </div>
          </div>
          <button className="scales-section__add-btn" onClick={() => navigate('/dispensaire')}>
            + Ajouter
          </button>
        </div>

        {scales.length > 0 && (
          <ul className="scales-section__list">
            {scales.map(mod => {
              const scale = CLINICAL_SCALES.find(s => s.id === mod.module_type)
              return (
                <li key={mod.id} className="scales-section__item">
                  <div className="scales-section__item-info">
                    <span className="scales-section__item-name">{scale?.name ?? mod.module_type}</span>
                    <span className="scales-section__item-date">
                      depuis le {new Date(mod.unlocked_at).toLocaleDateString(i18n.language)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="module-card__revoke"
                    loading={revokingModuleId === mod.id}
                    onClick={() => revokeScale(mod.id)}
                  >
                    Révoquer
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        {extra !== undefined && (
          <div className="scales-section__extra">
            {extra}
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────

  const displayName = patientAlias ?? patientEmail

  return (
    <Layout>
      <div className="patient-page">
        <button className="patient-page__back" onClick={() => navigate('/')}>
          {t('patient.back')}
        </button>

        <div className="patient-page__header">
          <div className="patient-page__avatar">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="patient-page__header-info">
            <h1 className="patient-page__name">{displayName}</h1>
            <p className="patient-page__email">{patientEmail}</p>
          </div>
          <button
            className={`teen-mode-toggle ${teenMode ? 'teen-mode-toggle--active' : ''}`}
            onClick={toggleTeenMode}
            disabled={togglingTeen}
            title={teenMode ? t('patient.teen_mode_disable') : t('patient.teen_mode_enable')}
          >
            <span className="teen-mode-toggle__icon">🎨</span>
            <span className="teen-mode-toggle__label">{t('patient.teen_mode_label')}</span>
            <span className={`teen-mode-toggle__pill ${teenMode ? 'teen-mode-toggle__pill--on' : ''}`}>
              {teenMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="patient-page__loading">{t('common.loading')}</div>
        ) : (
          <>
            <section className="radar">
              <h2 className="radar__title">
                {t('patient.dashboard_title')}
                {modules.length > 0 && (
                  <span className="radar__count">
                    {modules.length === 1
                      ? t('patient.tools_active_one', { count: modules.length })
                      : t('patient.tools_active_other', { count: modules.length })}
                  </span>
                )}
              </h2>

              {modules.length === 0 ? (
                <EmptyState description={t('patient.empty_tools')} title="" />
              ) : (
                <div className="radar__grid">
                  {isUnlocked('crisis_plan') && (
                    <StatusBadge variant="info" label={MODULE_LABELS['crisis_plan']} value={t('patient.active_badge')} />
                  )}
                  {psychoModule && (
                    <StatusBadge
                      variant={unreadPsychoCards > 0 ? 'warning' : 'info'}
                      label={MODULE_LABELS['psychoeducation']}
                      value={`${totalPsychoCards - unreadPsychoCards}/${totalPsychoCards}`}
                    />
                  )}
                  {isUnlocked('sleep_diary') && (
                    <StatusBadge variant="info" label={MODULE_LABELS['sleep_diary']} value={t('patient.active_badge')} />
                  )}
                  {modules
                    .filter(m => !['crisis_plan', 'psychoeducation', 'sleep_diary'].includes(m.module_type))
                    .map(m => (
                      <StatusBadge key={m.id} variant="info" label={MODULE_LABELS[m.module_type]} value={t('patient.active_badge')} />
                    ))}
                  <StatusBadge variant="neutral" label={t('patient.realtime_label')} value={t('patient.realtime_soon')} />
                </div>
              )}
            </section>

            <section className="therapeutic-wardrobe">
              <h2 className="wardrobe__title">{t('patient.wardrobe_title')}</h2>
              <p className="wardrobe__desc">{t('patient.wardrobe_desc')}</p>

              <div className="category-list">
                {MODULE_CATEGORIES.map(category => {
                  const activeCount = category.modules.filter(m => isUnlocked(m)).length
                  return (
                    <Accordion
                      key={category.id}
                      title={t(category.labelKey)}
                      badge={activeCount > 0 ? activeCount : undefined}
                      defaultOpen={false}
                    >
                      {category.modules.map(renderModuleCard)}
                    </Accordion>
                  )
                })}

                {/* ── Échelles et questionnaires ─────────────────────────── */}
                {renderScalesGroup('auto')}
                {renderScalesGroup('hetero', (
                  <CSSRSScreenPanel
                    patientId={id!}
                    practitionerId={practitioner!.id}
                  />
                ))}
              </div>
            </section>

          </>
        )}
      </div>
    </Layout>
  )
}
