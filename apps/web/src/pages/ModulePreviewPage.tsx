import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Layout } from '../components/Layout'
import { ModulePreviewPanel } from '../components/ModulePreviewPanel'
import { supabase } from '../lib/supabase'
import './ModulePreviewPage.css'

export function ModulePreviewPage() {
  const { t } = useTranslation()
  const { moduleType } = useParams<{ moduleType: string }>()
  const navigate = useNavigate()
  const [previewKind, setPreviewKind] = useState<string | null>(null)

  useEffect(() => {
    if (!moduleType) return
    supabase
      .from('modules')
      .select('preview_kind')
      .eq('id', moduleType)
      .single()
      .then(({ data }) => setPreviewKind(data?.preview_kind ?? 'coming_soon'))
  }, [moduleType])

  if (!moduleType) return null

  return (
    <Layout>
      <div className="preview-page">
        <button className="preview-page__back" onClick={() => navigate('/modules')}>
          <ArrowLeft size={14} />
          {t('modules.nav_link')}
        </button>

        <div className="preview-page__meta">
          <h1 className="preview-page__title">{t(`module.${moduleType}.label`)}</h1>
          <p className="preview-page__desc">{t(`module.${moduleType}.description`)}</p>
        </div>

        {previewKind === null && (
          <div className="preview-page__loading">{t('common.loading')}</div>
        )}

        {previewKind === 'coming_soon' && (
          <div className="preview-page__coming-soon">{t('patient.coming_soon')}</div>
        )}

        {previewKind !== null && previewKind !== 'coming_soon' && (
          <ModulePreviewPanel moduleType={moduleType} />
        )}
      </div>
    </Layout>
  )
}
