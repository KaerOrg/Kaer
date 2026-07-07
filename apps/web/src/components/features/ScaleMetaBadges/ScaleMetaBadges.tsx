import { useTranslation } from 'react-i18next'
import { CATEGORY_KEY, type ScaleCategory } from '@services/scaleService'
import './ScaleMetaBadges.css'

type Props = {
  scaleId: string
  evaluationType: 'auto' | 'hetero'
  category: ScaleCategory
}

export function ScaleMetaBadges({ scaleId, evaluationType, category }: Props) {
  const { t } = useTranslation()

  return (
    <>
      <p className="scale-meta__desc">{t(`scales.descriptions.${scaleId}`)}</p>
      <div className="scale-meta__chips">
        <span className={`scale-meta__eval-badge scale-meta__eval-badge--${evaluationType}`}>
          {evaluationType === 'auto' ? t('scales.eval_auto') : t('scales.eval_hetero')}
        </span>
        <span className="scale-meta__category-chip">{t(`scales.category.${CATEGORY_KEY[category]}`)}</span>
      </div>
    </>
  )
}
