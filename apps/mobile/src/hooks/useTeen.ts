import { useAuthStore } from '../store/authStore'
import {
  TEEN_MODULE_TEXTS,
  TEEN_GLOBAL,
  teenColorFor,
  type BilingualText,
} from '../theme/teen'

interface UseTeenReturn {
  // true si le mode ado est actif pour ce patient
  isTeenMode: boolean
  // Retourne le texte adapté (ado ou adulte) pour un module donné
  // ex: tt('crisis_plan', 'intro') → version ado si isTeenMode, adulte sinon
  tt: (moduleKey: string, textKey: string) => string
  // Retourne le texte adapté pour les textes globaux (HomeScreen, navigation…)
  tg: (textKey: string) => string
  // Retourne la couleur vive du module en mode ado, undefined sinon
  teenColor: (moduleType: string) => string | undefined
}

function resolve(entry: BilingualText | undefined, isTeenMode: boolean): string {
  if (!entry) return ''
  return isTeenMode ? entry.teen : entry.adult
}

export function useTeen(): UseTeenReturn {
  const isTeenMode = useAuthStore((s) => s.teenMode)

  const tt = (moduleKey: string, textKey: string): string => {
    return resolve(TEEN_MODULE_TEXTS[moduleKey]?.[textKey], isTeenMode)
  }

  const tg = (textKey: string): string => {
    return resolve(TEEN_GLOBAL[textKey], isTeenMode)
  }

  const teenColor = (moduleType: string): string | undefined => {
    return isTeenMode ? teenColorFor(moduleType) : undefined
  }

  return { isTeenMode, tt, tg, teenColor }
}
