import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { psyeduQueries } from '../../../../../hooks/queries'
import { PsyEduBlocks } from './PsyEduBlocks'

interface Props {
  moduleId: string
}

const SECTION_ORDER: Readonly<Record<string, number>> = { why: 0, how: 1, sources: 2 }

// Aperçu praticien du layout psyedu : liste des fiches réelles fetchées
// depuis psyedu_topics (filtrées par module_key=moduleId). Au tap sur une
// fiche, charge les psyedu_blocks et les rend via PsyEduBlocks (équivalent
// web du PsyEduBlockRenderer mobile).
export function PsyEduLayout({ moduleId }: Props) {
  const { t } = useTranslation()
  const { data: topics = [], isLoading, isError } = useQuery(psyeduQueries.topicsByModule(moduleId))
  const [openId, setOpenId] = useState<string | null>(null)

  const handleToggle = useCallback((id: string) => {
    setOpenId(prev => (prev === id ? null : id))
  }, [])

  if (isLoading) {
    return <div className="psyedu psyedu--loading">{t('common.loading')}</div>
  }

  if (isError) {
    return <div className="psyedu psyedu--error">{t('common.error')}</div>
  }

  if (topics.length === 0) {
    return (
      <div className="psyedu psyedu--empty">
        <BookOpen size={32} className="psyedu__empty-icon" />
        <span className="psyedu__empty-text">
          Aucune fiche psychoéducative seedée pour ce module.
        </span>
      </div>
    )
  }

  return (
    <div className="psyedu">
      <div className="psyedu__intro">
        <BookOpen size={14} className="psyedu__intro-icon" />
        <span className="psyedu__intro-text">
          {topics.length} fiches psychoéducatives — appuyez pour prévisualiser
        </span>
      </div>

      <ul className="psyedu__list">
        {topics.map(topic => {
          const isOpen = openId === topic.id
          const titleKey = `${topic.module_key}.${topic.topic_key}.title`
          const summaryKey = `${topic.module_key}.${topic.topic_key}.summary`
          const title = t(titleKey, { ns: 'psyedu', defaultValue: topic.topic_key })
          const summary = t(summaryKey, { ns: 'psyedu', defaultValue: '' })

          return (
            <li key={topic.id} className="psyedu__item">
              <button
                type="button"
                className={`psyedu__row${isOpen ? ' psyedu__row--open' : ''}`}
                onClick={() => handleToggle(topic.id)}
                aria-expanded={isOpen}
              >
                <div className="psyedu__row-icon">
                  <BookOpen size={18} />
                </div>
                <div className="psyedu__row-text">
                  <span className="psyedu__row-title">{title}</span>
                  {summary ? (
                    <span className="psyedu__row-summary">{summary}</span>
                  ) : null}
                </div>
                {isOpen ? (
                  <ChevronDown size={16} className="psyedu__row-chevron" />
                ) : (
                  <ChevronRight size={16} className="psyedu__row-chevron" />
                )}
              </button>
              {isOpen ? (
                <PsyEduBlocks topicId={topic.id} sectionOrder={SECTION_ORDER} />
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
