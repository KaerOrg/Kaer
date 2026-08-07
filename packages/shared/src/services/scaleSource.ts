/**
 * Mentions de source d'un instrument clinique (#417, Q-13).
 *
 * Trois mentions coexistent autour d'une échelle, et il ne faut pas les confondre :
 *
 *   1. `instrument_citation`     : CITATION DES AUTEURS. C'est une **obligation**,
 *      condition de la licence (« PHQ-9, Kroenke, Spitzer & Williams, 2001 »).
 *   2. `translation_attribution` : attribution de la TRADUCTION, imposée par le
 *      traducteur quand il y en a un. **Nullable** : une traduction produite par Kær
 *      n'a aucun tiers à attribuer.
 *   3. `reference_label`         : recommandation clinique (« NICE NG222 »). C'est un
 *      ARGUMENT, aucune obligation. Il ne vit **pas** ici : l'empiler avec la citation
 *      donnerait à la mention légale un air d'argument commercial, et enverrait
 *      l'argument de crédibilité en petits caractères où personne ne le lit.
 *
 * Ce module ne porte que les mentions 1 et 2, celles qu'on affiche parce qu'on y est
 * TENU. Elles sont lues depuis `scale_meta`, jamais codées dans un écran : chaque
 * échelle a sa propre formule, et coder une formule en dur est exactement ce qui a
 * fait tomber deux échelles à l'audit des droits.
 */

/** Champ de contenu tel que rendu par `fetchModuleFields`. Contrat minimal. */
interface SourceField {
  field_type: string
  props: Record<string, string>
}

export interface ScaleSource {
  /** Citation des auteurs. Chaîne vide si l'échelle n'en déclare pas. */
  citation: string
  /**
   * Attribution de la traduction, ou `null` s'il n'y a aucun tiers à attribuer.
   * `null` est le cas NOMINAL, pas un cas dégradé : la plupart des échelles n'ont
   * pas de traduction sous licence.
   */
  translationAttribution: string | null
}

/**
 * Lit les mentions de source dans les fields d'un module.
 *
 * Une valeur absente ou vide est traitée comme absente : une chaîne vide en base ne
 * doit pas produire une ligne vide à l'écran.
 */
export function readScaleSource(fields: readonly SourceField[] | null | undefined): ScaleSource {
  const props = fields?.find(f => f.field_type === 'scale_meta')?.props
  const citation = props?.['instrument_citation']?.trim() ?? ''
  const attribution = props?.['translation_attribution']?.trim() ?? ''
  return {
    citation,
    translationAttribution: attribution.length > 0 ? attribution : null,
  }
}
