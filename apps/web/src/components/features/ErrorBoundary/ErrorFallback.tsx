import { useTranslation } from 'react-i18next'
import { EmptyState } from '@ui/EmptyState'

export function ErrorFallback() {
  const { t } = useTranslation()

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <EmptyState
        title={t('common.error_generic')}
        description={t('common.error_boundary_description')}
        action={{ label: t('common.reload'), onClick: () => window.location.reload() }}
      />
    </div>
  )
}
