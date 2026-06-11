import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { Button } from '../../../components/ui/Button'
import type { LibraryTopic, PsyEduTheme } from '../../../services/psyeduService'

type Props = {
  mode: 'unlock' | 'edit'
  libraryTopics: LibraryTopic[]
  themes: PsyEduTheme[]
  selectedTopicIds: Set<string>
  saving: boolean
  error: string | null
  onToggle: (topicId: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function PsychoLibraryPicker({
  mode,
  libraryTopics,
  themes,
  selectedTopicIds,
  saving,
  error,
  onToggle,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    return themes
      .map(theme => {
        const topics = libraryTopics
          .filter(topic => topic.theme_id === theme.id)
          .filter(topic => {
            if (!query) return true
            const title = t(topic.titleKey, { ns: 'psyedu' }).toLowerCase()
            const summary = t(topic.summaryKey, { ns: 'psyedu' }).toLowerCase()
            return title.includes(query) || summary.includes(query)
          })
        return { theme, topics }
      })
      .filter(group => group.topics.length > 0)
  }, [themes, libraryTopics, search, t])

  return (
    <div className={`psycho-card-picker ${mode === 'edit' ? 'psycho-card-picker--edit' : ''}`}>
      <p className="psycho-card-picker__label">
        {mode === 'unlock' ? t('patient.psycho_pick_unlock') : t('patient.psycho_pick_edit')}
      </p>

      <input
        type="search"
        className="psycho-card-picker__search"
        placeholder={t('patient.psycho_search_placeholder')}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {groups.length === 0 ? (
        <p className="psycho-card-picker__empty">{t('patient.psycho_search_empty')}</p>
      ) : (
        groups.map(({ theme, topics }) => {
          const ThemeIcon = LUCIDE_ICONS[theme.icon_name]
          return (
            <div key={theme.id}>
              <p className="psycho-card-picker__theme">
                {ThemeIcon ? <ThemeIcon size={13} /> : null}
                {t(`theme.${theme.id}`, { ns: 'psyedu' })}
              </p>
              <ul className="psycho-card-picker__list">
                {topics.map(topic => (
                  <li key={topic.id} className="psycho-card-option">
                    <label className="psycho-card-option__label">
                      <input
                        type="checkbox"
                        className="psycho-card-option__checkbox"
                        checked={selectedTopicIds.has(topic.id)}
                        onChange={() => onToggle(topic.id)}
                      />
                      <div>
                        <div className="psycho-card-option__title">{t(topic.titleKey, { ns: 'psyedu' })}</div>
                        <div className="psycho-card-option__desc">{t(topic.summaryKey, { ns: 'psyedu' })}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )
        })
      )}

      {error ? <p className="psycho-card-picker__error">{error}</p> : null}

      <div className="psycho-card-picker__actions">
        <Button size="sm" loading={saving} onClick={onConfirm}>
          {mode === 'unlock'
            ? (selectedTopicIds.size === 1
                ? t('patient.psycho_unlock_btn', { count: selectedTopicIds.size })
                : t('patient.psycho_unlock_btn_plural', { count: selectedTopicIds.size }))
            : t('patient.psycho_save_btn')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
