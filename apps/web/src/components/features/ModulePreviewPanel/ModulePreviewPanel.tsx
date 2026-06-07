import { useState, useCallback, useEffect, useMemo } from 'react'
import { Eye, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fetchModuleFields, type ModuleFieldsResult, type PreviewKind } from '../../../services/moduleService'
import { Tabs, type TabItem } from '../../ui/Tabs'
import { FieldRenderer } from '../ModuleRenderer'
import { ModuleSourcesPanel } from '../ModuleSources/ModuleSourcesPanel'
import './ModulePreviewPanel.css'

const DEFAULT_ACCENT = '#6366F1'

// Layouts dont le contenu vit dans une autre table que module_content_fields
// (psyedu_topics/blocks). Ils peuvent rendre avec 0 fields — le fallback
// "coming soon" ne s'applique pas.
const FIELDLESS_LAYOUTS = new Set<PreviewKind>(['psyedu', 'chrono_month'])

type PanelTab = 'preview' | 'sources'

interface Props {
  moduleType: string
  color?: string
}

export function ModulePreviewPanel({ moduleType, color }: Props) {
  const { t } = useTranslation()
  const [result, setResult] = useState<ModuleFieldsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PanelTab>('preview')

  useEffect(() => {
    setLoading(true)
    setResult(null)
    setExpandedCard(null)
    setActiveTab('preview')
    fetchModuleFields(moduleType).then(r => {
      setResult(r)
      setLoading(false)
    })
  }, [moduleType])

  const handleToggleCard = useCallback((id: string) => {
    setExpandedCard(prev => (prev === id ? null : id))
  }, [])

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

  const meaningfulFieldsCount = result
    ? result.fields.filter(
        f =>
          f.field_type !== 'coming_soon' &&
          f.field_type !== 'module_label' &&
          f.field_type !== 'module_description',
      ).length
    : 0
  const isFieldless = !!result && FIELDLESS_LAYOUTS.has(result.preview_kind)
  const showComingSoon =
    !!result &&
    !isFieldless &&
    (result.preview_kind === 'coming_soon' || meaningfulFieldsCount === 0)

  return (
    <div className="preview-panel" style={{ borderTopColor: accentColor }}>
      <Tabs
        className="preview-panel__tabs"
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        accentColor={accentColor}
      />

      {activeTab === 'preview' && (
        <>
          {loading && (
            <div className="preview-panel__coming-soon">{t('common.loading')}</div>
          )}

          {!loading && showComingSoon && (
            <div className="preview-panel__coming-soon">{t('patient.coming_soon')}</div>
          )}

          {!loading && result && !showComingSoon && (
            <div className="preview-panel__inner">
              <FieldRenderer
                preview_kind={result.preview_kind}
                fields={result.fields}
                moduleId={moduleType}
                expandedCard={expandedCard}
                onToggleCard={handleToggleCard}
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'sources' && (
        <div className="preview-panel__inner preview-panel__inner--sources">
          <ModuleSourcesPanel moduleId={moduleType} />
        </div>
      )}
    </div>
  )
}
