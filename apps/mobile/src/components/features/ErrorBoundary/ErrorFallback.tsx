import { useTranslation } from 'react-i18next'
import { EmptyState } from '@ui/EmptyState'

interface ErrorFallbackProps {
  onRetry: () => void
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation()

  return (
    <EmptyState
      title={t('common.error')}
      description={t('common.error_boundary_description')}
      action={{ label: t('common.retry'), onPress: onRetry }}
    />
  )
}
