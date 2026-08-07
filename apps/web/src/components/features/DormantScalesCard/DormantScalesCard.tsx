import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon } from 'lucide-react'
import { Card } from '@ui/Card'
import type { DormantModule } from '@services/moduleCatalogService'
import type { HiddenReason } from '../../../lib/database.types'
import './DormantScalesCard.css'

/**
 * Ordre d'affichage des motifs. Les droits d'abord : c'est le seul des deux qui
 * dépende de quelqu'un d'autre que nous.
 */
const REASON_ORDER: readonly HiddenReason[] = ['rights', 'beta_scope']

export interface DormantScalesCardProps {
  /** Échelles en veille, avec leur motif. Rien n'est rendu si la liste est vide. */
  readonly items: readonly DormantModule[]
}

/**
 * Zone « En veille, non assignables » (#421, QW-4).
 *
 * **Pourquoi elle existe.** Un praticien qui cherche le GAD-7 et ne trouve rien conclut
 * que le produit est pauvre. Lui dire pourquoi transforme un manque en attente.
 *
 * **Deux motifs, deux libellés, jamais mélangés.** Les droits d'usage en cours de
 * vérification d'un côté, le périmètre de la bêta de l'autre : annoncer une question de
 * licence devant une échelle libre serait faux, et le GAD-7 est libre au même titre que
 * le PHQ-9. C'est `modules.hidden_reason` (#406) qui tranche, jamais une liste écrite ici.
 *
 * **Rien n'est assignable.** Aucun contrôle, aucun toggle, aucun lien : la carte est une
 * liste de noms. Le filtre général `is_hidden` n'est pas relâché pour autant, et la base
 * refuserait l'assignation de toute façon (`trg_guard_hidden_module_assignment`).
 */
export function DormantScalesCard({ items }: DormantScalesCardProps) {
  const { t } = useTranslation()

  const groups = useMemo(
    () => REASON_ORDER
      .map(reason => ({ reason, ids: items.filter(i => i.reason === reason).map(i => i.id) }))
      .filter(group => group.ids.length > 0),
    [items],
  )

  if (groups.length === 0) return null

  return (
    <Card
      header={{ title: t('scales.dormant.title'), icon: <Moon size={16} /> }}
      className="dormant-scales"
    >
      {groups.map(({ reason, ids }) => (
        <section key={reason} className="dormant-scales__group">
          <p className="dormant-scales__names">
            {ids.map(id => t(`modules.${id}.label`)).join(', ')}
          </p>
          <p className="dormant-scales__reason">{t(`scales.dormant.reason_${reason}`)}</p>
        </section>
      ))}
    </Card>
  )
}
