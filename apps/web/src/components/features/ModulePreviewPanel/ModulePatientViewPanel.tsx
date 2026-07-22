import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'
import { type PreviewKind } from '@services/moduleService'
import { moduleQueries } from '../../../hooks/queries'
import { Banner } from '../../ui/Banner'
import { FieldRenderer } from '../ModuleRenderer'
import { DefusionPatientView } from './DefusionPatientView'
import './ModulePreviewPanel.css'

// Layouts dont le contenu vit dans une autre table que module_content_fields
// (psyedu_topics/blocks). Ils peuvent rendre avec 0 fields — le fallback
// "coming soon" ne s'applique pas.
const FIELDLESS_LAYOUTS = new Set<PreviewKind>(['psyedu', 'chrono_month'])

interface Props {
  moduleType: string
  /** Row `patient_modules.id` — pilote l'aperçu config-driven du module défusion. */
  patientModuleId?: string
}

/**
 * « Vue patient » d'un module : rendu de l'écran patient via `FieldRenderer` à partir
 * des `module_content_fields` (fallback « à venir » quand aucun champ significatif).
 * Extrait de `ModulePreviewPanel` pour être monté seul comme onglet Aperçu de la
 * modale d'actions, ou sous les sous-onglets de `ModulePreviewPanel` (page standalone).
 */
export function ModulePatientViewPanel({ moduleType, patientModuleId }: Props) {
  const { t } = useTranslation()
  const { data: result = null, isLoading: loading } = useQuery(moduleQueries.fields(moduleType))
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Réinitialise l'état d'UI (carte dépliée) au changement de module — la donnée, elle,
  // provient du cache React Query (moduleQueries.fields).
  useEffect(() => {
    setExpandedCard(null)
  }, [moduleType])

  const handleToggleCard = useCallback((id: string) => {
    setExpandedCard(prev => (prev === id ? null : id))
  }, [])

  // « Décrocher d'une pensée » : aperçu multi-écrans dédié (rail du parcours patient),
  // pas le rendu générique FieldRenderer (module fieldless côté moteur).
  if (moduleType === 'cognitive_saturation') {
    return <DefusionPatientView patientModuleId={patientModuleId} />
  }

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

  if (loading) {
    return <div className="preview-panel__coming-soon">{t('common.loading')}</div>
  }

  if (showComingSoon) {
    return <div className="preview-panel__coming-soon">{t('patient.coming_soon')}</div>
  }

  if (!result) return null

  return (
    <div className="preview-panel__inner">
      <Banner variant="info" icon={<Eye size={16} />}>
        {t('patient.preview_banner')}
      </Banner>
      <FieldRenderer
        preview_kind={result.preview_kind}
        fields={result.fields}
        moduleId={moduleType}
        expandedCard={expandedCard}
        onToggleCard={handleToggleCard}
      />
    </div>
  )
}
