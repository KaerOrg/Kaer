import type { ModuleSource, ModuleSourceType } from '@kaer/shared'

// Regroupement des sources d'un module par NIVEAU DE PREUVE.
//
// L'ordre en base (`sort_order`) est un ordre de rédaction : il mélange les avis
// d'experts et les essais. Le praticien, lui, lit d'abord ce qui pèse le plus lourd.
// Les groupes dérivent donc de `source_type`, jamais d'un champ nouveau : les six
// valeurs de `ModuleSourceType` sont réparties ici, et rien d'autre n'existe.

export type EvidenceGroupId = 'reviews' | 'trials' | 'mechanism'

/** Les groupes, du niveau de preuve le plus élevé au plus bas. */
export const EVIDENCE_GROUPS: readonly EvidenceGroupId[] = ['reviews', 'trials', 'mechanism']

const GROUP_BY_TYPE: Record<ModuleSourceType, EvidenceGroupId> = {
  meta_analysis:     'reviews',
  systematic_review: 'reviews',
  guideline:         'reviews',
  rct:               'trials',
  cohort_study:      'trials',
  expert_opinion:    'mechanism',
}

export interface EvidenceGroup {
  readonly id: EvidenceGroupId
  readonly sources: readonly ModuleSource[]
}

/**
 * Groupe les sources par niveau de preuve, dans l'ordre `EVIDENCE_GROUPS`. Les
 * groupes vides sont omis ; à l'intérieur d'un groupe, l'ordre de la base est
 * conservé (`sort_order`, déjà appliqué par le service).
 */
export function groupSourcesByEvidence(sources: readonly ModuleSource[]): EvidenceGroup[] {
  const byGroup = new Map<EvidenceGroupId, ModuleSource[]>()
  for (const source of sources) {
    const group = GROUP_BY_TYPE[source.source_type]
    const list = byGroup.get(group)
    if (list) list.push(source)
    else byGroup.set(group, [source])
  }
  return EVIDENCE_GROUPS
    .filter(id => byGroup.has(id))
    .map(id => ({ id, sources: byGroup.get(id) ?? [] }))
}
