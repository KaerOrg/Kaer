import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Layout } from '../../components/features/Layout'
import { Button } from '../../components/ui/Button'
import { ModulePreviewPanel } from '../../components/features/ModulePreviewPanel'
import { catalogQueries } from '../../hooks/queries'
import './ModulePreviewPage.css'

export function ModulePreviewPage() {
  const { t } = useTranslation()
  const { moduleType } = useParams<{ moduleType: string }>()
  const navigate = useNavigate()
  const previewKind = useQuery(catalogQueries.previewKind(moduleType)).data ?? null

  if (!moduleType) return null

  return (
    <Layout>
      <div className="preview-page">
        <Button variant="ghost" size="sm" className="preview-page__back" onClick={() => navigate('/modules')} icon={<ArrowLeft size={14} />}>
          {t('modules.nav_link')}
        </Button>

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
