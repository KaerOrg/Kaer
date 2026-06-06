import { useTranslation } from 'react-i18next'
import { AGE_BADGE_CONFIG, CATEGORY_KEY, type ScaleCategory, type TargetAge } from '../../../services/scaleService'
import './ScaleMetaBadges.css'

type Props = {
  scaleId: string
  evaluationType: 'auto' | 'hetero'
  category: ScaleCategory
  targetAges: readonly TargetAge[]
}

export function ScaleMetaBadges({ scaleId, evaluationType, category, targetAges }: Props) {
  const { t } = useTranslation()

  return (
    <>
      <p className="scale-meta__desc">{t(`scales.descriptions.${scaleId}`)}</p>
      <div className="scale-meta__chips">
        <span className={`scale-meta__eval-badge scale-meta__eval-badge--${evaluationType}`}>
          {evaluationType === 'auto' ? t('scales.eval_auto') : t('scales.eval_hetero')}
        </span>
        <span className="scale-meta__category-chip">{t(`scales.category.${CATEGORY_KEY[category]}`)}</span>
        {targetAges.map(age => (
          <span
            key={age}
            className="scale-meta__age-chip"
            style={{ background: AGE_BADGE_CONFIG[age].bg, color: AGE_BADGE_CONFIG[age].text }}
          >
            {t(`scales.age.${age}`)}
          </span>
        ))}
      </div>
    </>
  )
}
