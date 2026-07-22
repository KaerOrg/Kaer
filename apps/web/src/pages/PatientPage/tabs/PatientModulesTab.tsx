import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, Plus } from 'lucide-react'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ModuleCard } from '../../../components/features/ModuleCard'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Modal } from '../../../components/ui/Modal'
import { ModuleFilterBar } from '../../../components/features/ModuleFilterBar'
import { ModuleTagChips } from '../../../components/features/ModuleTagChips'
import { moduleMatchesTagFilters } from '../../../lib/moduleFilter'
import { useTagFilters } from '../../../hooks/useTagFilters'
import { matchesAllTokens, tokenizeSearch } from '../../../lib/search'
import { CSSRSScreenPanel } from '../../../components/features/CSSRSScreenPanel'
import { ModuleCardFooter } from './ModuleCardFooter'
import { ModuleActionsModal, type ModuleActionTab } from './ModuleActionsModal'
import { computeModuleTabs } from './moduleActionTabs'
import { type ModuleType, type PatientModule } from '../../../lib/database.types'
import { type LibraryTopic, type PsyEduTheme } from '@services/psyeduService'
import { type ModuleCategory, type ModuleItem } from '@services/moduleCatalogService'
import {
  unlockModule as unlockStandardModule,
  revokeModule as revokeModuleService,
} from '@services/moduleAssignmentService'
import { DEFUSION_TECHNIQUES } from '../../../lib/defusionTechniques'
import { scaleQueries } from '../../../hooks/queries'
import { ScaleMetaBadges } from '../../../components/features/ScaleMetaBadges/ScaleMetaBadges'
import { useRimEditor } from '../hooks/useRimEditor'
import { usePsychoEducationPicker } from '../hooks/usePsychoEducationPicker'
import { useCrisisPlanEditor } from '../hooks/useCrisisPlanEditor'
import { useMedicationEffectsEditor } from '../hooks/useMedicationEffectsEditor'
import { useDefusionConfigEditor } from '../hooks/useDefusionConfigEditor'
import { useMedicationListEditor } from '../hooks/useMedicationListEditor'
import { useBAActivitiesEditor } from '../hooks/useBAActivitiesEditor'
import { PatientViewProvider } from '../../../contexts/PatientViewContext'
import { MedicationSideEffectsCard } from './MedicationSideEffectsCard'
import { ChronobiologyCard } from './ChronobiologyCard'
import { PsychoLibraryPicker } from './PsychoLibraryPicker'
import { MedicationAdherenceCard } from './MedicationAdherenceCard'
import { BehavioralActivationCard } from './BehavioralActivationCard'
import { RimConfigPanel } from './RimConfigPanel'
import { CrisisPlanConfigPanel } from './CrisisPlanConfigPanel'
import { MedicationEffectsConfigPanel } from './MedicationEffectsConfigPanel'
import { MedicationListConfigPanel } from './MedicationListConfigPanel'
import { BAActivitiesConfigPanel } from './BAActivitiesConfigPanel'
import { DefusionConfigPanel } from './DefusionConfigPanel'

// La barre de filtres de la vue active n'apparaît qu'au-delà de ce nombre de
// modules actifs — en dessous, la liste est assez courte pour se passer de filtre.
const ACTIVE_FILTER_THRESHOLD = 8

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
  /** Commande externe (page Évolution) : ouvrir la modale Données de ce module. */
  openDataFor?: ModuleType | null
  /** Accusé de réception de `openDataFor` (le parent remet la commande à null). */
  onOpenDataHandled?: () => void
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
  openDataFor,
  onOpenDataHandled,
}: Props) {
  const { t, i18n } = useTranslation()

  const { data: scaleMeta = [] } = useQuery(scaleQueries.meta())
  // Opération de bascule en cours — une seule à la fois. `unlock` cible un type de
  // module (la row n'existe pas encore), `revoke` une row déjà déverrouillée. Un
  // state unique discriminé plutôt que deux states couplés (unlocking + revoking).
  const [busyModule, setBusyModule] = useState<
    { op: 'unlock'; type: ModuleType } | { op: 'revoke'; id: string } | null
  >(null)
  // Module dont la modale d'actions est ouverte, et sur quel onglet. Un seul state :
  // une seule modale à la fois (exclusivité structurelle), l'onglet actif remplace les
  // anciens states séparés aperçu / données / notifications.
  const [activeModule, setActiveModule] = useState<{ module: ModuleType; tab: ModuleActionTab } | null>(null)

  // Commande externe « Voir les données → » (page Évolution) : ouvre la modale sur
  // l'onglet Données du module demandé, puis accuse réception pour ne pas rouvrir.
  useEffect(() => {
    if (openDataFor == null) return
    setActiveModule({ module: openDataFor, tab: 'data' })
    onOpenDataHandled?.()
  }, [openDataFor, onOpenDataHandled])
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
  const psycho = usePsychoEducationPicker(modules, patientId, practitionerId, onReloadModules)
  const crisis = useCrisisPlanEditor(patientId, modules, onReloadModules)
  const medEffects = useMedicationEffectsEditor(modules, onReloadModules)
  const defusionConfig = useDefusionConfigEditor(modules, onReloadModules)
  const medList = useMedicationListEditor(modules, onReloadModules)
  const baList = useBAActivitiesEditor(modules, onReloadModules)

  // Lecture de l'onglet actif — l'exclusivité vit dans `activeModule`.
  const isPreviewOpen = useCallback(
    (type: ModuleType) => activeModule?.module === type && activeModule.tab === 'preview',
    [activeModule],
  )
  const isDataOpen = useCallback(
    (type: ModuleType) => activeModule?.module === type && activeModule.tab === 'data',
    [activeModule],
  )
  // Carte occupée : déverrouillage de ce type, ou révocation de cette row.
  const isModuleBusy = useCallback(
    (type: ModuleType, modId: string | undefined) =>
      (busyModule?.op === 'unlock' && busyModule.type === type) ||
      (busyModule?.op === 'revoke' && busyModule.id === modId),
    [busyModule],
  )

  // Ouvre la modale d'actions du module sur l'onglet demandé ; re-cliquer sur le
  // bouton déjà actif referme (bascule). Tous les boutons de carte passent par ici.
  const openTab = useCallback((type: ModuleType, tab: ModuleActionTab) => {
    setActiveModule(prev =>
      prev?.module === type && prev.tab === tab ? null : { module: type, tab },
    )
  }, [])

  const togglePreview = useCallback((type: ModuleType) => openTab(type, 'preview'), [openTab])
  const toggleData = useCallback((type: ModuleType) => openTab(type, 'data'), [openTab])
  const openNotif = useCallback((type: ModuleType) => openTab(type, 'notifications'), [openTab])

  // ── Onglet Configuration : coordination modale ↔ hooks d'édition ──────────
  // L'éditeur de chaque module vit dans un hook unique (state + données de synthèse
  // partagées avec la carte). Ouvrir/fermer l'onglet Config amorce/réinitialise le hook
  // correspondant. Pour rim/psycho, le mode dépend de l'état déverrouillé : `unlock`
  // (le formulaire crée le module) ou `edit`.
  // Fonctions simples (non mémoïsées) : elles dépendent des retours de hooks d'édition
  // recréés à chaque render, donc un useCallback ne se stabiliserait jamais — et aucun
  // consommateur (modale, cartes) n'est mémoïsé, la stabilité n'apporterait rien.
  const openConfigEditor = (type: ModuleType) => {
    const unlocked = modules.some(m => m.module_type === type)
    switch (type) {
      case 'rim': rim.open(unlocked ? 'edit' : 'unlock'); break
      case 'psychoeducation': psycho.open(unlocked ? 'edit' : 'unlock'); break
      case 'crisis_plan': void crisis.openEditor(); break
      case 'medication_side_effects': void medEffects.openEditor(); break
      case 'medication_adherence': void medList.openEditor(); break
      case 'behavioral_activation': void baList.openEditor(); break
      case 'cognitive_saturation': void defusionConfig.openEditor(); break
    }
  }

  const closeConfigEditor = (type: ModuleType) => {
    switch (type) {
      case 'rim': rim.cancel(); break
      case 'psychoeducation': psycho.cancel(); break
      case 'crisis_plan': crisis.closeEditor(); break
      case 'medication_side_effects': medEffects.close(); break
      case 'medication_adherence': medList.close(); break
      case 'behavioral_activation': baList.close(); break
    }
  }

  // Ouvre la modale sur l'onglet Configuration en amorçant l'éditeur du module.
  const openConfig = (type: ModuleType) => {
    openConfigEditor(type)
    setActiveModule({ module: type, tab: 'config' })
  }

  // Fermeture de la modale : réinitialise l'éditeur de config s'il était ouvert.
  const closeModal = () => {
    if (activeModule?.tab === 'config') closeConfigEditor(activeModule.module)
    setActiveModule(null)
  }

  // Changement d'onglet interne : amorce l'éditeur en entrant dans Config, le
  // réinitialise en le quittant.
  const changeActiveTab = (tab: ModuleActionTab) => {
    if (!activeModule) return
    if (tab === 'config') openConfigEditor(activeModule.module)
    else if (activeModule.tab === 'config') closeConfigEditor(activeModule.module)
    setActiveModule({ ...activeModule, tab })
  }

  const isUnlocked = (type: ModuleType) => modules.some(m => m.module_type === type)

  // « Activé » = déverrouillé pour ce patient, ou outil toujours disponible sans
  // verrou (scale noToggle, ex. C-SSRS). L'armoire n'affiche que ces modules ;
  // les autres (activables) vivent dans la modale « Ajouter un module ».
  const isActivated = (type: ModuleType) =>
    isUnlocked(type) || scaleMeta.find(s => s.id === type)?.noToggle === true

  const unlockModule = useCallback(async (moduleType: ModuleType) => {
    setBusyModule({ op: 'unlock', type: moduleType })
    // « Décrocher d'une pensée » : au déblocage, les deux techniques sont proposées
    // (config.enabled_techniques, épic mobile #197). Le praticien peut en désactiver
    // ensuite via l'onglet Configuration.
    const config = moduleType === 'cognitive_saturation'
      ? { enabled_techniques: [...DEFUSION_TECHNIQUES] }
      : undefined
    const result = await unlockStandardModule(patientId, practitionerId, moduleType, config)
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
        if (unlocked && mod) revokeModule(mod.id)
        else openConfig('psychoeducation')
      }

      return (
        <div key="psychoeducation" className="module-card-wrapper module-card-wrapper-block">
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
                extra={unlocked && mod ? (
                  <Button variant="ghost" size="sm" onClick={() => openConfig('psychoeducation')}>
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
          </Card>
        </div>
      )
    }

    if (moduleType === 'crisis_plan') {
      const handleCrisisToggle = () => {
        if (unlocked && mod) { crisis.closeEditor(); revokeModule(mod.id) }
        else unlockModule(moduleType)
      }

      return (
        <div key="crisis_plan" className="module-card-wrapper module-card-wrapper-block">
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.crisis_plan.label'),
              right: moduleToggle(unlocked, isModuleBusy(moduleType, mod?.id), handleCrisisToggle),
            }}
            footer={tagChips('crisis_plan')}
            actions={unlocked && mod ? (
              <ModuleCardFooter
                configLabel={t('patient.crisis_configure')}
                onConfigure={() => openConfig('crisis_plan')}
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
          </Card>
        </div>
      )
    }

    if (moduleType === 'medication_side_effects') {
      return (
        <MedicationSideEffectsCard
          key="medication_side_effects"
          tagChips={tagChips('medication_side_effects')}
          modIcon={modIcon}
          mod={mod}
          unlocked={unlocked}
          loading={isModuleBusy('medication_side_effects', mod?.id)}
          previewOpen={isPreviewOpen('medication_side_effects')}
          dataOpen={isDataOpen('medication_side_effects')}
          medEffects={medEffects}
          moduleToggle={moduleToggle}
          onTogglePreview={togglePreview}
          onToggleData={toggleData}
          onConfigureNotif={openNotif}
          onConfigure={openConfig}
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
          modIcon={modIcon}
          mod={mod}
          unlocked={unlocked}
          loading={isModuleBusy('medication_adherence', mod?.id)}
          previewOpen={isPreviewOpen('medication_adherence')}
          dataOpen={isDataOpen('medication_adherence')}
          medList={medList}
          moduleToggle={moduleToggle}
          onTogglePreview={togglePreview}
          onToggleData={toggleData}
          onConfigureNotif={openNotif}
          onConfigure={openConfig}
          onUnlock={unlockModule}
          onRevoke={revokeModule}
        />
      )
    }

    if (moduleType === 'behavioral_activation') {
      return (
        <BehavioralActivationCard
          key="behavioral_activation"
          tagChips={tagChips('behavioral_activation')}
          modIcon={modIcon}
          mod={mod}
          unlocked={unlocked}
          loading={isModuleBusy('behavioral_activation', mod?.id)}
          previewOpen={isPreviewOpen('behavioral_activation')}
          dataOpen={isDataOpen('behavioral_activation')}
          baList={baList}
          moduleToggle={moduleToggle}
          onTogglePreview={togglePreview}
          onToggleData={toggleData}
          onConfigureNotif={openNotif}
          onConfigure={openConfig}
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
          modIcon={modIcon}
          mod={mod}
          unlocked={unlocked}
          loading={isModuleBusy('chronobiology_tracker', mod?.id)}
          previewOpen={isPreviewOpen('chronobiology_tracker')}
          dataOpen={isDataOpen('chronobiology_tracker')}
          moduleToggle={moduleToggle}
          onTogglePreview={togglePreview}
          onToggleData={toggleData}
          onConfigureNotif={openNotif}
          onUnlock={unlockModule}
          onRevoke={revokeModule}
        />
      )
    }

    if (moduleType === 'rim') {
      const handleRimToggle = () => {
        if (unlocked && mod) revokeModule(mod.id)
        else openConfig('rim')
      }

      return (
        <div key="rim" className="module-card-wrapper module-card-wrapper-block">
          <Card
            className="module-card-item"
            header={{
              icon: modIcon,
              title: t('modules.rim.label'),
              right: moduleToggle(unlocked, false, handleRimToggle),
            }}
            footer={tagChips('rim')}
            actions={unlocked && mod ? (
              <Button variant="ghost" size="sm" onClick={() => openConfig('rim')}>
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
        <div key={moduleType} className="module-card-wrapper-block">
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
          </ModuleCard>
        </div>
      )
    }

    return (
      <div key={moduleType} className="module-card-wrapper-block">
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
              onConfigureNotif={unlocked && mod ? () => openNotif(moduleType) : undefined}
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

  // Couleur d'accent et nom d'icône d'un module, indexés par type — pour la modale
  // d'actions, rendue hors de la boucle `renderModuleCard` (pas d'accès au `modItem`).
  const moduleColorByType = useMemo(() => {
    const map = new Map<string, string | undefined>()
    for (const category of categories) {
      for (const m of category.modules) map.set(m.id, m.color)
    }
    return map
  }, [categories])

  const moduleIconByType = useMemo(() => {
    const map = new Map<string, string>()
    for (const category of categories) {
      for (const m of category.modules) map.set(m.id, m.icon)
    }
    return map
  }, [categories])

  // Contexte de la modale d'actions du module actif : row déverrouillée + onglets
  // disponibles, dérivés du module courant. `null` quand aucune modale n'est ouverte.
  const activeModalContext = useMemo(() => {
    if (!activeModule) return null
    const mod = modules.find(m => m.module_type === activeModule.module)
    const scale = scaleMeta.find(s => s.id === activeModule.module)
    const tabs = computeModuleTabs(activeModule.module, {
      unlocked: !!mod,
      isScale: !!scale,
      scaleHasPreview: scale?.hasPreview ?? false,
    })
    return { patientModuleId: mod?.id, tabs }
  }, [activeModule, modules, scaleMeta])

  // Confirmation psychoédu : enregistre puis ferme la modale uniquement au succès.
  const handlePsychoConfirm = async () => {
    const ok = await psycho.confirm()
    if (ok) closeModal()
  }

  // Panneau de l'onglet Configuration du module actif — construit ici car le parent
  // détient les hooks d'édition. Rendu par ModuleActionsModal sous l'onglet Config.
  // Expression simple (non mémoïsée) : les hooks d'édition changent d'identité à chaque
  // render, un useMemo ne prendrait jamais, et le nœud n'est monté que sur l'onglet Config.
  const configPanel = ((): ReactNode => {
    if (!activeModule) return null
    switch (activeModule.module) {
      case 'crisis_plan':
        return <CrisisPlanConfigPanel crisis={crisis} onClose={closeModal} />
      case 'rim':
        return <RimConfigPanel rim={rim} onClose={closeModal} />
      case 'psychoeducation':
        return (
          <PsychoLibraryPicker
            mode={psycho.mode === 'off' ? 'edit' : psycho.mode}
            libraryTopics={libraryTopics}
            themes={themes}
            taxonomy={taxonomy}
            selectedTopicIds={psycho.selectedTopicIds}
            saving={psycho.saving}
            error={psycho.error}
            onToggle={psycho.toggleTopic}
            onConfirm={handlePsychoConfirm}
            onCancel={closeModal}
          />
        )
      case 'medication_side_effects':
        return <MedicationEffectsConfigPanel medEffects={medEffects} onClose={closeModal} />
      case 'medication_adherence':
        return <MedicationListConfigPanel medList={medList} onClose={closeModal} />
      case 'behavioral_activation':
        return <BAActivitiesConfigPanel baList={baList} onClose={closeModal} />
      case 'cognitive_saturation':
        return <DefusionConfigPanel defusionConfig={defusionConfig} onClose={closeModal} />
      default:
        return null
    }
  })()

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

      {/* Rendu en dernier pour rester au-dessus des autres modales : la modale d'actions
          peut être ouverte depuis la modale « Ajouter un module ». */}
      {activeModule && activeModalContext && (
        <ModuleActionsModal
          module={activeModule.module}
          patientId={patientId}
          practitionerId={practitionerId}
          patientModuleId={activeModalContext.patientModuleId}
          moduleIconName={moduleIconByType.get(activeModule.module)}
          color={moduleColorByType.get(activeModule.module)}
          tabs={activeModalContext.tabs}
          activeTab={activeModule.tab}
          onTabChange={changeActiveTab}
          configPanel={configPanel}
          onClose={closeModal}
        />
      )}
    </PatientViewProvider>
  )
}
