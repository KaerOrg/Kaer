import { useTranslation } from 'react-i18next'
import { colors } from '@theme'
import { useTeen } from '../useTeen'
import { SCALE_SCORING, type ScaleScoringConfig } from '../../lib/scaleScoring'

export interface UseScaleScreenResult {
  /** Config de scoring du module (`undefined` si l'`scale_id` est inconnu). */
  config: ScaleScoringConfig | undefined
  /** Couleur d'accent du mode ado (`undefined` hors mode ado). */
  accentColor: string | undefined
  /** Couleur effective à utiliser : accent ado, sinon `colors.primary`. */
  activeColor: string
  isTeenMode: boolean
  t: ReturnType<typeof useTranslation>['t']
  i18n: ReturnType<typeof useTranslation>['i18n']
}

/**
 * Amorçage partagé des écrans « échelle clinique » (ScaleHistory / ScaleEntry).
 * Centralise la résolution du mode ado, de la traduction (namespace teen/common),
 * de la couleur d'accent et de la config de scoring — blocs jusque-là dupliqués
 * à l'identique dans les deux écrans.
 */
export function useScaleScreen(scaleId: string): UseScaleScreenResult {
  const { isTeenMode, teenColor } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const accentColor = teenColor(scaleId)

  return {
    config: SCALE_SCORING[scaleId],
    accentColor,
    activeColor: accentColor ?? colors.primary,
    isTeenMode,
    t,
    i18n,
  }
}
