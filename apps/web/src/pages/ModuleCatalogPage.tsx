import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  Shield, Handshake, Zap, Pill, ClipboardList, BookOpen,
  Moon, Apple, Clock, Smile, Target, Activity, Brain, Search,
  Leaf, Waves, Thermometer, TrendingUp, Wind, RefreshCw, BookMarked, Scale,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import type { ModuleType } from '../lib/database.types'
import { fetchModuleCategories, fetchComingSoonModuleIds, type ModuleCategory } from '../lib/moduleCategories'
import { Toggle } from '../components/Toggle/Toggle'
import './ModuleCatalogPage.css'

// Bridge architectural : mappe les noms d'icônes stockés en BDD vers les composants Lucide.
const LUCIDE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  shield:        Shield,
  handshake:     Handshake,
  zap:           Zap,
  pill:          Pill,
  'clipboard-list': ClipboardList,
  'book-open':   BookOpen,
  moon:          Moon,
  apple:         Apple,
  clock:         Clock,
  smile:         Smile,
  target:        Target,
  activity:      Activity,
  brain:         Brain,
  search:        Search,
  leaf:          Leaf,
  waves:         Waves,
  thermometer:   Thermometer,
  'trending-up': TrendingUp,
  wind:          Wind,
  'refresh-cw':  RefreshCw,
  bookmark:      BookMarked,
  scale:         Scale,
}

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

  const loadSettings = useCallback(async () => {
    if (!practitioner) return
    const [cats, { data }, comingSoon] = await Promise.all([
      fetchModuleCategories(),
      supabase
        .from('practitioner_module_settings')
        .select('enabled_modules')
        .eq('practitioner_id', practitioner.id)
        .maybeSingle(),
      fetchComingSoonModuleIds(),
    ])
    setCategories(cats)
    const allModuleIds = cats.flatMap(c => c.modules).map(m => m.id)
    setEnabled(data ? new Set(data.enabled_modules as ModuleType[]) : new Set(allModuleIds))
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

    const { error } = await supabase
      .from('practitioner_module_settings')
      .upsert(
        { practitioner_id: practitioner.id, enabled_modules: [...enabled], updated_at: new Date().toISOString() },
        { onConflict: 'practitioner_id' },
      )

    if (error) {
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

        {loading ? (
          <div className="catalog-page__loading">{t('common.loading')}</div>
        ) : (
          <div className="catalog-sections">
            {categories.map(category => (
              <section key={category.id} className="catalog-section">
                <div className="catalog-section__header">
                  <h2 className="catalog-section__title">{t(category.labelKey)}</h2>
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
                      <div
                        key={mod.id}
                        className={`catalog-card ${isComingSoon ? 'catalog-card--coming-soon' : (isEnabled ? 'catalog-card--enabled' : 'catalog-card--disabled')}`}
                      >
                        <div className="catalog-card__body">
                          <div className="catalog-card__top">
                            <span className="catalog-card__name-row">
                              {IconComponent && <IconComponent size={16} className="catalog-card__icon" />}
                              <span className="catalog-card__name">{t(`modules.${mod.id}.label`)}</span>
                            </span>
                          </div>
                          <p className="catalog-card__desc">{t(`modules.${mod.id}.description`)}</p>
                        </div>
                        <div className="catalog-card__footer">
                          {isComingSoon ? (
                            <span className="catalog-card__soon-badge">{t('patient.realtime_soon')}</span>
                          ) : (
                            <>
                              <button
                                className="preview-toggle-btn"
                                onClick={() => navigate(`/modules/preview/${mod.id}`)}
                                title={t('patient.patient_view')}
                              >
                                <Eye size={12} />
                                {t('patient.preview_button')}
                              </button>
                              <button
                                className="catalog-card__toggle-btn"
                                onClick={() => toggleModule(mod.id)}
                                aria-pressed={isEnabled}
                                type="button"
                              >
                                <Toggle checked={isEnabled} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
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
