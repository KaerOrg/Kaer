import { useState, useCallback, useEffect } from 'react'
import { Eye, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fetchModuleFields, type ModuleFieldsResult, type PreviewKind } from '../../../services/moduleService'
import { FieldRenderer } from '../ModuleRenderer'
import { ModuleSourcesPanel } from '../../ModuleSources/ModuleSourcesPanel'
import { MedicationSideEffectsPreview } from './MedicationSideEffectsPreview'
import './ModulePreviewPanel.css'

const DEFAULT_ACCENT = '#6366F1'

// Layouts dont le contenu vit dans une autre table que module_content_fields
// (psyedu_topics/blocks, form_entries, exposure_hierarchies). Ils peuvent
// rendre avec 0 fields — le fallback "coming soon" ne s'applique pas.
const FIELDLESS_LAYOUTS = new Set<PreviewKind>(['psyedu', 'chrono_month', 'exposure_hierarchy'])

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
      <div className="preview-panel__tabs">
        <button
          className={`preview-panel__tab ${activeTab === 'preview' ? 'preview-panel__tab--active' : ''}`}
          style={activeTab === 'preview' ? { color: accentColor, borderBottomColor: accentColor } : undefined}
          onClick={() => setActiveTab('preview')}
        >
          <Eye size={12} />
          {t('patient.patient_view_tab')}
        </button>
        <button
          className={`preview-panel__tab ${activeTab === 'sources' ? 'preview-panel__tab--active' : ''}`}
          style={activeTab === 'sources' ? { color: accentColor, borderBottomColor: accentColor } : undefined}
          onClick={() => setActiveTab('sources')}
        >
          <BookOpen size={12} />
          {t('patient.sources_tab')}
        </button>
      </div>

      {activeTab === 'preview' && (
        <>
          {moduleType === 'medication_side_effects' ? (
            <div className="preview-panel__inner">
              <MedicationSideEffectsPreview />
              {result && !showComingSoon && (
                <>
                  <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #F3F4F6' }} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>
                    {t('patient.preview_questionnaire_label', { defaultValue: 'Questionnaire de saisie' })}
                  </p>
                  <FieldRenderer
                    preview_kind={result.preview_kind}
                    fields={result.fields}
                    moduleId={moduleType}
                    expandedCard={expandedCard}
                    onToggleCard={handleToggleCard}
                  />
                </>
              )}
            </div>
          ) : (
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
