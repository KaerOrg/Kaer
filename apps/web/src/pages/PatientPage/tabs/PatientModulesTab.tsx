import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, ClipboardList, Eye, EyeOff, Bell } from 'lucide-react'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { useToast } from '../../../contexts/ToastContext'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { Accordion } from '../../../components/ui/Accordion'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Modal } from '../../../components/ui/Modal'
import { CSSRSScreenPanel } from '../../../components/features/CSSRSScreenPanel'
import { ModulePreviewPanel } from '../../../components/features/ModulePreviewPanel'
import { NotificationRoutineModal } from '../../../components/features/NotificationRoutineModal/NotificationRoutineModal'
import {
  type ModuleType,
  type PatientModule,
  type PsychoeducationCardEntry,
} from '../../../lib/database.types'
import { CLINICAL_SCALES, AGE_BADGE_CONFIG } from '../../../data/scales'
import { type PsychoCardInfo } from '../../../services/moduleService'
import { type ModuleCategory, type ModuleItem } from '../../../services/moduleCatalogService'
import {
  unlockModule as unlockStandardModule,
  revokeModule as revokeModuleService,
  unlockPsychoeducation,
  updatePsychoeducationCards,
  unlockRim,
  updateRim,
} from '../../../services/moduleAssignmentService'

const SCALE_IDS = new Set(CLINICAL_SCALES.map(s => s.id))

function getPsychoCards(mod: PatientModule): PsychoeducationCardEntry[] {
  const config = mod.config as { unlocked_cards?: PsychoeducationCardEntry[] }
  return config?.unlocked_cards ?? []
}

type Props = {
  patientId: string
  practitionerId: string
  modules: PatientModule[]
  categories: ModuleCategory[]
  enabledModules: Set<ModuleType> | null
  psychoCards: PsychoCardInfo[]
  comingSoonIds: Set<string>
  onReloadModules: () => Promise<void>
}

export function PatientModulesTab({
  patientId,
  practitionerId,
  modules,
  categories,
  enabledModules,
  psychoCards,
  comingSoonIds,
  onReloadModules,
}: Props) {
  const { t, i18n } = useTranslation()
  const toast = useToast()

  const [unlockingModule, setUnlockingModule] = useState<ModuleType | null>(null)
  const [revokingModuleId, setRevokingModuleId] = useState<string | null>(null)
  const [previewModule, setPreviewModule] = useState<ModuleType | null>(null)

  const [psychoPickerMode, setPsychoPickerMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())
  const [savingPsycho, setSavingPsycho] = useState(false)
  const [psychoError, setPsychoError] = useState<string | null>(null)

  const [rimEditorMode, setRimEditorMode] = useState<'off' | 'unlock' | 'edit'>('off')
  const [rimAlternative, setRimAlternative] = useState('')
  const [rimOriginal, setRimOriginal] = useState('')
  const [savingRim, setSavingRim] = useState(false)
  const [rimError, setRimError] = useState<string | null>(null)

  const [notifModal, setNotifModal] = useState<{ patientModuleId: string; moduleLabel: string; moduleIconName: string } | null>(null)
  const [showCSSRSModal, setShowCSSRSModal] = useState(false)

  const togglePreview = useCallback((type: ModuleType) => {
    setPreviewModule(prev => (prev === type ? null : type))
  }, [])

  const activeScales = modules.filter(m => SCALE_IDS.has(m.module_type))
  const isUnlocked = (type: ModuleType) => modules.some(m => m.module_type === type)

  // ── Module standard ──────────────────────────────────────────────────────

  const unlockModule = async (moduleType: ModuleType) => {
    setUnlockingModule(moduleType)
    const result = await unlockStandardModule(patientId, practitionerId, moduleType)
    if (result.ok) await onReloadModules()
    setUnlockingModule(null)
  }

  const revokeModule = async (moduleId: string) => {
    await revokeModuleService(moduleId)
    await onReloadModules()
  }

  const revokeScale = async (moduleId: string) => {
    setRevokingModuleId(moduleId)
    await revokeModuleService(moduleId)
    await onReloadModules()
    setRevokingModuleId(null)
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
    if (selectedCardIds.size === 0) {
      setPsychoError(t('patient.psycho_pick_error'))
      return
    }
    setSavingPsycho(true)
    setPsychoError(null)

    if (psychoPickerMode === 'unlock') {
      const { ok } = await unlockPsychoeducation(patientId, practitionerId, selectedCardIds)
      if (!ok) {
        toast.error(t('patient.psycho_error_unlock'))
        setSavingPsycho(false)
        return
      }
    } else if (psychoPickerMode === 'edit' && psychoModule) {
      const { ok } = await updatePsychoeducationCards(
        psychoModule.id,
        getPsychoCards(psychoModule),
        selectedCardIds,
      )
      if (!ok) {
        toast.error(t('patient.psycho_error_update'))
        setSavingPsycho(false)
        return
      }
    }

    setSavingPsycho(false)
    setPsychoPickerMode('off')
    await onReloadModules()
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
    if (!rimAlternative.trim()) {
      setRimError(t('patient.rim_error_required'))
      return
    }
    setSavingRim(true)
    setRimError(null)
    const scenario = { alternative: rimAlternative.trim(), original: rimOriginal.trim() }

    if (rimEditorMode === 'unlock') {
      const { ok } = await unlockRim(patientId, practitionerId, scenario)
      if (!ok) { toast.error(t('patient.rim_error_unlock')); setSavingRim(false); return }
    } else if (rimEditorMode === 'edit' && rimModule) {
      const { ok } = await updateRim(rimModule.id, scenario)
      if (!ok) { toast.error(t('patient.rim_error_update')); setSavingRim(false); return }
    }
    setSavingRim(false)
    setRimEditorMode('off')
    await onReloadModules()
  }

  // ── Rendu d'une carte module ─────────────────────────────────────────────

  const moduleToggle = (on: boolean, loading: boolean, onToggle: () => void) => (
    <button
      className="module-toggle"
      onClick={onToggle}
      disabled={loading}
      aria-label={on ? t('patient.revoke_button') : t('patient.unlock_button')}
    >
      <Toggle checked={on} />
    </button>
  )

  const renderModuleCard = (modItem: ModuleItem) => {
    const moduleType = modItem.id as ModuleType
    const mod = modules.find(m => m.module_type === moduleType)
    const unlocked = !!mod
    const ModIcon = LUCIDE_ICONS[modItem.icon]
    const modIcon = ModIcon ? <ModIcon size={18} /> : undefined

    if (moduleType === 'psychoeducation') {
      const cards = mod ? getPsychoCards(mod) : []
      const readCount = cards.filter(c => c.is_read).length

      const handlePsychoToggle = () => {
        if (unlocked && mod) { cancelPsychoPicker(); revokeModule(mod.id) }
        else if (psychoPickerMode === 'unlock') cancelPsychoPicker()
        else openPsychoPicker('unlock')
      }

      return (
        <div key="psychoeducation" className={`module-card-wrapper module-card-wrapper-block ${psychoPickerMode !== 'off' || previewModule === 'psychoeducation' ? 'module-card-wrapper-block--wide' : ''}`}>
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.psychoeducation.label'),
              subtitle: t('modules.psychoeducation.description'),
              right: moduleToggle(unlocked, false, handlePsychoToggle),
            }}
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
                {unlocked && mod && psychoPickerMode !== 'edit' && (
                  <Button variant="ghost" size="sm" onClick={() => openPsychoPicker('edit')}>
                    {t('patient.psycho_edit_cards')}
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

      const handleRimToggle = () => {
        if (unlocked && mod) { cancelRimEditor(); revokeModule(mod.id) }
        else if (rimEditorMode === 'unlock') cancelRimEditor()
        else openRimEditor('unlock')
      }

      return (
        <div key="rim" className={`module-card-wrapper module-card-wrapper-block ${rimEditorMode !== 'off' ? 'module-card-wrapper-block--wide' : ''}`}>
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.rim.label'),
              subtitle: t('modules.rim.description'),
              right: moduleToggle(unlocked, false, handleRimToggle),
            }}
            actions={unlocked && mod && rimEditorMode !== 'edit' ? (
              <Button variant="ghost" size="sm" onClick={() => openRimEditor('edit')}>
                {t('patient.rim_edit_scenario')}
              </Button>
            ) : undefined}
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
      <div key={moduleType} className={`module-card-wrapper-block ${previewModule === moduleType ? 'module-card-wrapper-block--wide' : ''}`}>
        <Card
          className={`module-card-item${unlocked ? ' module-card--unlocked' : ''}`}
          header={{
            icon: modIcon,
            title: t(`modules.${moduleType}.label`),
            subtitle: t(`modules.${moduleType}.description`),
            right: moduleToggle(unlocked, unlockingModule === moduleType, () => {
              if (unlocked && mod) revokeModule(mod.id)
              else unlockModule(moduleType)
            }),
          }}
          actions={
            <>
              {unlocked && mod && (
                <span className="module-card__date module-card__date--actions">
                  {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                </span>
              )}
              {unlocked && mod && (
                <button
                  type="button"
                  className="module-card__notif-btn"
                  title={t('notifications.configure_button')}
                  onClick={() => setNotifModal({ patientModuleId: mod.id, moduleLabel: t(`modules.${moduleType}.label`), moduleIconName: modItem.icon })}
                >
                  <Bell size={14} />
                </button>
              )}
              <button
                className={`preview-toggle-btn ${previewModule === moduleType ? 'preview-toggle-btn--active' : ''}`}
                onClick={() => togglePreview(moduleType)}
                title={t('patient.patient_view')}
              >
                {previewModule === moduleType ? <EyeOff size={14} /> : <Eye size={14} />}
                {t('patient.preview_button')}
              </button>
            </>
          }
        />

        {previewModule === moduleType && (
          <ModulePreviewPanel moduleType={moduleType} color={modItem.color} />
        )}
      </div>
    )
  }

  const renderScalesAccordion = () => {
    const visibleScales = enabledModules === null
      ? [...CLINICAL_SCALES]
      : CLINICAL_SCALES.filter(s => enabledModules.has(s.id as ModuleType))
    const activeCount = activeScales.length

    return (
      <Accordion
        key="assessments"
        title={t('category.assessments.label')}
        icon={<ClipboardList size={16} />}
        badge={activeCount > 0 ? activeCount : undefined}
        defaultOpen={false}
      >
        <div className="category-modules-grid">
          {visibleScales.map(scale => {
            const mod = activeScales.find(m => m.module_type === scale.id)
            const unlocked = !!mod
            const loading = unlockingModule === (scale.id as ModuleType)
            const previewing = previewModule === (scale.id as ModuleType)
            const ScaleIcon = LUCIDE_ICONS[scale.icon]
            const scaleIcon = ScaleIcon ? <ScaleIcon size={18} /> : undefined

            return (
              <div
                key={scale.id}
                className={`module-card-wrapper-block ${previewing ? 'module-card-wrapper-block--wide' : ''}`}
              >
                <Card
                  className={`module-card-item${unlocked ? ' module-card--unlocked' : ''}`}
                  header={{
                    icon: scaleIcon,
                    title: scale.name,
                    subtitle: scale.fullTitle,
                    right: moduleToggle(unlocked, loading || revokingModuleId === (mod?.id ?? ''), () => {
                      if (unlocked && mod) revokeScale(mod.id)
                      else unlockModule(scale.id as ModuleType)
                    }),
                  }}
                  actions={
                    <>
                      {unlocked && mod && (
                        <span className="module-card__date module-card__date--actions">
                          {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                        </span>
                      )}
                      {scale.hasPreview && (
                        <button
                          type="button"
                          className={`preview-toggle-btn${previewing ? ' preview-toggle-btn--active' : ''}`}
                          onClick={() => togglePreview(scale.id as ModuleType)}
                          title={t('patient.patient_view')}
                        >
                          {previewing ? <EyeOff size={14} /> : <Eye size={14} />}
                          {t('patient.preview_button')}
                        </button>
                      )}
                    </>
                  }
                >
                  <p className="scale-card__desc">{scale.description}</p>
                  <div className="scale-card__meta">
                    <span className={`scale-type-badge scale-type-badge--${scale.evaluationType}`}>
                      {scale.evaluationType === 'auto' ? 'Auto' : 'Hétéro'}
                    </span>
                    <span className="scale-category-chip">{scale.category}</span>
                    {scale.targetAges.map(age => (
                      <span
                        key={age}
                        className="scale-age-chip"
                        style={{ background: AGE_BADGE_CONFIG[age].bg, color: AGE_BADGE_CONFIG[age].text }}
                      >
                        {AGE_BADGE_CONFIG[age].label}
                      </span>
                    ))}
                  </div>
                </Card>

                {previewing && (
                  <ModulePreviewPanel moduleType={scale.id as ModuleType} />
                )}
              </div>
            )
          })}

          <div className="module-card-wrapper-block">
            <Card
              className="module-card-item"
              header={{
                icon: <ShieldAlert size={18} />,
                title: 'C-SSRS — Dépistage suicidaire',
                subtitle: 'Columbia Suicide Severity Rating Scale',
                right: (
                  <button
                    type="button"
                    className="scales-list__view-btn"
                    onClick={() => setShowCSSRSModal(true)}
                  >
                    <ShieldAlert size={13} />
                    {t('patient.cssrs_evaluations')}
                  </button>
                ),
              }}
            >
              <p className="scale-card__desc">
                Évaluation structurée de l'idéation et des comportements suicidaires · Columbia University / NIMH · Version « Depuis la dernière visite ».
              </p>
              <div className="scale-card__meta">
                <span className="scale-type-badge scale-type-badge--hetero">Hétéro</span>
                <span className="scale-category-chip">Suicidalité</span>
                <span className="scale-age-chip" style={{ background: '#BBF7D0', color: '#15803D' }}>Adulte</span>
              </div>
            </Card>
          </div>
        </div>
      </Accordion>
    )
  }

  return (
    <>
      <section className="therapeutic-wardrobe">
        <h2 className="wardrobe__title">{t('patient.wardrobe_title')}</h2>
        <p className="wardrobe__desc">{t('patient.wardrobe_desc')}</p>

        <div className="category-list">
          {categories.map(category => {
            if (category.id === 'assessments') return renderScalesAccordion()
            const visibleModules = (enabledModules === null
              ? category.modules
              : category.modules.filter(m => enabledModules.has(m.id as ModuleType))
            ).filter(m => !comingSoonIds.has(m.id))
            if (visibleModules.length === 0) return null
            const activeCount = visibleModules.filter(m => isUnlocked(m.id as ModuleType)).length
            const CatIcon = LUCIDE_ICONS[category.icon]
            return (
              <Accordion
                key={category.id}
                title={t(category.labelKey)}
                icon={CatIcon ? <CatIcon size={16} /> : undefined}
                badge={activeCount > 0 ? activeCount : undefined}
                defaultOpen={false}
              >
                <div className="category-modules-grid">
                  {visibleModules.map(renderModuleCard)}
                </div>
              </Accordion>
            )
          })}
        </div>
      </section>

      {notifModal && (
        <NotificationRoutineModal
          patientModuleId={notifModal.patientModuleId}
          practitionerId={practitionerId}
          patientId={patientId}
          moduleLabel={notifModal.moduleLabel}
          moduleIconName={notifModal.moduleIconName}
          onClose={() => setNotifModal(null)}
        />
      )}

      {showCSSRSModal && (
        <Modal
          title="C-SSRS — Dépistage suicidaire"
          subtitle="Columbia Suicide Severity Rating Scale · Hétéro-évaluation praticien"
          icon={<ShieldAlert size={20} />}
          onClose={() => setShowCSSRSModal(false)}
          noPadding
          maxWidth={860}
        >
          <CSSRSScreenPanel
            patientId={patientId}
            practitionerId={practitionerId}
          />
        </Modal>
      )}
    </>
  )
}
