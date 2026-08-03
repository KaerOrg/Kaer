// Sous l'éditeur : le message de soutien, et la mention des ancres (PW-2).
//
// Le message existait déjà et ne change pas de fonction. Ce qui change, c'est sa place :
// il n'est plus le SEUL contenu de l'onglet, et **il ne suffit plus à déclarer le plan
// « personnalisé »**. C'était le problème d'origine du ticket, trois mots ici suffisaient
// à afficher « Plan personnalisé » sur un plan par ailleurs vide.
//
// Un rappel dit où il s'affiche côté patient : à la clôture de la Séquence, sous les
// raisons de tenir.
//
// ── « Ce qui me donne envie de tenir » n'est pas éditable ici ───────────────
//
// Les photos et la phrase d'ancrage restent LOCALES au téléphone : ce sont des contenus
// intimes que le praticien n'a pas à lire. On affiche qu'elles existent, jamais leur
// contenu. C'est la ligne de confidentialité de l'Epic #315, et elle ne se négocie pas
// pour une commodité d'édition.

import { useCallback, useRef } from 'react'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'

interface Props {
  /** Message enregistré, tel que le serveur le rend. Amorce le champ non contrôlé. */
  message: string
  /** Libellés déjà traduits : ce composant ne connaît aucune clé i18n. */
  labels: {
    title: string
    label: string
    placeholder: string
    whereShown: string
    save: string
    anchorsTitle: string
    anchorsNote: string
  }
  saving: boolean
  onSave: (message: string) => void
}

export function SupportMessageSection({ message, labels, saving, onSave }: Props) {
  // Champ non contrôlé : sa valeur ne conditionne rien dans l'UI, elle n'est lue qu'à
  // l'enregistrement. La `key` le fait repartir de la valeur serveur après un rechargement.
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleSave = useCallback(() => onSave(ref.current?.value.trim() ?? ''), [onSave])

  return (
    <section className="plan-editor__support">
      <div className="plan-editor__support-message">
        <p className="plan-editor__section-title">{labels.title}</p>
        <InputField
          key={message}
          ref={ref}
          multiline
          rows={3}
          label={labels.label}
          placeholder={labels.placeholder}
          defaultValue={message}
        />
        <p className="plan-editor__hint">{labels.whereShown}</p>
        <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>{labels.save}</Button>
      </div>

      <div className="plan-editor__anchors">
        <p className="plan-editor__section-title">{labels.anchorsTitle}</p>
        <p className="plan-editor__hint">{labels.anchorsNote}</p>
      </div>
    </section>
  )
}
