import { useTranslation } from 'react-i18next'

interface Props {
  caption: string
  pleasure: number | null
  mastery: number | null
}

// Ligne de scores bruts « P n · M n » d'une activité (attendus ou ressentis).
// Rien n'est rendu si les deux valeurs sont absentes : « non renseigné » est un
// état légitime, pas un zéro. Valeurs brutes, aucune interprétation (MDR).
export function BAScoreLine({ caption, pleasure, mastery }: Props) {
  const { t } = useTranslation()
  if (pleasure == null && mastery == null) return null
  const parts: string[] = []
  if (pleasure != null) parts.push(`${t('evolution.ba_pleasure_short')} ${pleasure}`)
  if (mastery != null) parts.push(`${t('evolution.ba_mastery_short')} ${mastery}`)
  return (
    <p className="ba-week__scores">
      <span className="ba-week__scores-caption">{caption}</span> {parts.join(' · ')}
    </p>
  )
}
