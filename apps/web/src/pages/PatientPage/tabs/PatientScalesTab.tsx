import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, ClipboardList, TrendingUp, ShieldAlert } from 'lucide-react'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { Button } from '../../../components/ui/Button'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { Modal } from '../../../components/ui/Modal'
import { Tabs } from '../../../components/ui/Tabs'
import { Dropdown } from '../../../components/ui/Dropdown'
import { ModuleCard } from '../../../components/features/ModuleCard'
import { ModuleFilterBar } from '../../../components/features/ModuleFilterBar'
import { ModuleTagChips } from '../../../components/features/ModuleTagChips'
import { ModuleTable, type ModuleTableRow } from '../../../components/features/ModuleTable'
import { ScaleMetaBadges } from '../../../components/features/ScaleMetaBadges/ScaleMetaBadges'
import { ScaleEvalBadge } from '../../../components/features/ScaleEvalBadge'
import { CSSRSScreenPanel } from '../../../components/features/CSSRSScreenPanel'
import { moduleMatchesTagFilters } from '../../../lib/moduleFilter'
import { useTagFilters } from '../../../hooks/useTagFilters'
import { matchesAllTokens, tokenizeSearch } from '../../../lib/search'
import { ModuleCardFooter } from './ModuleCardFooter'
import { ModuleActionsModal, type ModuleActionTab } from './ModuleActionsModal'
import { TAB_LABEL_KEY, tabIcon } from './moduleActionTabMeta'
import { computeModuleTabs } from './moduleActionTabs'
import { PatientEvolutionTab } from './PatientEvolutionTab'
import { ScaleProgrammingPanel } from './ScaleProgrammingPanel'
import { ScalePassationBlock } from './ScalePassationBlock'
import { useToast } from '../../../contexts/ToastContext'
import { type ModuleType, type PatientModule } from '../../../lib/database.types'
import { type ModuleCategory, type ModuleItem, type ModuleTaxonomy } from '@services/moduleCatalogService'
import {
  unlockModule as unlockStandardModule,
  revokeModule as revokeModuleService,
} from '@services/moduleAssignmentService'
import { scaleQueries, engagementQueries } from '../../../hooks/queries'
import { PatientViewProvider } from '../../../contexts/PatientViewContext'

// Au-delà de ce nombre d'échelles actives, la barre de filtres apparaît (comme l'armoire
// des modules) ; en dessous, la liste est assez courte pour s'en passer.
const ACTIVE_FILTER_THRESHOLD = 8

type Props = {
  patientId: string
  practitionerId: string
  modules: PatientModule[]
  categories: ModuleCategory[]
  enabledModules: Set<ModuleType> | null
  onReloadModules: () => Promise<void>
}

/**
 * Onglet « Échelles & questionnaires » (K-4) : tableau jumeau de l'armoire des modules,
 * restreint aux échelles cliniques. Réutilise `ModuleTable` (badge Auto/Hétéro accolé au
 * nom via `titleBadge`), `ModuleActionsModal` (clic ligne → fiche, K-3), `PatientEvolutionTab`
 * filtré `family="scales"`, et `ModuleFilterBar` (indication) + un filtre **Type**
 * (Auto/Hétéro). C-SSRS est en tête, toujours disponible (pas de toggle, pas de déblocage) :
 * son clic ouvre le panneau d'évaluations dédié.
 */
export function PatientScalesTab({
  patientId,
  practitionerId,
  modules,
  categories,
  enabledModules,
  onReloadModules,
}: Props) {
  const { t, i18n } = useTranslation()
  const toast = useToast()

  const { data: scaleMeta = [] } = useQuery(scaleQueries.meta())
  const { data: lastActivityByModule } = useQuery(engagementQueries.lastActivity(patientId))

  const [activeSubTab, setActiveSubTab] = useState<'active' | 'evolution'>('active')
  // Une seule bascule unlock/revoke à la fois (state discriminé).
  const [busyScale, setBusyScale] = useState<
    { op: 'unlock'; type: ModuleType } | { op: 'revoke'; id: string } | null
  >(null)
  // Fiche d'échelle ouverte (ModuleActionsModal) + onglet actif ; une seule à la fois.
  const [activeScale, setActiveScale] = useState<{ module: ModuleType; tab: ModuleActionTab } | null>(null)
  const [showCSSRSModal, setShowCSSRSModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // Filtre Type (Auto/Hétéro) : facette propre aux échelles, hors taxonomie.
  const [typeFilter, setTypeFilter] = useState<Set<string>>(() => new Set())
  const { taxonomy, activeFilters, toggleTag, resetFilters } = useTagFilters()

  const scaleById = useMemo(() => new Map(scaleMeta.map(s => [s.id, s])), [scaleMeta])

  // Taxonomie restreinte à l'indication : l'onglet Échelles ne filtre pas par public
  // (la maquette montre Indication + Type). tagsByModule/tagsByDimension inchangés.
  const indicationTaxonomy = useMemo<ModuleTaxonomy>(
    () => ({ ...taxonomy, dimensions: taxonomy.dimensions.filter(d => d.id === 'indication') }),
    [taxonomy],
  )

  const closeAddModal = useCallback(() => {
    setShowAddModal(false)
    setSearchQuery('')
  }, [])

  const isModuleBusy = useCallback(
    (type: ModuleType, modId: string | undefined) =>
      (busyScale?.op === 'unlock' && busyScale.type === type) ||
      (busyScale?.op === 'revoke' && busyScale.id === modId),
    [busyScale],
  )

  const isPreviewOpen = useCallback(
    (type: ModuleType) => activeScale?.module === type && activeScale.tab === 'preview',
    [activeScale],
  )
  const isDataOpen = useCallback(
    (type: ModuleType) => activeScale?.module === type && activeScale.tab === 'data',
    [activeScale],
  )

  const unlockScale = useCallback(async (moduleType: ModuleType) => {
    setBusyScale({ op: 'unlock', type: moduleType })
    const result = await unlockStandardModule(patientId, practitionerId, moduleType)
    if (result.ok) await onReloadModules()
    setBusyScale(null)
  }, [patientId, practitionerId, onReloadModules])

  const revokeScale = useCallback(async (moduleId: string) => {
    setBusyScale({ op: 'revoke', id: moduleId })
    await revokeModuleService(moduleId)
    await onReloadModules()
    setBusyScale(null)
  }, [onReloadModules])

  // Ouvre la fiche de l'échelle sur l'onglet demandé (data/preview/sources ; les échelles
  // n'ont ni config ni notifications). Utilisé par le clic ligne et les raccourcis survol.
  const openScaleTab = useCallback((type: ModuleType, tab: ModuleActionTab) => {
    setActiveScale({ module: type, tab })
  }, [])

  // Clic sur une ligne : C-SSRS → panneau d'évaluations dédié ; sinon fiche sur le 1ᵉʳ
  // onglet disponible. Aucune passation démarrée en un clic (on ouvre une fiche).
  const openScaleSheet = useCallback((type: ModuleType) => {
    const scale = scaleById.get(type)
    if (scale?.noToggle) { setShowCSSRSModal(true); return }
    const mod = modules.find(m => m.module_type === type)
    const tabs = computeModuleTabs(type, {
      unlocked: !!mod,
      isScale: true,
      scaleHasPreview: scale?.hasPreview ?? false,
      scaleEvaluationType: scale?.evaluationType,
    })
    if (tabs.length > 0) openScaleTab(type, tabs[0])
  }, [scaleById, modules, openScaleTab])

  const changeActiveTab = useCallback((tab: ModuleActionTab) => {
    setActiveScale(prev => (prev ? { ...prev, tab } : prev))
  }, [])

  const closeModal = useCallback(() => setActiveScale(null), [])

  const toggleType = useCallback((value: string) => {
    setTypeFilter(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }, [])

  // Contrôle d'activation d'une ligne : C-SSRS = toggle visuel toujours ON (non
  // interactif, jamais révocable) ; sinon toggle unlock/revoke.
  const activationControl = useCallback((type: ModuleType, mod: PatientModule | undefined, noToggle: boolean) => {
    if (noToggle) return <Toggle checked />
    const unlocked = !!mod
    const loading = isModuleBusy(type, mod?.id)
    return (
      <button
        className="module-toggle"
        onClick={() => { if (unlocked && mod) revokeScale(mod.id); else unlockScale(type) }}
        disabled={loading}
        aria-label={unlocked ? t('patient.revoke_button') : t('patient.unlock_button')}
      >
        <Toggle checked={unlocked} />
      </button>
    )
  }, [isModuleBusy, revokeScale, unlockScale, t])

  // ── Une ligne du tableau des échelles ─────────────────────────────────────
  const renderScaleRow = useCallback((item: ModuleItem): ModuleTableRow => {
    const moduleType = item.id as ModuleType
    const scale = scaleById.get(moduleType)
    const mod = modules.find(m => m.module_type === moduleType)
    const RowIcon = LUCIDE_ICONS[item.icon]
    const noToggle = scale?.noToggle ?? false

    // Raccourcis survol : onglets disponibles (data/preview), hors sources ; aucun pour
    // C-SSRS (son clic ouvre le panneau d'évaluations).
    const actionTabs = noToggle
      ? []
      : computeModuleTabs(moduleType, {
          unlocked: !!mod,
          isScale: true,
          scaleHasPreview: scale?.hasPreview ?? false,
          scaleEvaluationType: scale?.evaluationType,
        }).filter(tab => tab !== 'sources')

    return {
      id: moduleType,
      icon: RowIcon ? <RowIcon size={18} /> : null,
      title: t(`modules.${moduleType}.label`),
      titleBadge: scale ? <ScaleEvalBadge evaluationType={scale.evaluationType} /> : null,
      description: t(`scales.full_title.${moduleType}`),
      indications: <ModuleTagChips tagIds={taxonomy.tagsByModule.get(moduleType)} taxonomy={taxonomy} maxChips={2} />,
      // C-SSRS : « Toujours dispo. » au lieu d'une date de déblocage.
      unlockedAt: noToggle ? null : (mod ? mod.unlocked_at : null),
      unlockedLabelOverride: noToggle ? t('scales.always_available') : undefined,
      lastActivityAt: lastActivityByModule?.get(moduleType) ?? null,
      activation: activationControl(moduleType, mod, noToggle),
      actions: actionTabs.length > 0 ? (
        <>
          {actionTabs.map(tab => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              icon={tabIcon(tab)}
              aria-label={t(TAB_LABEL_KEY[tab])}
              onClick={e => { e.stopPropagation(); openScaleTab(moduleType, tab) }}
            />
          ))}
        </>
      ) : undefined,
    }
  }, [scaleById, modules, lastActivityByModule, taxonomy, activationControl, openScaleTab, t])

  // ── Carte d'une échelle activable (modale « Ajouter une échelle ») ─────────
  const renderScaleCard = useCallback((item: ModuleItem) => {
    const moduleType = item.id as ModuleType
    const scale = scaleById.get(moduleType)
    const mod = modules.find(m => m.module_type === moduleType)
    const unlocked = !!mod
    const ModIcon = LUCIDE_ICONS[item.icon]
    if (!scale) return null

    const right = scale.noToggle ? (
      <Button
        variant="ghost"
        size="sm"
        icon={<ShieldAlert size={13} />}
        onClick={() => setShowCSSRSModal(true)}
      >
        {t('patient.cssrs_evaluations')}
      </Button>
    ) : (
      <button
        className="module-toggle"
        onClick={() => { if (unlocked && mod) revokeScale(mod.id); else unlockScale(moduleType) }}
        disabled={isModuleBusy(moduleType, mod?.id)}
        aria-label={unlocked ? t('patient.revoke_button') : t('patient.unlock_button')}
      >
        <Toggle checked={unlocked} />
      </button>
    )

    return (
      <div key={moduleType} className="module-card-wrapper-block">
        <ModuleCard
          className={unlocked ? 'module-card--unlocked' : undefined}
          icon={ModIcon ? <ModIcon size={18} /> : undefined}
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
              onTogglePreview={scale.hasPreview ? () => openScaleTab(moduleType, 'preview') : undefined}
              dataOpen={isDataOpen(moduleType)}
              onToggleData={unlocked && mod ? () => openScaleTab(moduleType, 'data') : undefined}
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
  }, [scaleById, modules, isModuleBusy, isPreviewOpen, isDataOpen, revokeScale, unlockScale, openScaleTab, t, i18n.language])

  // Aplati les échelles du catalogue (id présent dans scaleMeta) filtrées par `include`,
  // en respectant l'activation praticien.
  const collectScales = useCallback(
    (include: (type: ModuleType) => boolean): ModuleItem[] => {
      const out: ModuleItem[] = []
      for (const category of categories) {
        const base = enabledModules === null
          ? category.modules
          : category.modules.filter(m => enabledModules.has(m.id as ModuleType))
        for (const m of base) {
          if (scaleById.has(m.id) && include(m.id as ModuleType)) out.push(m)
        }
      }
      return out
    },
    [categories, enabledModules, scaleById],
  )

  // Activée = déverrouillée pour ce patient, ou toujours disponible (C-SSRS noToggle).
  const isActivated = useCallback(
    (type: ModuleType) => modules.some(m => m.module_type === type) || scaleById.get(type)?.noToggle === true,
    [modules, scaleById],
  )

  const matchesType = useCallback(
    (type: ModuleType) => typeFilter.size === 0 || typeFilter.has(scaleById.get(type)?.evaluationType ?? 'auto'),
    [typeFilter, scaleById],
  )

  const moduleIconByType = useMemo(() => {
    const map = new Map<string, string>()
    for (const category of categories) for (const m of category.modules) map.set(m.id, m.icon)
    return map
  }, [categories])
  const moduleColorByType = useMemo(() => {
    const map = new Map<string, string | undefined>()
    for (const category of categories) for (const m of category.modules) map.set(m.id, m.color)
    return map
  }, [categories])

  const activeModalContext = useMemo(() => {
    if (!activeScale) return null
    const mod = modules.find(m => m.module_type === activeScale.module)
    const scale = scaleById.get(activeScale.module)
    const tabs = computeModuleTabs(activeScale.module, {
      unlocked: !!mod,
      isScale: !!scale,
      scaleHasPreview: scale?.hasPreview ?? false,
      scaleEvaluationType: scale?.evaluationType,
    })
    return { patientModuleId: mod?.id, tabs, evaluationType: scale?.evaluationType }
  }, [activeScale, modules, scaleById])

  // Panneau de l'onglet Programmation (auto) / Passation (hétéro) de l'échelle active.
  // Câblage minimal des actions « Faire passer » / « Démarrer » en K-6 (envoi/saisie
  // réelle en follow-up) : un toast neutre, jamais déclenché par un score (MDR).
  const notYet = useCallback(() => toast.info(t('scales.schedule.action_soon')), [toast, t])
  const schedulePanel = useMemo(() => {
    if (!activeScale || activeModalContext?.evaluationType == null) return null
    if (activeModalContext.evaluationType === 'hetero') {
      return <ScalePassationBlock onStart={notYet} lastPassationLabel={null} />
    }
    return (
      <ScaleProgrammingPanel
        patientId={patientId}
        practitionerId={practitionerId}
        moduleId={activeScale.module}
        onRunNow={notYet}
      />
    )
  }, [activeScale, activeModalContext, patientId, practitionerId, notYet])

  const activatedScales = collectScales(isActivated)
  const activatableScales = collectScales(type => !isActivated(type))
  const hasActivatableScales = activatableScales.length > 0

  // Lentille : filtre indication (taxonomie) + Type (Auto/Hétéro).
  const visibleActivatedScales = activatedScales.filter(m =>
    moduleMatchesTagFilters(taxonomy.tagsByModule.get(m.id), activeFilters) && matchesType(m.id as ModuleType),
  )
  const showActiveFilterBar = activatedScales.length >= ACTIVE_FILTER_THRESHOLD
  const displayedActivatedScales = showActiveFilterBar ? visibleActivatedScales : activatedScales

  const searchTokens = tokenizeSearch(searchQuery)
  const candidateScales = activatableScales.filter(m =>
    moduleMatchesTagFilters(taxonomy.tagsByModule.get(m.id), activeFilters) &&
    matchesType(m.id as ModuleType) &&
    (searchTokens.length === 0 ||
      matchesAllTokens(`${t(`modules.${m.id}.label`)} ${t(`scales.full_title.${m.id}`)}`, searchTokens)),
  )

  const addScaleSearch = useMemo(
    () => ({ value: searchQuery, onChange: setSearchQuery, placeholder: t('scales.search_placeholder') }),
    [searchQuery, t],
  )

  const typeOptions = useMemo(
    () => [
      { value: 'auto', label: t('scales.eval_auto') },
      { value: 'hetero', label: t('scales.eval_hetero') },
    ],
    [t],
  )

  const typeFilterControl = (
    <Dropdown
      mode="multiple"
      label={t('scales.type_filter_label')}
      options={typeOptions}
      selectedValues={typeFilter}
      onToggle={toggleType}
      placeholder={t('modules.filter_select')}
    />
  )

  return (
    <PatientViewProvider patientId={patientId}>
      <section className="therapeutic-wardrobe">
        <div className="wardrobe__header">
          <div>
            <h2 className="wardrobe__title">{t('scales.wardrobe_title')}</h2>
            <p className="wardrobe__desc">{t('scales.wardrobe_desc')}</p>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)} disabled={!hasActivatableScales}>
            <Plus size={16} />
            {t('scales.add_button')}
          </Button>
        </div>

        <div className="wardrobe__subtabs">
          <Tabs
            tabs={[
              { id: 'active', label: t('scales.subtab_active'), icon: <ClipboardList size={16} />, badge: activatedScales.length || undefined },
              { id: 'evolution', label: t('patient.tab_evolution'), icon: <TrendingUp size={16} /> },
            ]}
            activeTab={activeSubTab}
            onChange={id => setActiveSubTab(id as 'active' | 'evolution')}
          />
        </div>

        {activeSubTab === 'active' ? (
          activatedScales.length === 0 ? (
            <p className="wardrobe__empty">{t('scales.wardrobe_empty')}</p>
          ) : (
            <div className="wardrobe__active">
              {showActiveFilterBar && (
                <ModuleFilterBar
                  taxonomy={indicationTaxonomy}
                  activeFilters={activeFilters}
                  onToggleTag={toggleTag}
                  onReset={resetFilters}
                  resultCount={visibleActivatedScales.length}
                  totalCount={activatedScales.length}
                  extraControls={typeFilterControl}
                />
              )}
              <ModuleTable
                rows={displayedActivatedScales.map(renderScaleRow)}
                firstColumnLabel={t('scales.col_scale')}
                ariaLabel={t('scales.wardrobe_title')}
                emptyState={<p className="wardrobe__empty">{t('modules.empty_filter')}</p>}
                onRowClick={id => openScaleSheet(id as ModuleType)}
              />
            </div>
          )
        ) : (
          <PatientEvolutionTab patientId={patientId} family="scales" onOpenModuleData={openScaleSheet} />
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
          <CSSRSScreenPanel patientId={patientId} practitionerId={practitionerId} />
        </Modal>
      )}

      {showAddModal && (
        <Modal
          title={t('scales.add_title')}
          icon={<Plus size={20} />}
          onClose={closeAddModal}
          maxWidth={920}
        >
          <div className="wardrobe__add">
            <ModuleFilterBar
              taxonomy={indicationTaxonomy}
              activeFilters={activeFilters}
              onToggleTag={toggleTag}
              onReset={resetFilters}
              resultCount={candidateScales.length}
              totalCount={activatableScales.length}
              search={addScaleSearch}
              extraControls={typeFilterControl}
            />
            {candidateScales.length > 0 ? (
              <div className="category-modules-grid">
                {candidateScales.map(renderScaleCard)}
              </div>
            ) : (
              <p className="wardrobe__empty">{t('modules.empty_filter')}</p>
            )}
          </div>
        </Modal>
      )}

      {activeScale && activeModalContext && (
        <ModuleActionsModal
          module={activeScale.module}
          patientId={patientId}
          practitionerId={practitionerId}
          patientModuleId={activeModalContext.patientModuleId}
          moduleIconName={moduleIconByType.get(activeScale.module)}
          color={moduleColorByType.get(activeScale.module)}
          tabs={activeModalContext.tabs}
          activeTab={activeScale.tab}
          onTabChange={changeActiveTab}
          schedulePanel={schedulePanel}
          onClose={closeModal}
        />
      )}
    </PatientViewProvider>
  )
}
