import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { TEEN_DEFAULT_COLOR } from '@theme'

interface UseTeenReturn {
  isTeenMode: boolean
  tt: (moduleKey: string, textKey: string) => string
  tg: (textKey: string) => string
  teenColor: (moduleType: string) => string | undefined
}

export function useTeen(): UseTeenReturn {
  const isTeenMode = useAuthStore((s) => s.teenMode)
  const moduleColors = useAuthStore((s) => s.moduleColors)
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')

  return {
    isTeenMode,
    tt: (moduleKey, textKey) => t(`modules.${moduleKey}.${textKey}`),
    tg: (textKey) => t(`global.${textKey}`),
    teenColor: (moduleType) => isTeenMode ? (moduleColors[moduleType] ?? TEEN_DEFAULT_COLOR) : undefined,
  }
}
