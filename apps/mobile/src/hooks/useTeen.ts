import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { teenColorFor } from '../theme/teen'

interface UseTeenReturn {
  isTeenMode: boolean
  tt: (moduleKey: string, textKey: string) => string
  tg: (textKey: string) => string
  teenColor: (moduleType: string) => string | undefined
}

export function useTeen(): UseTeenReturn {
  const isTeenMode = useAuthStore((s) => s.teenMode)
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')

  return {
    isTeenMode,
    tt: (moduleKey, textKey) => t(`modules.${moduleKey}.${textKey}`),
    tg: (textKey) => t(`global.${textKey}`),
    teenColor: (moduleType) => (isTeenMode ? teenColorFor(moduleType) : undefined),
  }
}
