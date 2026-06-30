import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import {
  fetchLibraryTopics,
  fetchThemes,
  type LibraryTopic,
  type PsyEduTheme,
} from '@services/psyeduService'
import { PsyEduBlocks } from '../PsyEduLayout/PsyEduBlocks'

const SECTION_ORDER: Readonly<Record<string, number>> = { why: 0, how: 1, sources: 2 }

// Aperçu praticien de la bibliothèque psychoéducation : toutes les fiches à thème,
// groupées par thème. (Côté patient mobile, seules les fiches débloquées sont affichées.)
export function PsyEduLibraryLayout() {
  const { t } = useTranslation()
  const [topics, setTopics] = useState<readonly LibraryTopic[]>([])
  const [themes, setThemes] = useState<readonly PsyEduTheme[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    Promise.all([fetchLibraryTopics(), fetchThemes()])
      .then(([topicList, themeList]) => {
        if (cancelled) return
        setTopics(topicList)
        setThemes(themeList)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggle = useCallback((id: string) => {
    setOpenId(prev => (prev === id ? null : id))
  }, [])

  if (loading) return <div className="psyedu psyedu--loading">{t('common.loading')}</div>
  if (error) return <div className="psyedu psyedu--error">{t('common.error')}</div>

  const groups = themes
    .map(theme => ({ theme, items: topics.filter(tp => tp.theme_id === theme.id) }))
    .filter(group => group.items.length > 0)

  if (groups.length === 0) {
    return (
      <div className="psyedu psyedu--empty">
        <BookOpen size={32} className="psyedu__empty-icon" />
        <span className="psyedu__empty-text">{t('patient.psycho_search_empty')}</span>
      </div>
    )
  }

  return (
    <div className="psyedu">
      {groups.map(({ theme, items }) => (
        <div key={theme.id} className="psyedu__group">
          <div className="psyedu__intro">
            <BookOpen size={14} className="psyedu__intro-icon" />
            <span className="psyedu__intro-text">{t(`theme.${theme.id}`, { ns: 'psyedu', defaultValue: theme.id })}</span>
          </div>
          <ul className="psyedu__list">
            {items.map(topic => {
              const isOpen = openId === topic.id
              const title = t(topic.titleKey, { ns: 'psyedu', defaultValue: topic.topic_key })
              const summary = t(topic.summaryKey, { ns: 'psyedu', defaultValue: '' })
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
                      {summary ? <span className="psyedu__row-summary">{summary}</span> : null}
                    </div>
                    {isOpen ? (
                      <ChevronDown size={16} className="psyedu__row-chevron" />
                    ) : (
                      <ChevronRight size={16} className="psyedu__row-chevron" />
                    )}
                  </button>
                  {isOpen ? <PsyEduBlocks topicId={topic.id} sectionOrder={SECTION_ORDER} /> : null}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
