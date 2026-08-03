import { useTranslation } from 'react-i18next'
import './ScaleEvalBadge.css'

type Props = {
  evaluationType: 'auto' | 'hetero'
}

/**
 * Badge **Auto** (bleu, auto-évaluation) / **Hétéro** (vert, hétéro-évaluation) d'une
 * échelle. Le badge décrit le **type de passation** (administratif), jamais une gravité
 * clinique (MDR). Réutilisé par `ScaleMetaBadges` et le tableau des échelles (nom, K-4).
 */
export function ScaleEvalBadge({ evaluationType }: Props) {
  const { t } = useTranslation()
  return (
    <span className={`scale-eval-badge scale-eval-badge--${evaluationType}`}>
      {evaluationType === 'auto' ? t('scales.eval_auto') : t('scales.eval_hetero')}
    </span>
  )
}
