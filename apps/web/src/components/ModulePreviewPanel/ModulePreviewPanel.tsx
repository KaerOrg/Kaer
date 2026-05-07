import { useState, useCallback, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fetchModuleFields, type ModuleFieldsResult } from '../../services/moduleService'
import { FieldRenderer } from '../ModuleRenderer'
import './ModulePreviewPanel.css'

const DEFAULT_ACCENT = '#6366F1'

interface Props {
  moduleType: string
  color?: string
}

export function ModulePreviewPanel({ moduleType, color }: Props) {
  const { t } = useTranslation()
  const [result, setResult] = useState<ModuleFieldsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setResult(null)
    setExpandedCard(null)
    fetchModuleFields(moduleType).then(r => {
      setResult(r)
      setLoading(false)
    })
  }, [moduleType])

  const handleToggleCard = useCallback((id: string) => {
    setExpandedCard(prev => (prev === id ? null : id))
  }, [])

  const accentColor = color ?? DEFAULT_ACCENT

  // « Bientôt disponible » réservé aux modules réellement vides : `preview_kind`
  // explicite ou aucun field de contenu (le seul field présent étant un
  // placeholder `coming_soon`). Si la base contient du vrai contenu, on le rend
  // via FieldRenderer (layout dédié ou fallback générique) — un éventuel field
  // `coming_soon` résiduel n'écrase pas le rendu.
  const meaningfulFieldsCount = result
    ? result.fields.filter(
        f =>
          f.field_type !== 'coming_soon' &&
          f.field_type !== 'module_label' &&
          f.field_type !== 'module_description',
      ).length
    : 0
  const showComingSoon =
    !!result && (result.preview_kind === 'coming_soon' || meaningfulFieldsCount === 0)

  return (
    <div className="preview-panel" style={{ borderTopColor: accentColor }}>
      <div className="preview-panel__header" style={{ color: accentColor }}>
        <Eye size={14} />
        {t('patient.patient_view')}
      </div>

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
            expandedCard={expandedCard}
            onToggleCard={handleToggleCard}
          />
        </div>
      )}
    </div>
  )
}
