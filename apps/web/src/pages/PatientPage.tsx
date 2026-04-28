import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
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
  type ModuleType,
  type PatientModule,
  type PsychoeducationCardEntry,
} from '../lib/database.types'
import { fetchPsychoCards, type PsychoCardInfo } from '../lib/moduleService'
import { ModulePreviewPanel } from '../components/ModulePreviewPanel'
import { fetchModuleCategories, fetchComingSoonModuleIds, type ModuleCategory, type ModuleItem } from '../lib/moduleCategories'
import './PatientPage.css'

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
  const [categories, setCategories] = useState<ModuleCategory[]>([])
  const [modules, setModules] = useState<PatientModule[]>([])
  const [loading, setLoading] = useState(true)
  const [unlockingModule, setUnlockingModule] = useState<ModuleType | null>(null)
  const [teenMode, setTeenMode] = useState(false)
  const [togglingTeen, setTogglingTeen] = useState(false)
  const [enabledModules, setEnabledModules] = useState<Set<ModuleType> | null>(null)
  const [psychoCards, setPsychoCards] = useState<PsychoCardInfo[]>([])
  const [comingSoonIds, setComingSoonIds] = useState<Set<string>>(new Set())

  const [previewModule, setPreviewModule] = useState<ModuleType | null>(null)

  const togglePreview = useCallback((type: ModuleType) => {
    setPreviewModule(prev => (prev === type ? null : type))
  }, [])

  const [psychoPickerMode, setPsychoPickerMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())
  const [savingPsycho, setSavingPsycho] = useState(false)
  const [psychoError, setPsychoError] = useState<string | null>(null)

  const [rimEditorMode, setRimEditorMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [rimAlternative, setRimAlternative] = useState('')
  const [rimOriginal, setRimOriginal] = useState('')
  const [savingRim, setSavingRim] = useState(false)
  const [rimError, setRimError] = useState<string | null>(null)

  const loadPatient = useCallback(async () => {
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

    const [{ data: mods }, { data: settings }, cats, cards, comingSoon] = await Promise.all([
      supabase.from('patient_modules').select('*').eq('patient_id', id),
      supabase
        .from('practitioner_module_settings')
        .select('enabled_modules')
        .eq('practitioner_id', practitioner.id)
        .maybeSingle(),
      fetchModuleCategories(),
      fetchPsychoCards(),
      fetchComingSoonModuleIds(),
    ])

    setModules(mods ?? [])
    setCategories(cats)
    setEnabledModules(settings ? new Set(settings.enabled_modules as ModuleType[]) : null)
    setPsychoCards(cards)
    setComingSoonIds(comingSoon)
    setLoading(false)
  }, [id, practitioner, navigate])

  useEffect(() => {
    loadPatient()
  }, [loadPatient])

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
      setSelectedCardIds(new Set(psychoCards.map(c => c.id)))
    }
    setPsychoPickerMode(mode)
  }

  const toggleCard = (cardId: string) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) { next.delete(cardId) } else { next.add(cardId) }
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

  // ── Rendu d'une carte module ─────────────────────────────────────────────

  const renderModuleCard = (modItem: ModuleItem) => {
    const moduleType = modItem.id as ModuleType
    if (comingSoonIds.has(moduleType)) {
      return (
        <div key={moduleType} className="module-card-wrapper-block">
          <Card
            state="disabled"
            header={{ title: t(`module.${moduleType}.label`), subtitle: t(`module.${moduleType}.description`) }}
            actions={<StatusBadge variant="neutral" label={t('patient.realtime_soon')} />}
          />
        </div>
      )
    }

    const mod = modules.find(m => m.module_type === moduleType)
    const unlocked = !!mod

    if (moduleType === 'psychoeducation') {
      const cards = mod ? getPsychoCards(mod) : []
      const readCount = cards.filter(c => c.is_read).length

      return (
        <div key="psychoeducation" className="module-card-wrapper module-card-wrapper-block">
          <Card
            state={unlocked ? 'active' : undefined}
            header={{ title: t('module.psychoeducation.label'), subtitle: t('module.psychoeducation.description') }}
            actions={
              <>
                <button
                  className={`preview-toggle-btn ${previewModule === 'psychoeducation' ? 'preview-toggle-btn--active' : ''}`}
                  onClick={() => togglePreview('psychoeducation')}
                  title={t('patient.patient_view')}
                >
                  {previewModule === 'psychoeducation' ? <EyeOff size={14} /> : <Eye size={14} />}
                  {t('patient.preview_button')}
                </button>
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
                      const meta = psychoCards.find(c => c.id === card.card_id)
                      return (
                        <li key={card.card_id} className="psycho-observance-item">
                          <span className="psycho-observance-item__title">
                            {meta ? t(meta.titleKey) : card.card_id}
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

          {previewModule === 'psychoeducation' && (
            <ModulePreviewPanel moduleType="psychoeducation" color={modItem.color} />
          )}

          {(psychoPickerMode === 'unlock' || psychoPickerMode === 'edit') && (
            <div className={`psycho-card-picker ${psychoPickerMode === 'edit' ? 'psycho-card-picker--edit' : ''}`}>
              <p className="psycho-card-picker__label">
                {psychoPickerMode === 'unlock'
                  ? t('patient.psycho_pick_unlock')
                  : t('patient.psycho_pick_edit')}
              </p>
              <ul className="psycho-card-picker__list">
                {psychoCards.map(card => (
                  <li key={card.id} className="psycho-card-option">
                    <label className="psycho-card-option__label">
                      <input
                        type="checkbox"
                        className="psycho-card-option__checkbox"
                        checked={selectedCardIds.has(card.id)}
                        onChange={() => toggleCard(card.id)}
                      />
                      <div>
                        <div className="psycho-card-option__title">{t(card.titleKey)}</div>
                        <div className="psycho-card-option__desc">{t(card.summaryKey)}</div>
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
            header={{ title: t('module.rim.label'), subtitle: t('module.rim.description') }}
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

    return (
      <div key={moduleType} className="module-card-wrapper-block">
        <Card
          state={unlocked ? 'active' : undefined}
          header={{ title: t(`module.${moduleType}.label`), subtitle: t(`module.${moduleType}.description`) }}
          actions={
            <>
              <button
                className={`preview-toggle-btn ${previewModule === moduleType ? 'preview-toggle-btn--active' : ''}`}
                onClick={() => togglePreview(moduleType)}
                title={t('patient.patient_view')}
              >
                {previewModule === moduleType ? <EyeOff size={14} /> : <Eye size={14} />}
                {t('patient.preview_button')}
              </button>
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

        {previewModule === moduleType && (
          <ModulePreviewPanel moduleType={moduleType} color={modItem.color} />
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
                    <StatusBadge variant="info" label={t('module.crisis_plan.label')} value={t('patient.active_badge')} />
                  )}
                  {psychoModule && (
                    <StatusBadge
                      variant={unreadPsychoCards > 0 ? 'warning' : 'info'}
                      label={t('module.psychoeducation.label')}
                      value={`${totalPsychoCards - unreadPsychoCards}/${totalPsychoCards}`}
                    />
                  )}
                  {isUnlocked('sleep_diary') && (
                    <StatusBadge variant="info" label={t('module.sleep_diary.label')} value={t('patient.active_badge')} />
                  )}
                  {modules
                    .filter(m => !['crisis_plan', 'psychoeducation', 'sleep_diary'].includes(m.module_type))
                    .map(m => (
                      <StatusBadge key={m.id} variant="info" label={t(`module.${m.module_type}.label`)} value={t('patient.active_badge')} />
                    ))}
                  <StatusBadge variant="neutral" label={t('patient.realtime_label')} value={t('patient.realtime_soon')} />
                </div>
              )}
            </section>

            <section className="therapeutic-wardrobe">
              <h2 className="wardrobe__title">{t('patient.wardrobe_title')}</h2>
              <p className="wardrobe__desc">{t('patient.wardrobe_desc')}</p>

              <div className="category-list">
                {categories.map(category => {
                  const visibleModules = enabledModules === null
                    ? category.modules
                    : category.modules.filter(m => enabledModules.has(m.id as ModuleType))
                  if (visibleModules.length === 0) return null
                  const activeCount = visibleModules.filter(m => isUnlocked(m.id as ModuleType)).length
                  return (
                    <Accordion
                      key={category.id}
                      title={t(category.labelKey)}
                      subtitle={t(category.subtitleKey)}
                      badge={activeCount > 0 ? activeCount : undefined}
                      defaultOpen={category.id === 'safety'}
                    >
                      {visibleModules.map(renderModuleCard)}
                    </Accordion>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}
