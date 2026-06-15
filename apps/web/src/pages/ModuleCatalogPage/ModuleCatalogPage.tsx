import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Layout } from '../../components/features/Layout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { ModuleType } from '../../lib/database.types'
import { catalogQueries, useSaveEnabledModules } from '../../hooks/queries'
import { Toggle } from '../../components/ui/Toggle/Toggle'
import { ModuleFilterBar } from '../../components/features/ModuleFilterBar'
import { ModuleTagChips } from '../../components/features/ModuleTagChips'
import { filterCategoriesByTags } from '../../lib/moduleFilter'
import { matchesAllTokens, tokenizeSearch } from '../../lib/search'
import { LUCIDE_ICONS } from '../../lib/lucideIcons'
import { useTagFilters } from '../../hooks/useTagFilters'
import './ModuleCatalogPage.css'

// Référence stable pour le fallback « aucun module coming-soon » (évite de
// recréer un Set à chaque rendu).
const EMPTY_IDS: ReadonlySet<string> = new Set()

export function ModuleCatalogPage() {
  const { t } = useTranslation()
  const { practitioner } = useAuthStore()
  const navigate = useNavigate()

  const categoriesQuery = useQuery(catalogQueries.categories())
  const comingSoonQuery = useQuery(catalogQueries.comingSoonIds())
  const enabledModulesQuery = useQuery(catalogQueries.enabledModules(practitioner?.id))
  const saveMutation = useSaveEnabledModules()

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const comingSoonIds = comingSoonQuery.data ?? EMPTY_IDS
  const loading = !categoriesQuery.isSuccess || !comingSoonQuery.isSuccess || !enabledModulesQuery.isSuccess
  const saving = saveMutation.isPending

  // `enabled` est un état éditable (toggles) amorcé UNE FOIS depuis le serveur :
  // valeur enregistrée, ou tous les modules par défaut si aucun réglage existant.
  const [enabled, setEnabled] = useState<Set<ModuleType>>(new Set())
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    if (!enabledModulesQuery.isSuccess || !categoriesQuery.isSuccess) return
    const allModuleIds = categories.flatMap(c => c.modules).map(m => m.id)
    setEnabled(enabledModulesQuery.data ?? new Set(allModuleIds))
    seededRef.current = true
  }, [enabledModulesQuery.isSuccess, enabledModulesQuery.data, categoriesQuery.isSuccess, categories])

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { taxonomy, activeFilters, toggleTag, resetFilters } = useTagFilters()

  const totalCount = useMemo(() => categories.reduce((n, c) => n + c.modules.length, 0), [categories])

  // Filtrage en deux temps : facettes (tags) puis recherche texte.
  const filteredCategories = useMemo(() => {
    const byTags = filterCategoriesByTags(categories, taxonomy.tagsByModule, activeFilters)
    const tokens = tokenizeSearch(searchQuery)
    if (tokens.length === 0) return byTags
    return byTags
      .map(cat => ({
        ...cat,
        modules: cat.modules.filter(mod => {
          const haystack = `${t(`modules.${mod.id}.label`)} ${t(`modules.${mod.id}.description`)}`
          return matchesAllTokens(haystack, tokens)
        }),
      }))
      .filter(cat => cat.modules.length > 0)
  }, [categories, taxonomy, activeFilters, searchQuery, t])

  const resultCount = useMemo(() => filteredCategories.reduce((n, c) => n + c.modules.length, 0), [filteredCategories])

  const catalogSearch = useMemo(
    () => ({ value: searchQuery, onChange: setSearchQuery, placeholder: t('modules.search_placeholder') }),
    [searchQuery, t],
  )

  const toggleModule = useCallback((moduleType: ModuleType) => {
    setSaveSuccess(false)
    setEnabled(prev => {
      const next = new Set(prev)
      if (next.has(moduleType)) { next.delete(moduleType) } else { next.add(moduleType) }
      return next
    })
  }, [])

  const enableAll = useCallback(() => {
    setSaveSuccess(false)
    setEnabled(new Set(categories.flatMap(c => c.modules).map(m => m.id)))
  }, [categories])

  const disableAll = useCallback(() => {
    setSaveSuccess(false)
    setEnabled(new Set())
  }, [])

  const save = useCallback(async () => {
    if (!practitioner) return
    setSaveError(null)
    setSaveSuccess(false)

    const { ok } = await saveMutation.mutateAsync({ practitionerId: practitioner.id, enabled })

    if (!ok) {
      setSaveError(t('modules.save_error'))
    } else {
      setSaveSuccess(true)
    }
  }, [practitioner, enabled, t, saveMutation])

  const enabledCount = enabled.size

  return (
    <Layout>
      <div className="catalog-page">
        <div className="catalog-page__header">
          <div className="catalog-page__header-text">
            <h1 className="catalog-page__title">{t('modules.title')}</h1>
            <p className="catalog-page__subtitle">{t('modules.subtitle')}</p>
          </div>
          <div className="catalog-page__header-actions">
            <span className="catalog-page__count">
              {enabledCount === 1
                ? t('modules.enabled_count_one', { count: enabledCount })
                : t('modules.enabled_count_other', { count: enabledCount })}
            </span>
            <Button variant="ghost" size="sm" onClick={enableAll}>
              {t('modules.enable_all')}
            </Button>
            <Button variant="ghost" size="sm" onClick={disableAll}>
              {t('modules.disable_all')}
            </Button>
            <Button size="sm" loading={saving} onClick={save}>
              {t('common.save')}
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="catalog-page__banner catalog-page__banner--success">
            {t('modules.save_success')}
          </div>
        )}
        {saveError && (
          <div className="catalog-page__banner catalog-page__banner--error">
            {saveError}
          </div>
        )}

        {!loading && taxonomy.dimensions.length > 0 && (
          <ModuleFilterBar
            taxonomy={taxonomy}
            activeFilters={activeFilters}
            onToggleTag={toggleTag}
            onReset={resetFilters}
            resultCount={resultCount}
            totalCount={totalCount}
            search={catalogSearch}
          />
        )}

        {loading ? (
          <div className="catalog-page__loading">{t('common.loading')}</div>
        ) : filteredCategories.length === 0 ? (
          <div className="catalog-page__empty">
            {searchQuery ? t('modules.empty_search') : t('modules.empty_filter')}
          </div>
        ) : (
          <div className="catalog-sections">
            {filteredCategories.map(category => (
              <section key={category.id} className="catalog-section">
                <div className="catalog-section__header">
                  <h2 className="catalog-section__title">
                    {LUCIDE_ICONS[category.icon] && React.createElement(LUCIDE_ICONS[category.icon], { size: 18, className: 'catalog-section__icon' })}
                    {t(category.labelKey)}
                  </h2>
                </div>

                <div className="catalog-grid">
                  {category.modules.map(mod => {
                    const isEnabled = enabled.has(mod.id)
                    const isComingSoon = comingSoonIds.has(mod.id)
                    const IconComponent = LUCIDE_ICONS[mod.icon]
                    return (
                      <Card
                        key={mod.id}
                        className={isComingSoon ? 'catalog-card--coming-soon' : (!isEnabled ? 'catalog-card--disabled' : '')}
                        header={{
                          icon: IconComponent ? <IconComponent size={16} /> : undefined,
                          title: t(`modules.${mod.id}.label`),
                          subtitle: t(`modules.${mod.id}.description`),
                          right: isComingSoon ? undefined : (
                            <button
                              className="catalog-card__toggle-btn"
                              onClick={() => toggleModule(mod.id)}
                              aria-pressed={isEnabled}
                              type="button"
                            >
                              <Toggle checked={isEnabled} />
                            </button>
                          ),
                        }}
                        actions={!isComingSoon ? (
                          <Button
                            variant="outline"
                            size="xs"
                            icon={<Eye size={12} />}
                            onClick={() => navigate(`/modules/preview/${mod.id}`)}
                            title={t('patient.patient_view')}
                          >
                            {t('patient.preview_button')}
                          </Button>
                        ) : undefined}
                      >
                        {isComingSoon ? (
                          <span className="catalog-card__soon-badge">{t('patient.realtime_soon')}</span>
                        ) : null}
                        <ModuleTagChips tagIds={taxonomy.tagsByModule.get(mod.id)} taxonomy={taxonomy} />
                      </Card>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="catalog-page__footer">
          <Button loading={saving} onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Layout>
  )
}
