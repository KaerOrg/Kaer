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
  /**
   * Recommandation clinique (`scale_meta.reference_label`), ex. « NICE NG222 ».
   *
   * C'est un ARGUMENT de crédibilité, jamais une obligation de licence : il répond à
   * « pourquoi devrais-je faire confiance à ce questionnaire ? », et il a donc sa
   * place ici, au moment où le praticien choisit. La citation des auteurs, elle, est
   * une obligation et vit dans `SourceCitation`, en pied des écrans qui montrent les
   * items. Les empiler abîmerait les deux (#417).
   *
   * Absent ou vide : aucune ligne rendue.
   */
  referenceLabel?: string
}

export function ScaleMetaBadges({
  scaleId, evaluationType, category, chipsOnly = false, referenceLabel,
}: Props) {
  const { t } = useTranslation()
  const reference = referenceLabel?.trim() ?? ''

  return (
    <>
      {chipsOnly ? null : <p className="scale-meta__desc">{t(`scales.descriptions.${scaleId}`)}</p>}
      {chipsOnly || reference.length === 0 ? null : (
        <p className="scale-meta__reference">{reference}</p>
      )}
      <div className="scale-meta__chips">
        <ScaleEvalBadge evaluationType={evaluationType} />
        <span className="scale-meta__category-chip">{t(`scales.category.${CATEGORY_KEY[category]}`)}</span>
      </div>
    </>
  )
}
