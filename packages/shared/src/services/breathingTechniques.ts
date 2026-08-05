// Lecture des techniques de respiration déclarées en base, partagée web ≡ mobile.
//
// La définition d'une technique (couleur, durée recommandée, séquence de phases) vit
// dans `module_content_fields` / `field_props` (config-first, issue #69), jamais dans
// un tableau TypeScript. Ce module en fait la lecture, sans I/O : l'appelant fournit
// les fields déjà chargés.
//
// ⚠️ Le service mobile porte encore sa propre copie de cette lecture
// (`breathingService.techniquesFromFields`). Elle est identique et devra pointer ici
// une fois la pile mobile de l'epic #195 mergée : la dupliquer aujourd'hui éviterait
// un conflit sur six PR ouvertes, la supprimer ensuite est un geste d'une ligne.

export type BreathingPhaseType = 'inhale' | 'hold_in' | 'exhale' | 'hold_out'

export interface BreathingPhaseSpec {
  type: BreathingPhaseType
  seconds: number
}

/** Niveau de preuve d'une technique, tel que déclaré en config. */
export type EvidenceGrade = 'A' | 'B' | 'C'

export interface BreathingTechniqueSpec {
  key: string
  color: string
  recommendedDurationMin: number
  phases: BreathingPhaseSpec[]
  /** Grade de preuve, ou `null` s'il n'est pas déclaré. */
  evidenceGrade: EvidenceGrade | null
  /**
   * Clé i18n précisant le périmètre du grade quand il ne vaut que pour une
   * indication (pleine conscience : grade A sur la rechute dépressive, pas au-delà).
   */
  evidenceScopeCode: string | null
}

const EVIDENCE_GRADES: readonly EvidenceGrade[] = ['A', 'B', 'C']

function toEvidenceGrade(value: string | undefined): EvidenceGrade | null {
  return value != null && (EVIDENCE_GRADES as readonly string[]).includes(value)
    ? (value as EvidenceGrade)
    : null
}

/** Contrat minimal d'un field, satisfait par `ContentField` des deux apps. */
interface FieldLike {
  readonly field_type: string
  readonly sort_order: number
  readonly props: Record<string, string>
  readonly children: readonly FieldLike[]
}

const PHASE_TYPES: readonly BreathingPhaseType[] = ['inhale', 'hold_in', 'exhale', 'hold_out']

function toPhaseType(value: string): BreathingPhaseType | null {
  return (PHASE_TYPES as readonly string[]).includes(value) ? (value as BreathingPhaseType) : null
}

/**
 * Techniques déclarées par les fields, dans l'ordre de la config, phases triées.
 *
 * Une phase au type inconnu ou à la durée non numérique est écartée : mieux vaut un
 * rythme incomplet qu'un `NaN` qui casserait l'animation côté patient.
 */
export function readBreathingTechniques(fields: readonly FieldLike[]): BreathingTechniqueSpec[] {
  const techniques: BreathingTechniqueSpec[] = []

  for (const field of fields) {
    if (field.field_type !== 'breathing_technique') continue
    const key = field.props.technique_key
    if (!key) continue

    const phases: BreathingPhaseSpec[] = []
    const ordered = [...field.children].sort((a, b) => a.sort_order - b.sort_order)
    for (const child of ordered) {
      if (child.field_type !== 'breathing_phase') continue
      const type = toPhaseType(child.props.phase_type ?? '')
      const seconds = Number(child.props.phase_seconds)
      if (type == null || !Number.isFinite(seconds) || seconds <= 0) continue
      phases.push({ type, seconds })
    }

    techniques.push({
      key,
      color: field.props.color ?? '',
      recommendedDurationMin: Number(field.props.recommended_duration_min) || 0,
      phases,
      evidenceGrade: toEvidenceGrade(field.props.evidence_grade),
      evidenceScopeCode: field.props.evidence_scope ?? null,
    })
  }

  return techniques
}

/** Rythme compact d'une technique (« 4s · 7s »), purement numérique. */
export function formatRhythm(phases: readonly BreathingPhaseSpec[]): string {
  return phases.map(phase => `${phase.seconds}s`).join(' · ')
}
