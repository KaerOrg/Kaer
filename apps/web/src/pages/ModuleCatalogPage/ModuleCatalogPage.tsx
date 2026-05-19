import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Layout } from '../../components/features/Layout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { ModuleType } from '../../lib/database.types'
import { fetchModuleCategories, fetchComingSoonModuleIds, type ModuleCategory } from '../../services/moduleCatalogService'
import { fetchEnabledModules, saveEnabledModules } from '../../services/practitionerSettingsService'
import { Toggle } from '../../components/ui/Toggle/Toggle'
import { SearchInput } from '../../components/ui/SearchInput'
import { matchesAllTokens, tokenizeSearch } from '../../lib/search'
import { LUCIDE_ICONS } from '../../lib/lucideIcons'
import './ModuleCatalogPage.css'

export function ModuleCatalogPage() {
  const { t } = useTranslation()
  const { practitioner } = useAuthStore()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<ModuleCategory[]>([])
  const [enabled, setEnabled] = useState<Set<ModuleType>>(new Set())
  const [comingSoonIds, setComingSoonIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = useMemo(() => {
    const tokens = tokenizeSearch(searchQuery)
    if (tokens.length === 0) return categories
    return categories
      .map(cat => ({
        ...cat,
        modules: cat.modules.filter(mod => {
          const haystack = `${t(`modules.${mod.id}.label`)} ${t(`modules.${mod.id}.description`)}`
          return matchesAllTokens(haystack, tokens)
        }),
      }))
      .filter(cat => cat.modules.length > 0)
  }, [categories, searchQuery, t])

  const loadSettings = useCallback(async () => {
    if (!practitioner) return
    const [cats, savedEnabled, comingSoon] = await Promise.all([
      fetchModuleCategories(),
      fetchEnabledModules(practitioner.id),
      fetchComingSoonModuleIds(),
    ])
    setCategories(cats)
    const allModuleIds = cats.flatMap(c => c.modules).map(m => m.id)
    setEnabled(savedEnabled ?? new Set(allModuleIds))
    setComingSoonIds(comingSoon)
    setLoading(false)
  }, [practitioner])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

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
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    const { ok } = await saveEnabledModules(practitioner.id, enabled)

    if (!ok) {
      setSaveError(t('modules.save_error'))
    } else {
      setSaveSuccess(true)
    }
    setSaving(false)
  }, [practitioner, enabled, t])

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

        {!loading && (
          <div className="catalog-page__search">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('modules.search_placeholder')}
            />
          </div>
        )}

        {loading ? (
          <div className="catalog-page__loading">{t('common.loading')}</div>
        ) : filteredCategories.length === 0 ? (
          <div className="catalog-page__empty">{t('modules.empty_search')}</div>
        ) : (
          <div className="catalog-sections">
            {filteredCategories.map(category => (
              <section key={category.id} className="catalog-section">
                <div className="catalog-section__header">
                  <h2 className="catalog-section__title">
                    {LUCIDE_ICONS[category.icon] && React.createElement(LUCIDE_ICONS[category.icon], { size: 18, className: 'catalog-section__icon' })}
                    {t(category.labelKey)}
                  </h2>
                  {t(category.subtitleKey) && (
                    <span className="catalog-section__subtitle">{t(category.subtitleKey)}</span>
                  )}
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
                          <button
                            className="preview-toggle-btn"
                            onClick={() => navigate(`/modules/preview/${mod.id}`)}
                            title={t('patient.patient_view')}
                          >
                            <Eye size={12} />
                            {t('patient.preview_button')}
                          </button>
                        ) : undefined}
                      >
                        {isComingSoon ? (
                          <span className="catalog-card__soon-badge">{t('patient.realtime_soon')}</span>
                        ) : null}
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
