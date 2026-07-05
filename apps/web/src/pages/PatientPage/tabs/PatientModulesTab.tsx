import { useState, useCallback, useMemo, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, Plus } from 'lucide-react'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ModuleCard } from '../../../components/features/ModuleCard'
import { InputField } from '../../../components/ui/InputField'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Modal } from '../../../components/ui/Modal'
import { ModuleFilterBar } from '../../../components/features/ModuleFilterBar'
import { ModuleTagChips } from '../../../components/features/ModuleTagChips'
import { moduleMatchesTagFilters } from '../../../lib/moduleFilter'
import { useTagFilters } from '../../../hooks/useTagFilters'
import { matchesAllTokens, tokenizeSearch } from '../../../lib/search'
import { CSSRSScreenPanel } from '../../../components/features/CSSRSScreenPanel'
import { ModulePreviewPanel } from '../../../components/features/ModulePreviewPanel'
import { NotificationRoutineModal } from '../../../components/features/NotificationRoutineModal/NotificationRoutineModal'
import { ModuleDataPanel } from './ModuleDataPanel'
import { ModuleCardFooter } from './ModuleCardFooter'
import { type ModuleType, type PatientModule } from '../../../lib/database.types'
import { type LibraryTopic, type PsyEduTheme } from '@services/psyeduService'
import { type ModuleCategory, type ModuleItem } from '@services/moduleCatalogService'
import {
  unlockModule as unlockStandardModule,
  revokeModule as revokeModuleService,
} from '@services/moduleAssignmentService'
import { scaleQueries } from '../../../hooks/queries'
import { ScaleMetaBadges } from '../../../components/features/ScaleMetaBadges/ScaleMetaBadges'
import { useRimEditor } from '../hooks/useRimEditor'
import { usePsychoEducationPicker } from '../hooks/usePsychoEducationPicker'
import { useCrisisPlanEditor } from '../hooks/useCrisisPlanEditor'
import { useMedicationEffectsEditor } from '../hooks/useMedicationEffectsEditor'
import { useMedicationListEditor } from '../hooks/useMedicationListEditor'
import { PatientViewProvider } from '../../../contexts/PatientViewContext'
import { MedicationSideEffectsCard } from './MedicationSideEffectsCard'
import { ChronobiologyCard } from './ChronobiologyCard'
import { PsychoLibraryPicker } from './PsychoLibraryPicker'
import { MedicationAdherenceCard } from './MedicationAdherenceCard'

// La barre de filtres de la vue active n'apparaît qu'au-delà de ce nombre de
// modules actifs — en dessous, la liste est assez courte pour se passer de filtre.
const ACTIVE_FILTER_THRESHOLD = 8

// Alignement à droite du bouton « supprimer » d'une coping card (positionnement
// de layout uniquement — l'habillage du bouton vient du design system).
const CRISIS_CARD_DELETE_STYLE: CSSProperties = { alignSelf: 'flex-end' }

type Props = {
  patientId: string
  practitionerId: string
  modules: PatientModule[]
  categories: ModuleCategory[]
  enabledModules: Set<ModuleType> | null
  libraryTopics: LibraryTopic[]
  themes: PsyEduTheme[]
  comingSoonIds: Set<string>
  onReloadModules: () => Promise<void>
}

export function PatientModulesTab({
  patientId,
  practitionerId,
  modules,
  categories,
  enabledModules,
  libraryTopics,
  themes,
  comingSoonIds,
  onReloadModules,
}: Props) {
  const { t, i18n } = useTranslation()

  const { data: scaleMeta = [] } = useQuery(scaleQueries.meta())
  // Opération de bascule en cours — une seule à la fois. `unlock` cible un type de
  // module (la row n'existe pas encore), `revoke` une row déjà déverrouillée. Un
  // state unique discriminé plutôt que deux states couplés (unlocking + revoking).
  const [busyModule, setBusyModule] = useState<
    { op: 'unlock'; type: ModuleType } | { op: 'revoke'; id: string } | null
  >(null)
  // Panneau ouvert sous une carte — aperçu OU données, jamais les deux. L'exclusivité
  // est portée structurellement par ce state unique, plus par deux states à remettre
  // à null en miroir à chaque bascule.
  const [activePanel, setActivePanel] = useState<
    { kind: 'preview' | 'data'; module: ModuleType } | null
  >(null)
  const [notifModal, setNotifModal] = useState<{ patientModuleId: string; moduleLabel: string; moduleIconName: string } | null>(null)
  const [showCSSRSModal, setShowCSSRSModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { taxonomy, activeFilters, toggleTag, resetFilters } = useTagFilters()

  const closeAddModal = useCallback(() => {
    setShowAddModal(false)
    setSearchQuery('')
  }, [])

  // Puces de tags (indication + public) d'un module — réutilisé par toutes les cartes.
  const tagChips = useCallback(
    (type: ModuleType) => <ModuleTagChips tagIds={taxonomy.tagsByModule.get(type)} taxonomy={taxonomy} />,
    [taxonomy],
  )

  const rim = useRimEditor(modules, patientId, practitionerId, onReloadModules)
  const allTopicIds = useMemo(() => libraryTopics.map(topic => topic.id), [libraryTopics])
  const psycho = usePsychoEducationPicker(modules, allTopicIds, patientId, practitionerId, onReloadModules)
  const crisis = useCrisisPlanEditor(patientId, modules, onReloadModules)
  const medEffects = useMedicationEffectsEditor(modules, onReloadModules)
  const medList = useMedicationListEditor(modules, onReloadModules)

  // Lecture du panneau actif — l'exclusivité aperçu/données vit dans `activePanel`.
  const isPreviewOpen = useCallback(
    (type: ModuleType) => activePanel?.kind === 'preview' && activePanel.module === type,
    [activePanel],
  )
  const isDataOpen = useCallback(
    (type: ModuleType) => activePanel?.kind === 'data' && activePanel.module === type,
    [activePanel],
  )
  // Carte occupée : déverrouillage de ce type, ou révocation de cette row.
  const isModuleBusy = useCallback(
    (type: ModuleType, modId: string | undefined) =>
      (busyModule?.op === 'unlock' && busyModule.type === type) ||
      (busyModule?.op === 'revoke' && busyModule.id === modId),
    [busyModule],
  )

  // Aperçu et Données sont mutuellement exclusifs : ouvrir l'un ferme l'autre.
  const togglePreview = useCallback((type: ModuleType) => {
    setActivePanel(prev =>
      prev?.kind === 'preview' && prev.module === type ? null : { kind: 'preview', module: type },
    )
  }, [])

  const toggleData = useCallback((type: ModuleType) => {
    setActivePanel(prev =>
      prev?.kind === 'data' && prev.module === type ? null : { kind: 'data', module: type },
    )
  }, [])

  const isUnlocked = (type: ModuleType) => modules.some(m => m.module_type === type)

  // « Activé » = déverrouillé pour ce patient, ou outil toujours disponible sans
  // verrou (scale noToggle, ex. C-SSRS). L'armoire n'affiche que ces modules ;
  // les autres (activables) vivent dans la modale « Ajouter un module ».
  const isActivated = (type: ModuleType) =>
    isUnlocked(type) || scaleMeta.find(s => s.id === type)?.noToggle === true

  const unlockModule = useCallback(async (moduleType: ModuleType) => {
    setBusyModule({ op: 'unlock', type: moduleType })
    const result = await unlockStandardModule(patientId, practitionerId, moduleType)
    if (result.ok) await onReloadModules()
    setBusyModule(null)
  }, [patientId, practitionerId, onReloadModules])

  const revokeModule = useCallback(async (moduleId: string) => {
    setBusyModule({ op: 'revoke', id: moduleId })
    await revokeModuleService(moduleId)
    await onReloadModules()
    setBusyModule(null)
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
      const topics = psycho.psychoModule ? psycho.getUnlockedTopics(psycho.psychoModule) : []
      const readCount = topics.filter(tpc => tpc.is_read).length

      const handlePsychoToggle = () => {
        if (unlocked && mod) { psycho.cancel(); revokeModule(mod.id) }
        else if (psycho.mode === 'unlock') psycho.cancel()
        else psycho.open('unlock')
      }

      return (
        <div key="psychoeducation" className={`module-card-wrapper module-card-wrapper-block ${psycho.mode !== 'off' || isPreviewOpen('psychoeducation') ? 'module-card-wrapper-block--wide' : ''}`}>
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.psychoeducation.label'),
              right: moduleToggle(unlocked, false, handlePsychoToggle),
            }}
            footer={tagChips('psychoeducation')}
            actions={
              <ModuleCardFooter
                previewOpen={isPreviewOpen('psychoeducation')}
                onTogglePreview={() => togglePreview('psychoeducation')}
                extra={unlocked && mod && psycho.mode !== 'edit' ? (
                  <Button variant="ghost" size="sm" onClick={() => psycho.open('edit')}>
                    {t('patient.psycho_edit_cards')}
                  </Button>
                ) : undefined}
              />
            }
          >
            <p className="module-card__description">{t('modules.psychoeducation.description')}</p>
            {unlocked && mod && (
              <>
                <div className="module-card__date">
                  {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                  {' · '}
                  <span className="psycho-observance-summary">
                    {topics.length === 1
                      ? t('patient.psycho_read_count', { read: readCount, total: topics.length })
                      : t('patient.psycho_read_count_plural', { read: readCount, total: topics.length })}
                  </span>
                </div>
                {topics.length > 0 && (
                  <ul className="psycho-observance-list">
                    {topics.map(topic => {
                      const meta = libraryTopics.find(lt => lt.id === topic.topic_id)
                      return (
                        <li key={topic.topic_id} className="psycho-observance-item">
                          <span className="psycho-observance-item__title">
                            {meta ? t(meta.titleKey, { ns: 'psyedu' }) : topic.topic_id}
                          </span>
                          {topic.is_read
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
            {isPreviewOpen('psychoeducation') && (
              <ModulePreviewPanel moduleType="psychoeducation" color={modItem.color} />
            )}
          </Card>

          {(psycho.mode === 'unlock' || psycho.mode === 'edit') && (
            <PsychoLibraryPicker
              mode={psycho.mode}
              libraryTopics={libraryTopics}
              themes={themes}
              taxonomy={taxonomy}
              selectedTopicIds={psycho.selectedTopicIds}
              saving={psycho.saving}
              error={psycho.error}
              onToggle={psycho.toggleTopic}
              onConfirm={psycho.confirm}
              onCancel={psycho.cancel}
            />
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
        <div key="crisis_plan" className={`module-card-wrapper module-card-wrapper-block ${(crisis.open || isPreviewOpen('crisis_plan')) && unlocked ? 'module-card-wrapper-block--wide' : ''}`}>
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.crisis_plan.label'),
              right: moduleToggle(unlocked, isModuleBusy(moduleType, mod?.id), handleCrisisToggle),
            }}
            footer={tagChips('crisis_plan')}
            actions={unlocked && mod && !crisis.open ? (
              <ModuleCardFooter
                configLabel={t('patient.crisis_configure')}
                onConfigure={crisis.openEditor}
                previewOpen={isPreviewOpen('crisis_plan')}
                onTogglePreview={() => togglePreview('crisis_plan')}
              />
            ) : undefined}
          >
            <p className="module-card__description">{t('modules.crisis_plan.description')}</p>
            {unlocked && mod && (
              <div className="module-card__date">
                {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                {crisis.isConfigured && (
                  <span className="psycho-observance-summary"> · {t('patient.crisis_configured')}</span>
                )}
              </div>
            )}
            {isPreviewOpen('crisis_plan') && unlocked && (
              <ModulePreviewPanel moduleType="crisis_plan" color={modItem.color} />
            )}
          </Card>

          {crisis.open && unlocked && mod && (
            <div className="psycho-card-picker">
              <p className="psycho-card-picker__label">{t('patient.crisis_editor_title')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <InputField
                  label={t('patient.crisis_msg_label')}
                  multiline
                  rows={3}
                  placeholder={t('patient.crisis_msg_placeholder')}
                  value={crisis.config.practitionerMessage}
                  onChange={e => crisis.setConfig(prev => ({ ...prev, practitionerMessage: e.target.value }))}
                />
                <InputField
                  label={t('patient.crisis_commitment_label')}
                  multiline
                  rows={3}
                  placeholder={t('patient.crisis_commitment_placeholder')}
                  value={crisis.config.commitmentPhrase}
                  onChange={e => crisis.setConfig(prev => ({ ...prev, commitmentPhrase: e.target.value }))}
                />
                <div>
                  <p className="crisis-cards-title">
                    {t('patient.crisis_cards_title')}
                  </p>
                  {crisis.config.copingCards.map(card => (
                    <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', borderLeft: '3px solid #4F46E5' }}>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{t('patient.crisis_card_thought_label')}</div>
                      <div style={{ fontSize: 13, color: '#111827', fontStyle: 'italic' }}>{card.thought}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{t('patient.crisis_card_response_label')}</div>
                      <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{card.response}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        category="danger"
                        size="xs"
                        onClick={() => crisis.removeCopingCard(card.id)}
                        style={CRISIS_CARD_DELETE_STYLE}
                      >
                        {t('patient.crisis_card_delete')}
                      </Button>
                    </div>
                  ))}
                  {crisis.config.copingCards.length < 4 && (
                    crisis.cardDraft ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px dashed #4F46E5' }}>
                        <InputField
                          label={t('patient.crisis_card_thought_label')}
                          multiline
                          required
                          rows={2}
                          placeholder={t('patient.crisis_card_thought_placeholder')}
                          value={crisis.cardDraft.thought}
                          onChange={e => crisis.setCardDraft(prev => prev ? { ...prev, thought: e.target.value } : null)}
                        />
                        <InputField
                          label={t('patient.crisis_card_response_label')}
                          multiline
                          required
                          rows={2}
                          placeholder={t('patient.crisis_card_response_placeholder')}
                          value={crisis.cardDraft.response}
                          onChange={e => crisis.setCardDraft(prev => prev ? { ...prev, response: e.target.value } : null)}
                        />
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
          tagChips={tagChips('medication_side_effects')}
          modItem={modItem}
          modIcon={modIcon}
          mod={mod}
          patientId={patientId}
          unlocked={unlocked}
          loading={isModuleBusy('medication_side_effects', mod?.id)}
          previewOpen={isPreviewOpen('medication_side_effects')}
          dataOpen={isDataOpen('medication_side_effects')}
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

    if (moduleType === 'medication_adherence') {
      return (
        <MedicationAdherenceCard
          key="medication_adherence"
          tagChips={tagChips('medication_adherence')}
          modItem={modItem}
          modIcon={modIcon}
          mod={mod}
          patientId={patientId}
          unlocked={unlocked}
          loading={isModuleBusy('medication_adherence', mod?.id)}
          previewOpen={isPreviewOpen('medication_adherence')}
          dataOpen={isDataOpen('medication_adherence')}
          medList={medList}
          moduleToggle={moduleToggle}
          onTogglePreview={togglePreview}
          onToggleData={toggleData}
          onConfigureNotif={setNotifModal}
          onUnlock={unlockModule}
          onRevoke={revokeModule}
        />
      )
    }

    if (moduleType === 'chronobiology_tracker') {
      return (
        <ChronobiologyCard
          key="chronobiology_tracker"
          tagChips={tagChips('chronobiology_tracker')}
          modItem={modItem}
          modIcon={modIcon}
          mod={mod}
          patientId={patientId}
          unlocked={unlocked}
          loading={isModuleBusy('chronobiology_tracker', mod?.id)}
          previewOpen={isPreviewOpen('chronobiology_tracker')}
          dataOpen={isDataOpen('chronobiology_tracker')}
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
              right: moduleToggle(unlocked, false, handleRimToggle),
            }}
            footer={tagChips('rim')}
            actions={unlocked && mod && rim.mode !== 'edit' ? (
              <Button variant="ghost" size="sm" onClick={() => rim.open('edit')}>
                {t('patient.rim_edit_scenario')}
              </Button>
            ) : undefined}
          >
            <p className="module-card__description">{t('modules.rim.description')}</p>
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
                <InputField
                  label={t('patient.rim_alt_label')}
                  multiline
                  required
                  rows={5}
                  placeholder={t('patient.rim_alt_placeholder')}
                  value={rim.alternative}
                  onChange={e => rim.setAlternative(e.target.value)}
                />
                <InputField
                  label={t('patient.rim_orig_label')}
                  multiline
                  rows={3}
                  placeholder={t('patient.rim_orig_placeholder')}
                  value={rim.original}
                  onChange={e => rim.setOriginal(e.target.value)}
                />
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
        : moduleToggle(unlocked, isModuleBusy(moduleType, mod?.id), () => {
            if (unlocked && mod) revokeModule(mod.id)
            else unlockModule(moduleType)
          })

      return (
        <div key={moduleType} className={`module-card-wrapper-block ${isPreviewOpen(moduleType) || isDataOpen(moduleType) ? 'module-card-wrapper-block--wide' : ''}`}>
          <ModuleCard
            className={unlocked ? 'module-card--unlocked' : undefined}
            icon={modIcon}
            title={t(`modules.${moduleType}.label`)}
            headerRight={right}
            description={t(`scales.full_title.${moduleType}`)}
            tags={
              <ScaleMetaBadges
                scaleId={moduleType}
                evaluationType={scale.evaluationType}
                category={scale.category}
                targetAges={scale.targetAges}
              />
            }
            actions={
              <ModuleCardFooter
                previewOpen={isPreviewOpen(moduleType)}
                onTogglePreview={scale.hasPreview ? () => togglePreview(moduleType) : undefined}
                dataOpen={isDataOpen(moduleType)}
                onToggleData={unlocked && mod ? () => toggleData(moduleType) : undefined}
              />
            }
          >
            {unlocked && mod && (
              <div className="module-card__date">
                {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
              </div>
            )}
            {isPreviewOpen(moduleType) && <ModulePreviewPanel moduleType={moduleType} />}
            {isDataOpen(moduleType) && <ModuleDataPanel patientId={patientId} moduleType={moduleType} />}
          </ModuleCard>
        </div>
      )
    }

    return (
      <div key={moduleType} className={`module-card-wrapper-block ${isPreviewOpen(moduleType) || isDataOpen(moduleType) ? 'module-card-wrapper-block--wide' : ''}`}>
        <ModuleCard
          className={unlocked ? 'module-card--unlocked' : undefined}
          icon={modIcon}
          title={t(`modules.${moduleType}.label`)}
          headerRight={moduleToggle(unlocked, isModuleBusy(moduleType, mod?.id), () => {
            if (unlocked && mod) revokeModule(mod.id)
            else unlockModule(moduleType)
          })}
          description={t(`modules.${moduleType}.description`)}
          tags={tagChips(moduleType)}
          actions={
            <ModuleCardFooter
              onConfigureNotif={unlocked && mod ? () => setNotifModal({ patientModuleId: mod.id, moduleLabel: t(`modules.${moduleType}.label`), moduleIconName: modItem.icon }) : undefined}
              previewOpen={isPreviewOpen(moduleType)}
              onTogglePreview={() => togglePreview(moduleType)}
              dataOpen={isDataOpen(moduleType)}
              onToggleData={unlocked && mod ? () => toggleData(moduleType) : undefined}
            />
          }
        >
          {unlocked && mod && (
            <div className="module-card__date">
              {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
            </div>
          )}
          {isPreviewOpen(moduleType) && <ModulePreviewPanel moduleType={moduleType} color={modItem.color} />}
          {isDataOpen(moduleType) && <ModuleDataPanel patientId={patientId} moduleType={moduleType} />}
        </ModuleCard>
      </div>
    )
  }

  // Aplati les modules de toutes les catégories filtrés par `includeModule`, en
  // respectant l'activation praticien et l'exclusion « bientôt ». L'ordre suit
  // celui des catégories puis des modules (tri métier du seed).
  const collectModules = useCallback(
    (includeModule: (type: ModuleType) => boolean): ModuleItem[] => {
      const out: ModuleItem[] = []
      for (const category of categories) {
        const base = enabledModules === null
          ? category.modules
          : category.modules.filter(m => enabledModules.has(m.id as ModuleType))
        for (const m of base) {
          if (!comingSoonIds.has(m.id) && includeModule(m.id as ModuleType)) out.push(m)
        }
      }
      return out
    },
    [categories, enabledModules, comingSoonIds],
  )

  const activatedModules = collectModules(isActivated)
  const activatableModules = collectModules(type => !isActivated(type))
  const hasActivatableModules = activatableModules.length > 0

  // Lentille clinique partagée : les filtres de tags s'appliquent à la fois aux
  // modules actifs et (avec la recherche) aux modules à ajouter.
  const visibleActivatedModules = activatedModules.filter(m =>
    moduleMatchesTagFilters(taxonomy.tagsByModule.get(m.id), activeFilters),
  )

  // La barre n'apparaît qu'au-delà du seuil ; en dessous, on affiche tout (pas de
  // filtrage masqué sans contrôle visible).
  const showActiveFilterBar = taxonomy.dimensions.length > 0 && activatedModules.length >= ACTIVE_FILTER_THRESHOLD
  const displayedActivatedModules = showActiveFilterBar ? visibleActivatedModules : activatedModules

  // Modale d'ajout : modules activables filtrés par facettes (tags) puis recherche.
  const searchTokens = tokenizeSearch(searchQuery)
  const candidateModules = activatableModules.filter(m =>
    moduleMatchesTagFilters(taxonomy.tagsByModule.get(m.id), activeFilters) &&
    (searchTokens.length === 0 ||
      matchesAllTokens(`${t(`modules.${m.id}.label`)} ${t(`modules.${m.id}.description`)}`, searchTokens)),
  )

  const addModuleSearch = useMemo(
    () => ({ value: searchQuery, onChange: setSearchQuery, placeholder: t('modules.search_placeholder') }),
    [searchQuery, t],
  )

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

        {activatedModules.length === 0 ? (
          <p className="wardrobe__empty">{t('patient.wardrobe_empty')}</p>
        ) : (
          <div className="wardrobe__active">
            {showActiveFilterBar && (
              <ModuleFilterBar
                taxonomy={taxonomy}
                activeFilters={activeFilters}
                onToggleTag={toggleTag}
                onReset={resetFilters}
                resultCount={visibleActivatedModules.length}
                totalCount={activatedModules.length}
              />
            )}
            {displayedActivatedModules.length > 0 ? (
              <div className="category-modules-grid">
                {displayedActivatedModules.map(renderModuleCard)}
              </div>
            ) : (
              <p className="wardrobe__empty">{t('modules.empty_filter')}</p>
            )}
          </div>
        )}
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
          onClose={closeAddModal}
          maxWidth={920}
        >
          <div className="wardrobe__add">
            {taxonomy.dimensions.length > 0 && (
              <ModuleFilterBar
                taxonomy={taxonomy}
                activeFilters={activeFilters}
                onToggleTag={toggleTag}
                onReset={resetFilters}
                resultCount={candidateModules.length}
                totalCount={activatableModules.length}
                search={addModuleSearch}
              />
            )}
            {candidateModules.length > 0 ? (
              <div className="category-modules-grid">
                {candidateModules.map(renderModuleCard)}
              </div>
            ) : (
              <p className="wardrobe__empty">{t('modules.empty_filter')}</p>
            )}
          </div>
        </Modal>
      )}
    </PatientViewProvider>
  )
}
