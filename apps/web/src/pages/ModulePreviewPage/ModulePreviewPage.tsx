import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Layout } from '../components/features/Layout'
import { ModulePreviewPanel } from '../components/features/ModulePreviewPanel'
import { fetchModulePreviewKind, type PreviewKind } from '../services/moduleService'
import './ModulePreviewPage.css'

export function ModulePreviewPage() {
  const { t } = useTranslation()
  const { moduleType } = useParams<{ moduleType: string }>()
  const navigate = useNavigate()
  const [previewKind, setPreviewKind] = useState<PreviewKind | null>(null)

  useEffect(() => {
    if (!moduleType) return
    fetchModulePreviewKind(moduleType).then(setPreviewKind)
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
          <h1 className="preview-page__title">{t(`modules.${moduleType}.label`)}</h1>
          <p className="preview-page__desc">{t(`modules.${moduleType}.description`)}</p>
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
