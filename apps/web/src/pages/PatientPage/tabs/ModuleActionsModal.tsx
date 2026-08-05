import { useCallback, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@ui/Modal'
import { Tabs, type TabItem } from '@ui/Tabs'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { ModulePatientViewPanel } from '../../../components/features/ModulePreviewPanel'
import { ModuleSourcesPanel } from '../../../components/features/ModuleSources/ModuleSourcesPanel'
import { NotificationRoutinePanel } from '../../../components/features/NotificationRoutinePanel/NotificationRoutinePanel'
import type { ModuleType } from '../../../lib/database.types'
import { ModuleDataPanel } from './ModuleDataPanel'
import { BreathingReminderPanel } from './BreathingReminderPanel'
import { TAB_LABEL_KEY, tabIcon } from './moduleActionTabMeta'
import './ModuleActionsModal.css'

/**
 * Onglets possibles de la modale d'actions d'un module. L'ordre d'affichage canonique
 * est Données → Configuration → Notifications → Vue patient → Sources (porté par
 * `computeModuleTabs`) ; cette union sert au typage, `TAB_ORDER` à la validation.
 */
export type ModuleActionTab = 'preview' | 'sources' | 'data' | 'notifications' | 'config' | 'schedule' | 'passation'

const TAB_ORDER: readonly ModuleActionTab[] = ['schedule', 'passation', 'data', 'config', 'notifications', 'preview', 'sources']

function isActionTab(id: string): id is ModuleActionTab {
  return (TAB_ORDER as readonly string[]).includes(id)
}

interface Props {
  module: ModuleType
  patientId: string
  practitionerId: string
  /** Row `patient_modules` du module — requise pour l'onglet Notifications. */
  patientModuleId?: string
  /** Nom d'icône Lucide du module (catalogue) — en-tête de la modale. */
  moduleIconName?: string
  /** Couleur d'accent du module (catalogue) — aperçu + onglet actif. */
  color?: string
  /** Onglets disponibles pour ce module, dans l'ordre d'affichage. */
  tabs: ModuleActionTab[]
  activeTab: ModuleActionTab
  onTabChange: (tab: ModuleActionTab) => void
  /**
   * Contenu de l'onglet Configuration, construit par le parent (qui détient les hooks
   * d'édition et leurs données de synthèse). Requis dès que `tabs` contient `config`.
   */
  configPanel?: ReactNode
  /**
   * Contenu de l'onglet Programmation (auto) ou Passation (hétéro) d'une échelle (K-6),
   * construit par le parent. Requis dès que `tabs` contient `schedule` ou `passation`.
   */
  schedulePanel?: ReactNode
  onClose: () => void
}

/**
 * Modale unique regroupant toutes les actions praticien d'un module (aperçu,
 * données, notifications) sous un jeu d'onglets `ui/Tabs`. Chaque bouton de la carte
 * module ouvre cette modale sur l'onglet correspondant ; l'exclusivité (une seule
 * modale ouverte) et l'onglet actif sont portés par le parent. Réutilise le primitive
 * `ui/Modal` — aucune modale ad hoc.
 */
export function ModuleActionsModal({
  module,
  patientId,
  practitionerId,
  patientModuleId,
  moduleIconName,
  color,
  tabs,
  activeTab,
  onTabChange,
  configPanel,
  schedulePanel,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation()

  const tabItems = useMemo<TabItem[]>(
    () => tabs.map(tab => ({ id: tab, label: t(TAB_LABEL_KEY[tab]), icon: tabIcon(tab) })),
    [tabs, t],
  )

  const handleChange = useCallback(
    (id: string) => { if (isActionTab(id)) onTabChange(id) },
    [onTabChange],
  )

  const HeaderIcon = moduleIconName ? LUCIDE_ICONS[moduleIconName] : undefined

  return (
    <Modal
      title={t(`modules.${module}.label`)}
      icon={HeaderIcon ? <HeaderIcon size={20} /> : tabIcon(activeTab)}
      onClose={onClose}
      maxWidth={920}
      noPadding
    >
      <div className="module-actions-modal">
        <div className="module-actions-modal__tabs">
          <Tabs variant="compact" tabs={tabItems} activeTab={activeTab} onChange={handleChange} accentColor={color} />
        </div>

        <div className="module-actions-modal__panel">
          {activeTab === 'preview' && <ModulePatientViewPanel moduleType={module} patientModuleId={patientModuleId ?? undefined} />}
          {activeTab === 'sources' && <ModuleSourcesPanel moduleId={module} />}
          {activeTab === 'data' && <ModuleDataPanel patientId={patientId} moduleType={module} />}
          {/* Respiration : le rappel est réglé par le patient, le praticien le lit
              seulement (W3 #375). Les autres modules gardent l'éditeur de routine. */}
          {activeTab === 'notifications' && module === 'breathing_techniques' && (
            <BreathingReminderPanel patientId={patientId} locale={i18n.language} />
          )}
          {activeTab === 'notifications' && module !== 'breathing_techniques' && patientModuleId && (
            <NotificationRoutinePanel
              patientModuleId={patientModuleId}
              practitionerId={practitionerId}
              patientId={patientId}
            />
          )}
          {activeTab === 'config' && configPanel}
          {(activeTab === 'schedule' || activeTab === 'passation') && schedulePanel}
        </div>
      </div>
    </Modal>
  )
}
