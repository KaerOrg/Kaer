import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { Button } from '../../../components/ui/Button'
import { SearchInput } from '../../../components/ui/SearchInput'
import { ModuleFilterBar } from '../../../components/features/ModuleFilterBar'
import { ThemeSuggestionButton } from '../../../components/features/ThemeSuggestionButton'
import { moduleMatchesTagFilters, type ActiveTagFilters } from '../../../lib/moduleFilter'
import { matchesAllTokens, tokenizeSearch } from '../../../lib/search'
import type { LibraryTopic, PsyEduTheme } from '../../../services/psyeduService'
import type { ModuleTaxonomy, Tag } from '../../../services/moduleCatalogService'

type Props = {
  mode: 'unlock' | 'edit'
  libraryTopics: LibraryTopic[]
  themes: PsyEduTheme[]
  taxonomy: ModuleTaxonomy
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
  taxonomy,
  selectedTopicIds,
  saving,
  error,
  onToggle,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<ActiveTagFilters>(new Map())

  // Taxonomie restreinte aux tags réellement portés par des fiches de la
  // bibliothèque : la barre ne propose que des filtres utiles.
  const filterTaxonomy = useMemo<ModuleTaxonomy>(() => {
    const present = new Set<string>()
    for (const topic of libraryTopics) for (const tag of topic.tags) present.add(tag)
    const tagsByDimension = new Map<string, Tag[]>()
    for (const [dim, tags] of taxonomy.tagsByDimension) {
      tagsByDimension.set(dim, tags.filter(tag => present.has(tag.id)))
    }
    return { dimensions: taxonomy.dimensions, tagsByDimension, tagsByModule: taxonomy.tagsByModule }
  }, [taxonomy, libraryTopics])

  const hasFacets = useMemo(
    () => filterTaxonomy.dimensions.some(d => (filterTaxonomy.tagsByDimension.get(d.id)?.length ?? 0) > 0),
    [filterTaxonomy],
  )

  const onToggleTag = useCallback((dimensionId: string, tagId: string) => {
    setActiveFilters(prev => {
      const next = new Map([...prev].map(([k, v]) => [k, new Set(v)] as [string, Set<string>]))
      const set = next.get(dimensionId) ?? new Set<string>()
      if (set.has(tagId)) set.delete(tagId)
      else set.add(tagId)
      next.set(dimensionId, set)
      return next
    })
  }, [])

  const onResetFilters = useCallback(() => setActiveFilters(new Map()), [])

  const groups = useMemo(() => {
    const tokens = tokenizeSearch(search)
    const matches = (topic: LibraryTopic): boolean => {
      if (!moduleMatchesTagFilters(new Set(topic.tags), activeFilters)) return false
      if (tokens.length === 0) return true
      const haystack = `${t(topic.titleKey, { ns: 'psyedu' })} ${t(topic.summaryKey, { ns: 'psyedu' })}`
      return matchesAllTokens(haystack, tokens)
    }
    return themes
      .map(theme => ({ theme, topics: libraryTopics.filter(topic => topic.theme_id === theme.id && matches(topic)) }))
      .filter(group => group.topics.length > 0)
  }, [themes, libraryTopics, search, activeFilters, t])

  const resultCount = useMemo(() => groups.reduce((n, g) => n + g.topics.length, 0), [groups])

  const librarySearch = useMemo(
    () => ({ value: search, onChange: setSearch, placeholder: t('patient.psycho_search_placeholder') }),
    [search, t],
  )

  return (
    <div className={`psycho-card-picker ${mode === 'edit' ? 'psycho-card-picker--edit' : ''}`}>
      <p className="psycho-card-picker__label">
        {mode === 'unlock' ? t('patient.psycho_pick_unlock') : t('patient.psycho_pick_edit')}
      </p>

      {hasFacets ? (
        <ModuleFilterBar
          taxonomy={filterTaxonomy}
          activeFilters={activeFilters}
          onToggleTag={onToggleTag}
          onReset={onResetFilters}
          resultCount={resultCount}
          totalCount={libraryTopics.length}
          search={librarySearch}
        />
      ) : (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('patient.psycho_search_placeholder')}
        />
      )}

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

      <div className="psycho-card-picker__suggest">
        <ThemeSuggestionButton />
      </div>

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
