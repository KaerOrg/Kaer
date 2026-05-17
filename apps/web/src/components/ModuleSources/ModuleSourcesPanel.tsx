import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, BookOpen, FlaskConical, GitBranch, FileText, Users } from 'lucide-react'
import type { ModuleSource, ModuleSourceType } from '@psytool/shared'
import { fetchSourcesByModule } from '../../services/moduleSourcesService'
import './ModuleSourcesPanel.css'

interface Props {
  moduleId: string
}

const SOURCE_ICONS: Record<ModuleSourceType, React.ComponentType<{ size: number }>> = {
  rct:               FlaskConical,
  cohort_study:      GitBranch,
  meta_analysis:     BookOpen,
  systematic_review: BookOpen,
  guideline:         FileText,
  expert_opinion:    Users,
}

export function ModuleSourcesPanel({ moduleId }: Props) {
  const { t } = useTranslation()
  const [sources, setSources] = useState<ModuleSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetchSourcesByModule(moduleId)
      .then(setSources)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [moduleId])

  if (loading) {
    return <div className="sources-panel__empty">{t('common.loading')}</div>
  }

  if (error || sources.length === 0) {
    return <div className="sources-panel__empty">{t('patient.sources_empty')}</div>
  }

  return (
    <div className="sources-panel">
      <p className="sources-panel__intro">{t('patient.sources_intro')}</p>

      <ul className="sources-panel__list">
        {sources.map(source => {
          const Icon = SOURCE_ICONS[source.source_type]
          return (
            <li key={source.id} className="sources-item">
              <div className="sources-item__header">
                <span className={`sources-item__type-badge sources-item__type-badge--${source.source_type}`}>
                  <Icon size={11} />
                  {t(`patient.sources_type_${source.source_type}`)}
                </span>
                {source.evidence_grade && (
                  <span className={`sources-item__grade sources-item__grade--${source.evidence_grade.toLowerCase()}`}>
                    {t('patient.sources_grade', { grade: source.evidence_grade })}
                  </span>
                )}
              </div>

              <div className="sources-item__label">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sources-item__link"
                  >
                    {source.label}
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  source.label
                )}
              </div>

              {source.description && (
                <p className="sources-item__description">{source.description}</p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
