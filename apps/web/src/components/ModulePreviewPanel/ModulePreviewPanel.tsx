import { useState, useCallback, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fetchModuleFields, type ModuleFieldsResult } from '../../lib/moduleService'
import { FieldRenderer } from '../ModuleRenderer'
import './ModulePreviewPanel.css'

const ACCENT_COLORS: Record<string, string> = {
  crisis_plan:             '#D97706',
  therapeutic_commitment:  '#D97706',
  distress_tolerance:      '#D97706',
  medication_side_effects: '#8B5CF6',
  medication_adherence:    '#8B5CF6',
  psychoeducation:         '#8B5CF6',
  sleep_diary:             '#06B6D4',
  diet_weight_psycho:      '#06B6D4',
  chronobiology_tracker:   '#06B6D4',
  mood_tracker:            '#F97316',
  emotion_wheel:           '#F97316',
  behavioral_activation:   '#F97316',
  beck_columns:            '#10B981',
  cognitive_distortions:   '#10B981',
  grounding:               '#10B981',
  rim:                     '#10B981',
  fear_thermometer:        '#F59E0B',
  exposure_hierarchy:      '#F59E0B',
  breathing_techniques:    '#F59E0B',
  cognitive_saturation:    '#F59E0B',
  craving_journal:         '#EC4899',
  decisional_balance:      '#EC4899',
}

const DEFAULT_ACCENT = '#6366F1'

interface Props {
  moduleType: string
  isTeenMode: boolean
}

export function ModulePreviewPanel({ moduleType, isTeenMode: _isTeenMode }: Props) {
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

  const accentColor = ACCENT_COLORS[moduleType] ?? DEFAULT_ACCENT

  return (
    <div className="preview-panel" style={{ borderTopColor: accentColor }}>
      <div className="preview-panel__header" style={{ color: accentColor }}>
        <Eye size={14} />
        {t('patient.patient_view')}
      </div>

      {loading && (
        <div className="preview-panel__coming-soon">{t('common.loading')}</div>
      )}

      {!loading && result && result.preview_kind === 'coming_soon' && (
        <div className="preview-panel__coming-soon">{t('patient.coming_soon')}</div>
      )}

      {!loading && result && result.preview_kind !== 'coming_soon' && (
        <FieldRenderer
          preview_kind={result.preview_kind}
          fields={result.fields}
          expandedCard={expandedCard}
          onToggleCard={handleToggleCard}
        />
      )}
    </div>
  )
}
