import { useTranslation } from 'react-i18next'
import { CATEGORY_KEY, type ScaleCategory } from '@services/scaleService'
import { ScaleEvalBadge } from '../ScaleEvalBadge'
import './ScaleMetaBadges.css'

type Props = {
  scaleId: string
  evaluationType: 'auto' | 'hetero'
  category: ScaleCategory
  /**
   * N'affiche que les puces (badge éval + catégorie), sans la ligne de description.
   * Pour les contextes denses où la description vit ailleurs (cellule « Indications »
   * du tableau des échelles). Par défaut `false` : la description est rendue.
   */
  chipsOnly?: boolean
}

export function ScaleMetaBadges({ scaleId, evaluationType, category, chipsOnly = false }: Props) {
  const { t } = useTranslation()

  return (
    <>
      {chipsOnly ? null : <p className="scale-meta__desc">{t(`scales.descriptions.${scaleId}`)}</p>}
      <div className="scale-meta__chips">
        <ScaleEvalBadge evaluationType={evaluationType} />
        <span className="scale-meta__category-chip">{t(`scales.category.${CATEGORY_KEY[category]}`)}</span>
      </div>
    </>
  )
}
