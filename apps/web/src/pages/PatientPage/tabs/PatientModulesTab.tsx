import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, Eye, EyeOff, Bell, LineChart, Plus } from 'lucide-react'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { Accordion } from '../../../components/ui/Accordion'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Modal } from '../../../components/ui/Modal'
import { CSSRSScreenPanel } from '../../../components/features/CSSRSScreenPanel'
import { ModulePreviewPanel } from '../../../components/features/ModulePreviewPanel'
import { NotificationRoutineModal } from '../../../components/features/NotificationRoutineModal/NotificationRoutineModal'
import { ModuleDataPanel } from './ModuleDataPanel'
import { type ModuleType, type PatientModule } from '../../../lib/database.types'
import { type PsychoCardInfo } from '../../../services/moduleService'
import { type ModuleCategory, type ModuleItem } from '../../../services/moduleCatalogService'
import {
  unlockModule as unlockStandardModule,
  revokeModule as revokeModuleService,
} from '../../../services/moduleAssignmentService'
import { fetchScaleMeta, type ScaleMetaRow } from '../../../services/scaleService'
import { ScaleMetaBadges } from '../../../components/features/ScaleMetaBadges/ScaleMetaBadges'
import { useRimEditor } from '../hooks/useRimEditor'
import { usePsychoEducationPicker } from '../hooks/usePsychoEducationPicker'
import { useCrisisPlanEditor } from '../hooks/useCrisisPlanEditor'
import { useMedicationEffectsEditor } from '../hooks/useMedicationEffectsEditor'
import { PatientViewProvider } from '../../../contexts/PatientViewContext'
import { MedicationSideEffectsCard } from './MedicationSideEffectsCard'

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

  const [scaleMeta, setScaleMeta] = useState<ScaleMetaRow[]>([])
  const [unlockingModule, setUnlockingModule] = useState<ModuleType | null>(null)
  const [revokingModuleId, setRevokingModuleId] = useState<string | null>(null)
  const [previewModule, setPreviewModule] = useState<ModuleType | null>(null)
  const [dataModule, setDataModule] = useState<ModuleType | null>(null)
  const [notifModal, setNotifModal] = useState<{ patientModuleId: string; moduleLabel: string; moduleIconName: string } | null>(null)
  const [showCSSRSModal, setShowCSSRSModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchScaleMeta().then(setScaleMeta)
  }, [])

  const rim = useRimEditor(modules, patientId, practitionerId, onReloadModules)
  const psycho = usePsychoEducationPicker(modules, psychoCards, patientId, practitionerId, onReloadModules)
  const crisis = useCrisisPlanEditor(patientId, modules, onReloadModules)
  const medEffects = useMedicationEffectsEditor(modules, onReloadModules)

  // Aperçu et Données sont mutuellement exclusifs : ouvrir l'un ferme l'autre.
  const togglePreview = useCallback((type: ModuleType) => {
    setPreviewModule(prev => (prev === type ? null : type))
    setDataModule(null)
  }, [])

  const toggleData = useCallback((type: ModuleType) => {
    setDataModule(prev => (prev === type ? null : type))
    setPreviewModule(null)
  }, [])

  const isUnlocked = (type: ModuleType) => modules.some(m => m.module_type === type)

  // « Activé » = déverrouillé pour ce patient, ou outil toujours disponible sans
  // verrou (scale noToggle, ex. C-SSRS). L'armoire n'affiche que ces modules ;
  // les autres (activables) vivent dans la modale « Ajouter un module ».
  const isActivated = (type: ModuleType) =>
    isUnlocked(type) || scaleMeta.find(s => s.id === type)?.noToggle === true

  const unlockModule = useCallback(async (moduleType: ModuleType) => {
    setUnlockingModule(moduleType)
    const result = await unlockStandardModule(patientId, practitionerId, moduleType)
    if (result.ok) await onReloadModules()
    setUnlockingModule(null)
  }, [patientId, practitionerId, onReloadModules])

  const revokeModule = useCallback(async (moduleId: string) => {
    setRevokingModuleId(moduleId)
    await revokeModuleService(moduleId)
    await onReloadModules()
    setRevokingModuleId(null)
  }, [onReloadModules])

  // ── Rendu d'une carte module ─────────────────────────────────────────────

  const moduleToggle = useCallback(
    (on: boolean, loading: boolean, onToggle: () => void) => (
      <button
        className="module-toggle"
        onClick={onToggle}
        disabled={loading}
        aria-label={on ? t('patient.revoke_button') : t('patient.unlock_button')}
      >
        <Toggle checked={on} />
      </button>
    ),
    [t]
  )

  const renderModuleCard = (modItem: ModuleItem) => {
    const moduleType = modItem.id as ModuleType
    const mod = modules.find(m => m.module_type === moduleType)
    const unlocked = !!mod
    const ModIcon = LUCIDE_ICONS[modItem.icon]
    const modIcon = ModIcon ? <ModIcon size={18} /> : undefined

    if (moduleType === 'psychoeducation') {
      const cards = psycho.psychoModule ? psycho.getUnlockedCards(psycho.psychoModule) : []
      const readCount = cards.filter(c => c.is_read).length

      const handlePsychoToggle = () => {
        if (unlocked && mod) { psycho.cancel(); revokeModule(mod.id) }
        else if (psycho.mode === 'unlock') psycho.cancel()
        else psycho.open('unlock')
      }

      return (
        <div key="psychoeducation" className={`module-card-wrapper module-card-wrapper-block ${psycho.mode !== 'off' || previewModule === 'psychoeducation' ? 'module-card-wrapper-block--wide' : ''}`}>
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
                {unlocked && mod && psycho.mode !== 'edit' && (
                  <Button variant="ghost" size="sm" onClick={() => psycho.open('edit')}>
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
                            ? <StatusBadge variant="success" label={t('patient.scale_read')} />
                            : <StatusBadge variant="neutral" label={t('patient.scale_unread')} />
                          }
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}
            {previewModule === 'psychoeducation' && (
              <ModulePreviewPanel moduleType="psychoeducation" color={modItem.color} />
            )}
          </Card>

          {(psycho.mode === 'unlock' || psycho.mode === 'edit') && (
            <div className={`psycho-card-picker ${psycho.mode === 'edit' ? 'psycho-card-picker--edit' : ''}`}>
              <p className="psycho-card-picker__label">
                {psycho.mode === 'unlock'
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
                        checked={psycho.selectedCardIds.has(card.id)}
                        onChange={() => psycho.toggleCard(card.id)}
                      />
                      <div>
                        <div className="psycho-card-option__title">{t(card.titleKey)}</div>
                        <div className="psycho-card-option__desc">{t(card.summaryKey)}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
              {psycho.error && <p className="psycho-card-picker__error">{psycho.error}</p>}
              <div className="psycho-card-picker__actions">
                <Button size="sm" loading={psycho.saving} onClick={psycho.confirm}>
                  {psycho.mode === 'unlock'
                    ? (psycho.selectedCardIds.size === 1
                        ? t('patient.psycho_unlock_btn', { count: psycho.selectedCardIds.size })
                        : t('patient.psycho_unlock_btn_plural', { count: psycho.selectedCardIds.size }))
                    : t('patient.psycho_save_btn')}
                </Button>
                <Button size="sm" variant="ghost" onClick={psycho.cancel}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (moduleType === 'crisis_plan') {
      const handleCrisisToggle = () => {
        if (unlocked && mod) { crisis.closeEditor(); revokeModule(mod.id) }
        else unlockModule(moduleType)
      }

      return (
        <div key="crisis_plan" className={`module-card-wrapper module-card-wrapper-block ${(crisis.open || previewModule === 'crisis_plan') && unlocked ? 'module-card-wrapper-block--wide' : ''}`}>
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.crisis_plan.label'),
              subtitle: t('modules.crisis_plan.description'),
              right: moduleToggle(unlocked, unlockingModule === moduleType, handleCrisisToggle),
            }}
            actions={unlocked && mod && !crisis.open ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`preview-toggle-btn ${previewModule === 'crisis_plan' ? 'preview-toggle-btn--active' : ''}`}
                  onClick={() => togglePreview('crisis_plan')}
                  aria-label={previewModule === 'crisis_plan' ? t('patient.hide_preview') : t('patient.show_preview')}
                >
                  {previewModule === 'crisis_plan' ? <EyeOff size={14} /> : <Eye size={14} />}
                  {previewModule === 'crisis_plan' ? t('patient.hide_preview') : t('patient.show_preview')}
                </button>
                <Button variant="ghost" size="sm" onClick={crisis.openEditor}>
                  {t('patient.crisis_configure')}
                </Button>
              </div>
            ) : undefined}
          >
            {unlocked && mod && (
              <div className="module-card__date">
                {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                {crisis.isConfigured && (
                  <span className="psycho-observance-summary"> · {t('patient.crisis_configured')}</span>
                )}
              </div>
            )}
            {previewModule === 'crisis_plan' && unlocked && (
              <ModulePreviewPanel moduleType="crisis_plan" color={modItem.color} />
            )}
          </Card>

          {crisis.open && unlocked && mod && (
            <div className="psycho-card-picker">
              <p className="psycho-card-picker__label">{t('patient.crisis_editor_title')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {t('patient.crisis_msg_label')}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t('patient.crisis_msg_placeholder')}
                    value={crisis.config.practitionerMessage}
                    onChange={e => crisis.setConfig(prev => ({ ...prev, practitionerMessage: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {t('patient.crisis_commitment_label')}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t('patient.crisis_commitment_placeholder')}
                    value={crisis.config.commitmentPhrase}
                    onChange={e => crisis.setConfig(prev => ({ ...prev, commitmentPhrase: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    {t('patient.crisis_cards_title')}
                  </p>
                  {crisis.config.copingCards.map(card => (
                    <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', borderLeft: '3px solid #4F46E5' }}>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{t('patient.crisis_card_thought_label')}</div>
                      <div style={{ fontSize: 13, color: '#111827', fontStyle: 'italic' }}>{card.thought}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{t('patient.crisis_card_response_label')}</div>
                      <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{card.response}</div>
                      <button
                        type="button"
                        onClick={() => crisis.removeCopingCard(card.id)}
                        style={{ alignSelf: 'flex-end', fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {t('patient.crisis_card_delete')}
                      </button>
                    </div>
                  ))}
                  {crisis.config.copingCards.length < 4 && (
                    crisis.cardDraft ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px dashed #4F46E5' }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                            {t('patient.crisis_card_thought_label')} <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder={t('patient.crisis_card_thought_placeholder')}
                            value={crisis.cardDraft.thought}
                            onChange={e => crisis.setCardDraft(prev => prev ? { ...prev, thought: e.target.value } : null)}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                            {t('patient.crisis_card_response_label')} <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder={t('patient.crisis_card_response_placeholder')}
                            value={crisis.cardDraft.response}
                            onChange={e => crisis.setCardDraft(prev => prev ? { ...prev, response: e.target.value } : null)}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button
                            size="sm"
                            onClick={crisis.addCopingCard}
                            disabled={!crisis.cardDraft.thought.trim() || !crisis.cardDraft.response.trim()}
                          >
                            {t('patient.crisis_card_save')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => crisis.setCardDraft(null)}>
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={crisis.addCopingCard}>
                        + {t('patient.crisis_cards_add')}
                      </Button>
                    )
                  )}
                </div>
              </div>
              <div className="psycho-card-picker__actions">
                <Button size="sm" loading={crisis.saving} onClick={crisis.saveEditor}>
                  {t('patient.crisis_btn_save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={crisis.closeEditor}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (moduleType === 'medication_side_effects') {
      return (
        <MedicationSideEffectsCard
          key="medication_side_effects"
          modItem={modItem}
          modIcon={modIcon}
          mod={mod}
          patientId={patientId}
          unlocked={unlocked}
          unlockingModule={unlockingModule}
          previewModule={previewModule}
          dataModule={dataModule}
          medEffects={medEffects}
          moduleToggle={moduleToggle}
          onTogglePreview={togglePreview}
          onToggleData={toggleData}
          onConfigureNotif={setNotifModal}
          onUnlock={unlockModule}
          onRevoke={revokeModule}
        />
      )
    }

    if (moduleType === 'rim') {
      const handleRimToggle = () => {
        if (unlocked && mod) { rim.cancel(); revokeModule(mod.id) }
        else if (rim.mode === 'unlock') rim.cancel()
        else rim.open('unlock')
      }

      return (
        <div key="rim" className={`module-card-wrapper module-card-wrapper-block ${rim.mode !== 'off' ? 'module-card-wrapper-block--wide' : ''}`}>
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.rim.label'),
              subtitle: t('modules.rim.description'),
              right: moduleToggle(unlocked, false, handleRimToggle),
            }}
            actions={unlocked && mod && rim.mode !== 'edit' ? (
              <Button variant="ghost" size="sm" onClick={() => rim.open('edit')}>
                {t('patient.rim_edit_scenario')}
              </Button>
            ) : undefined}
          >
            {unlocked && mod && (
              <div className="module-card__date">
                {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                {rim.rimModule && (rim.rimModule.config as { alternative_scenario?: string }).alternative_scenario && (
                  <span className="psycho-observance-summary"> · {t('patient.rim_scenario_configured')}</span>
                )}
              </div>
            )}
          </Card>

          {(rim.mode === 'unlock' || rim.mode === 'edit') && (
            <div className="psycho-card-picker">
              <p className="psycho-card-picker__label">
                {rim.mode === 'unlock'
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
                    value={rim.alternative}
                    onChange={e => rim.setAlternative(e.target.value)}
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
                    value={rim.original}
                    onChange={e => rim.setOriginal(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              {rim.error && <p className="psycho-card-picker__error">{rim.error}</p>}
              <div className="psycho-card-picker__actions">
                <Button size="sm" loading={rim.saving} onClick={rim.confirm}>
                  {rim.mode === 'unlock' ? t('patient.rim_btn_unlock') : t('patient.rim_btn_save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={rim.cancel}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    // Échelle clinique — ScaleMetaBadges + gestion noToggle
    const scale = scaleMeta.find(s => s.id === moduleType)
    if (scale) {
      const right = scale.noToggle
        ? (
          <button type="button" className="scales-list__view-btn" onClick={() => setShowCSSRSModal(true)}>
            <ShieldAlert size={13} />
            {t('patient.cssrs_evaluations')}
          </button>
        )
        : moduleToggle(unlocked, unlockingModule === moduleType || revokingModuleId === (mod?.id ?? ''), () => {
            if (unlocked && mod) revokeModule(mod.id)
            else unlockModule(moduleType)
          })

      return (
        <div key={moduleType} className={`module-card-wrapper-block ${previewModule === moduleType || dataModule === moduleType ? 'module-card-wrapper-block--wide' : ''}`}>
          <Card
            className={`module-card-item${unlocked ? ' module-card--unlocked' : ''}`}
            header={{ icon: modIcon, title: t(`modules.${moduleType}.label`), subtitle: t(`scales.full_title.${moduleType}`), right }}
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
                    className={`preview-toggle-btn${previewModule === moduleType ? ' preview-toggle-btn--active' : ''}`}
                    onClick={() => togglePreview(moduleType)}
                    title={t('patient.patient_view')}
                  >
                    {previewModule === moduleType ? <EyeOff size={14} /> : <Eye size={14} />}
                    {t('patient.preview_button')}
                  </button>
                )}
                {unlocked && mod && (
                  <button
                    type="button"
                    className={`preview-toggle-btn${dataModule === moduleType ? ' preview-toggle-btn--active' : ''}`}
                    onClick={() => toggleData(moduleType)}
                    title={t('patient.data_button')}
                  >
                    <LineChart size={14} />
                    {t('patient.data_button')}
                  </button>
                )}
              </>
            }
          >
            <ScaleMetaBadges
              scaleId={moduleType}
              evaluationType={scale.evaluationType}
              category={scale.category}
              targetAges={scale.targetAges}
            />
            {previewModule === moduleType && <ModulePreviewPanel moduleType={moduleType} />}
            {dataModule === moduleType && <ModuleDataPanel patientId={patientId} moduleType={moduleType} />}
          </Card>
        </div>
      )
    }

    return (
      <div key={moduleType} className={`module-card-wrapper-block ${previewModule === moduleType || dataModule === moduleType ? 'module-card-wrapper-block--wide' : ''}`}>
        <Card
          className={`module-card-item${unlocked ? ' module-card--unlocked' : ''}`}
          header={{
            icon: modIcon,
            title: t(`modules.${moduleType}.label`),
            subtitle: t(`modules.${moduleType}.description`),
            right: moduleToggle(unlocked, unlockingModule === moduleType || revokingModuleId === (mod?.id ?? ''), () => {
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
              {unlocked && mod && (
                <button
                  type="button"
                  className={`preview-toggle-btn ${dataModule === moduleType ? 'preview-toggle-btn--active' : ''}`}
                  onClick={() => toggleData(moduleType)}
                  title={t('patient.data_button')}
                >
                  <LineChart size={14} />
                  {t('patient.data_button')}
                </button>
              )}
            </>
          }
        >
          {(previewModule === moduleType || dataModule === moduleType) && (
            <>
              {previewModule === moduleType && <ModulePreviewPanel moduleType={moduleType} color={modItem.color} />}
              {dataModule === moduleType && <ModuleDataPanel patientId={patientId} moduleType={moduleType} />}
            </>
          )}
        </Card>
      </div>
    )
  }

  // Rend les catégories de modules filtrées par `includeModule`. Réutilisé par
  // l'armoire (modules activés) et la modale d'ajout (modules activables).
  const renderCategories = (includeModule: (type: ModuleType) => boolean, defaultOpen: boolean) =>
    categories.map(category => {
      const visibleModules = (enabledModules === null
        ? category.modules
        : category.modules.filter(m => enabledModules.has(m.id as ModuleType))
      ).filter(m => !comingSoonIds.has(m.id) && includeModule(m.id as ModuleType))
      if (visibleModules.length === 0) return null
      const activeCount = visibleModules.filter(m => isUnlocked(m.id as ModuleType)).length
      const CatIcon = LUCIDE_ICONS[category.icon]
      return (
        <Accordion
          key={category.id}
          title={t(category.labelKey)}
          icon={CatIcon ? <CatIcon size={16} /> : undefined}
          badge={activeCount > 0 ? activeCount : undefined}
          defaultOpen={defaultOpen}
        >
          <div className="category-modules-grid">
            {visibleModules.map(renderModuleCard)}
          </div>
        </Accordion>
      )
    })

  const hasActivatableModules = categories.some(category =>
    (enabledModules === null
      ? category.modules
      : category.modules.filter(m => enabledModules.has(m.id as ModuleType))
    ).some(m => !comingSoonIds.has(m.id) && !isActivated(m.id as ModuleType))
  )

  const activatedCategories = renderCategories(isActivated, false)
  const hasActivatedModules = activatedCategories.some(Boolean)

  return (
    <PatientViewProvider patientId={patientId}>
      <section className="therapeutic-wardrobe">
        <div className="wardrobe__header">
          <div>
            <h2 className="wardrobe__title">{t('patient.wardrobe_title')}</h2>
            <p className="wardrobe__desc">{t('patient.wardrobe_desc')}</p>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)} disabled={!hasActivatableModules}>
            <Plus size={16} />
            {t('patient.add_module_button')}
          </Button>
        </div>

        <div className="category-list">
          {hasActivatedModules
            ? activatedCategories
            : <p className="wardrobe__empty">{t('patient.wardrobe_empty')}</p>}
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
          title={t('patient.cssrs_modal_title')}
          subtitle={t('patient.cssrs_modal_subtitle')}
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

      {showAddModal && (
        <Modal
          title={t('patient.add_module_title')}
          icon={<Plus size={20} />}
          onClose={() => setShowAddModal(false)}
          maxWidth={920}
        >
          <div className="category-list">
            {renderCategories(type => !isActivated(type), true)}
          </div>
        </Modal>
      )}
    </PatientViewProvider>
  )
}
