import './SourceCitation.css'

export interface SourceCitationProps {
  /** Citation des auteurs de l'instrument. Rien n'est rendu si elle est vide. */
  citation: string
  /**
   * Attribution de la traduction, ou `null` s'il n'y a aucun tiers à attribuer.
   * `null` est le cas nominal : aucune ligne, aucun séparateur, aucun espace parasite.
   */
  translationAttribution?: string | null
}

/**
 * Mention de source d'un instrument clinique (#417, Q-13).
 *
 * **C'est une obligation de licence, pas un ornement.** Elle doit être rendue partout
 * où les items de l'instrument sont montrés à un humain. Elle vivait jusqu'ici
 * accrochée à d'autres contenus (le pied d'une fiche, une note sur l'item 9) : il
 * suffisait d'y déplacer ou d'y reformuler un bloc, geste anodin en apparence, pour
 * que la citation disparaisse sans que personne ne s'en aperçoive. Une obligation
 * contractuelle ne doit pas dépendre d'un élément qui existe pour une autre raison.
 *
 * Ne porte **que** les mentions dues : la recommandation clinique (`reference_label`)
 * est un argument de crédibilité et vit ailleurs, au moment du choix du praticien.
 *
 * Rendu sobre et sans emphase : on l'affiche parce qu'on y est tenu.
 */
export function SourceCitation({ citation, translationAttribution = null }: SourceCitationProps) {
  const trimmed = citation.trim()
  if (trimmed.length === 0) return null

  return (
    <p className="source-citation" data-testid="source-citation">
      <span>{trimmed}</span>
      {translationAttribution != null ? (
        <span className="source-citation__translation">{translationAttribution}</span>
      ) : null}
    </p>
  )
}
