import { useState, useCallback, useEffect, useMemo } from 'react'
import { Eye, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tabs, type TabItem } from '../../ui/Tabs'
import { ModuleSourcesPanel } from '../ModuleSources/ModuleSourcesPanel'
import { ModulePatientViewPanel } from './ModulePatientViewPanel'
import './ModulePreviewPanel.css'

const DEFAULT_ACCENT = '#6366F1'

type PanelTab = 'preview' | 'sources'

interface Props {
  moduleType: string
  color?: string
}

/**
 * Aperçu praticien d'un module sous deux sous-onglets : « Vue patient »
 * (`ModulePatientViewPanel`) et « Sources & recommandations » (`ModuleSourcesPanel`).
 * Utilisé par la page d'aperçu standalone. La modale d'actions du module, elle, monte
 * ces deux panneaux comme onglets de premier niveau (pas ce composant).
 */
export function ModulePreviewPanel({ moduleType, color }: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<PanelTab>('preview')

  // Réinitialise l'onglet au changement de module.
  useEffect(() => {
    setActiveTab('preview')
  }, [moduleType])

  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id === 'sources' ? 'sources' : 'preview')
  }, [])

  const tabs = useMemo<TabItem[]>(
    () => [
      { id: 'preview', label: t('patient.patient_view_tab'), icon: <Eye size={12} /> },
      { id: 'sources', label: t('patient.sources_tab'), icon: <BookOpen size={12} /> },
    ],
    [t],
  )

  const accentColor = color ?? DEFAULT_ACCENT

  return (
    <div className="preview-panel" style={{ borderTopColor: accentColor }}>
      <Tabs
        className="preview-panel__tabs"
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        accentColor={accentColor}
      />

      {activeTab === 'preview' && <ModulePatientViewPanel moduleType={moduleType} />}

      {activeTab === 'sources' && (
        <div className="preview-panel__inner preview-panel__inner--sources">
          <ModuleSourcesPanel moduleId={moduleType} />
        </div>
      )}
    </div>
  )
}
