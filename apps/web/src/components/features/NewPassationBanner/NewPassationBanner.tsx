import { useTranslation } from 'react-i18next'
import { Inbox } from 'lucide-react'
import { Banner } from '@ui/Banner'

export interface NewPassationBannerProps {
  /** Nombre de passations arrivées depuis la dernière consultation. `0` = rien à dire. */
  readonly count: number
  /** Ouvre l'onglet des échelles. */
  readonly onOpen: () => void
  readonly onDismiss: () => void
}

/**
 * Bandeau « nouvelle passation » (#423, QW-6).
 *
 * Le praticien dit « remplissez-le maintenant » et voit arriver la passation **sans
 * recharger**. Agréable, non bloquant.
 *
 * **MDR** : un badge neutre est un FAIT, pas une interprétation. Il annonce qu'une
 * passation est arrivée, jamais ce qu'elle contient : aucun score, aucun adjectif,
 * aucune couleur d'alerte. Son déclencheur est l'arrivée d'une saisie, quel qu'en soit
 * le contenu, et le service temps réel n'expose même pas les réponses.
 *
 * Aucun courriel n'est émis : cela créerait une attente de réactivité que personne ne
 * s'est engagé à tenir.
 */
export function NewPassationBanner({ count, onOpen, onDismiss }: NewPassationBannerProps) {
  const { t } = useTranslation()

  if (count <= 0) return null

  return (
    <Banner
      variant="info"
      icon={<Inbox size={16} />}
      action={{ label: t('scales.realtime.open'), onClick: onOpen }}
      onDismiss={onDismiss}
      dismissLabel={t('common.close')}
    >
      {t('scales.realtime.new_passation', { count })}
    </Banner>
  )
}
