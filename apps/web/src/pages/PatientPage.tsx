import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
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
import { CLINICAL_SCALES } from '../data/scales'
import { CSSRSScreenPanel } from '../components/CSSRSScreenPanel'
import { fetchPsychoCards, type PsychoCardInfo } from '../services/moduleService'
import { ModulePreviewPanel } from '../components/ModulePreviewPanel'
import {
  fetchModuleCategories,
  fetchComingSoonModuleIds,
  type ModuleCategory,
  type ModuleItem,
} from '../services/moduleCatalogService'
import { fetchPatientHeader, setTeenMode as updateTeenMode } from '../services/patientService'
import {
  fetchPatientModules,
  unlockModule as unlockStandardModule,
  revokeModule as revokeModuleService,
  unlockPsychoeducation,
  updatePsychoeducationCards,
  unlockRim,
  updateRim,
} from '../services/moduleAssignmentService'
import { fetchEnabledModules } from '../services/practitionerSettingsService'
import './PatientPage.css'

const SCALE_DOMAIN_ORDER = [
  { key: 'Humeur',       label: 'Humeur & Dépression' },
  { key: 'Anxiété',      label: 'Anxiété' },
  { key: 'Neurodev',     label: 'Neurodev / TDAH' },
  { key: 'Personnalité', label: 'Personnalité' },
  { key: 'Sommeil',      label: 'Sommeil' },
  { key: 'Addictologie', label: 'Addictologie' },
  { key: 'Psychose',     label: 'Psychose' },
  { key: 'Trauma',       label: 'Trauma' },
] as const

type PageData = {
  modules: PatientModule[]
  categories: ModuleCategory[]
  enabledModules: Set<ModuleType> | null
  psychoCards: PsychoCardInfo[]
  comingSoonIds: Set<string>
}

const PAGE_DATA_INITIAL: PageData = {
  modules: [],
  categories: [],
  enabledModules: null,
  psychoCards: [],
  comingSoonIds: new Set(),
}


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
  const [pageData, setPageData] = useState<PageData>(PAGE_DATA_INITIAL)
  const { modules, categories, enabledModules, psychoCards, comingSoonIds } = pageData
  const [loading, setLoading] = useState(true)
  const [unlockingModule, setUnlockingModule] = useState<ModuleType | null>(null)
  const [revokingModuleId, setRevokingModuleId] = useState<string | null>(null)
  const [teenMode, setTeenMode] = useState(false)
  const [togglingTeen, setTogglingTeen] = useState(false)

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

    const header = await fetchPatientHeader(practitioner.id, id)
    if (!header) { navigate('/'); return }

    setPatientEmail(header.email)
    setPatientAlias(header.alias)
    setTeenMode(header.teenMode)

    const [mods, enabled, cats, cards, comingSoon] = await Promise.all([
      fetchPatientModules(id),
      fetchEnabledModules(practitioner.id),
      fetchModuleCategories(),
      fetchPsychoCards(),
      fetchComingSoonModuleIds(),
    ])

    setPageData({
      modules: mods,
      categories: cats,
      enabledModules: enabled,
      psychoCards: cards,
      comingSoonIds: comingSoon,
    })
    setLoading(false)
  }, [id, practitioner, navigate])

  useEffect(() => {
    loadPatient()
  }, [loadPatient])

  // ── Module standard ──────────────────────────────────────────────────────

  const unlockModule = async (moduleType: ModuleType) => {
    if (!id || !practitioner) return
    setUnlockingModule(moduleType)
    const result = await unlockStandardModule(id, practitioner.id, moduleType)
    if (result.ok) await loadPatient()
    setUnlockingModule(null)
  }

  const revokeModule = async (moduleId: string) => {
    await revokeModuleService(moduleId)
    await loadPatient()
  }

  const revokeScale = async (moduleId: string) => {
    setRevokingModuleId(moduleId)
    await revokeModuleService(moduleId)
    await loadPatient()
    setRevokingModuleId(null)
  }

  const isUnlocked = (type: ModuleType) => modules.some(m => m.module_type === type)

  const toggleTeenMode = async () => {
    if (!id || !practitioner) return
    setTogglingTeen(true)
    const next = !teenMode
    const { ok } = await updateTeenMode(practitioner.id, id, next)
    if (ok) setTeenMode(next)
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

    if (psychoPickerMode === 'unlock') {
      const { ok } = await unlockPsychoeducation(id, practitioner.id, selectedCardIds)
      if (!ok) {
        setPsychoError(t('patient.psycho_error_unlock'))
        setSavingPsycho(false)
        return
      }
    } else if (psychoPickerMode === 'edit' && psychoModule) {
      const { ok } = await updatePsychoeducationCards(
        psychoModule.id,
        getPsychoCards(psychoModule),
        selectedCardIds
      )
      if (!ok) {
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
    const scenario = { alternative: rimAlternative.trim(), original: rimOriginal.trim() }

    if (rimEditorMode === 'unlock') {
      const { ok } = await unlockRim(id, practitioner.id, scenario)
      if (!ok) { setRimError(t('patient.rim_error_unlock')); setSavingRim(false); return }
    } else if (rimEditorMode === 'edit' && rimModule) {
      const { ok } = await updateRim(rimModule.id, scenario)
      if (!ok) { setRimError(t('patient.rim_error_update')); setSavingRim(false); return }
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
            header={{ title: t(`modules.${moduleType}.label`), subtitle: t(`modules.${moduleType}.description`) }}
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
            header={{ title: t('modules.psychoeducation.label'), subtitle: t('modules.psychoeducation.description') }}
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
            header={{ title: t('modules.rim.label'), subtitle: t('modules.rim.description') }}
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
          header={{ title: t(`modules.${moduleType}.label`), subtitle: t(`modules.${moduleType}.description`) }}
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

  const renderScaleRow = (modId: string) => {
    const scale = CLINICAL_SCALES.find(s => s.id === modId)
    const active = modules.find(m => m.module_type === modId)
    return (
      <div key={modId} className="scale-row">
        <div className="scale-row__info">
          <span className="scale-row__name">{scale?.name ?? modId}</span>
          <span className={`scale-row__badge scale-row__badge--${scale?.evaluationType ?? 'auto'}`}>
            {scale?.evaluationType === 'hetero' ? 'Hétéro' : 'Auto'}
          </span>
          {active && (
            <span className="scale-row__date">
              depuis le {new Date(active.unlocked_at).toLocaleDateString(i18n.language)}
            </span>
          )}
        </div>
        {active ? (
          <Button
            variant="ghost"
            size="sm"
            className="module-card__revoke"
            loading={revokingModuleId === active.id}
            onClick={() => revokeScale(active.id)}
          >
            Révoquer
          </Button>
        ) : (
          <Button
            size="sm"
            loading={unlockingModule === modId}
            onClick={() => unlockModule(modId as ModuleType)}
          >
            Activer
          </Button>
        )}
      </div>
    )
  }

  const renderClinicalEvaluations = () => {
    const cat = categories.find(c => c.id === 'assessments')
    const allMods = cat
      ? (enabledModules === null ? cat.modules : cat.modules.filter(m => enabledModules.has(m.id as ModuleType)))
      : []
    const activeCount = allMods.filter(m => isUnlocked(m.id as ModuleType)).length

    const byDomain = new Map<string, string[]>()
    for (const mod of allMods) {
      const domain = CLINICAL_SCALES.find(s => s.id === mod.id)?.category ?? 'Autre'
      if (!byDomain.has(domain)) byDomain.set(domain, [])
      byDomain.get(domain)!.push(mod.id)
    }

    return (
      <Accordion
        title={t('category.assessments.label')}
        badge={activeCount > 0 ? activeCount : undefined}
        defaultOpen={false}
      >
        <div className="scale-subgroup">
          <span className="scale-subgroup__label">Risque suicidaire</span>
          <CSSRSScreenPanel patientId={id!} practitionerId={practitioner!.id} />
        </div>

        {SCALE_DOMAIN_ORDER
          .filter(d => byDomain.has(d.key))
          .map(d => (
            <div key={d.key} className="scale-subgroup">
              <span className="scale-subgroup__label">{d.label}</span>
              {byDomain.get(d.key)!.map(renderScaleRow)}
            </div>
          ))
        }
      </Accordion>
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
                    <StatusBadge variant="info" label={t('modules.crisis_plan.label')} value={t('patient.active_badge')} />
                  )}
                  {psychoModule && (
                    <StatusBadge
                      variant={unreadPsychoCards > 0 ? 'warning' : 'info'}
                      label={t('modules.psychoeducation.label')}
                      value={`${totalPsychoCards - unreadPsychoCards}/${totalPsychoCards}`}
                    />
                  )}
                  {isUnlocked('sleep_diary') && (
                    <StatusBadge variant="info" label={t('modules.sleep_diary.label')} value={t('patient.active_badge')} />
                  )}
                  {modules
                    .filter(m => !['crisis_plan', 'psychoeducation', 'sleep_diary'].includes(m.module_type))
                    .map(m => (
                      <StatusBadge key={m.id} variant="info" label={t(`modules.${m.module_type}.label`)} value={t('patient.active_badge')} />
                    ))}
                  <StatusBadge variant="neutral" label={t('patient.realtime_label')} value={t('patient.realtime_soon')} />
                </div>
              )}
            </section>

            <section className="therapeutic-wardrobe">
              <h2 className="wardrobe__title">{t('patient.wardrobe_title')}</h2>
              <p className="wardrobe__desc">{t('patient.wardrobe_desc')}</p>

              <div className="category-list">
                {categories.filter(c => c.id !== 'assessments').map(category => {
                  const visibleModules = enabledModules === null
                    ? category.modules
                    : category.modules.filter(m => enabledModules.has(m.id as ModuleType))
                  if (visibleModules.length === 0) return null
                  const activeCount = visibleModules.filter(m => isUnlocked(m.id as ModuleType)).length
                  return (
                    <Accordion
                      key={category.id}
                      title={t(category.labelKey)}
                      badge={activeCount > 0 ? activeCount : undefined}
                      defaultOpen={false}
                    >
                      {visibleModules.map(renderModuleCard)}
                    </Accordion>
                  )
                })}

                {/* ── Échelles et questionnaires ─────────────────────────── */}
                {renderClinicalEvaluations()}
              </div>
            </section>

          </>
        )}
      </div>
    </Layout>
  )
}
