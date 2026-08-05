import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ExternalLink, BookOpen, FlaskConical, GitBranch, FileText, Users } from 'lucide-react'
import type { ModuleSourceType } from '@kaer/shared'
import { moduleSourcesQueries } from '../../../hooks/queries'
import { ModuleIndicationsBlock } from './ModuleIndicationsBlock'
import { BreathingEvidenceTable } from './BreathingEvidenceTable'
import { groupSourcesByEvidence } from './sourceGroups'
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
  const { data: sources = [], isLoading, isError } = useQuery(moduleSourcesQueries.byModule(moduleId))
  // Groupé par niveau de preuve : le praticien lit d'abord ce qui pèse le plus lourd.
  // L'ordre dérive de `source_type`, jamais d'un champ nouveau.
  const groups = useMemo(() => groupSourcesByEvidence(sources), [sources])

  if (isLoading) {
    return <div className="sources-panel__empty">{t('common.loading')}</div>
  }

  if (isError || sources.length === 0) {
    return <div className="sources-panel__empty">{t('patient.sources_empty')}</div>
  }

  return (
    <div className="sources-panel">
      <ModuleIndicationsBlock moduleId={moduleId} />

      {/* Respiration : le niveau de preuve par technique passe en tête, c'est ce que
          le praticien lit pour décider quoi activer en séance (W4 #376). */}
      {moduleId === 'breathing_techniques' && <BreathingEvidenceTable />}

      <p className="sources-panel__intro">{t('patient.sources_intro')}</p>

      {groups.map(group => (
        <section key={group.id} className="sources-panel__group">
          <h4 className="sources-panel__group-title">{t(`patient.sources_group_${group.id}`)}</h4>
          <ul className="sources-panel__list">
            {group.sources.map(source => {
              const Icon = SOURCE_ICONS[source.source_type]
              return (
                <li key={source.id} className={`sources-item sources-item--${source.source_type}`}>
                  <div className="sources-item__header">
                    <span className={`sources-item__type-badge sources-item__type-badge--${source.source_type}`}>
                      <Icon size={11} />
                      {t(`patient.sources_type_${source.source_type}`)}
                    </span>
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
        </section>
      ))}
    </div>
  )
}
