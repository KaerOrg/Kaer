/**
 * Techniques de respiration validées pour Kær.
 *
 * Sources cliniques :
 *   - Cohérence cardiaque   : Lehrer & Gevirtz (2014), Applied Psychophysiology : Grade B
 *   - Respiration diaphragmatique : HAS thérapies non médicamenteuses, Conrad et al. (2007) : Grade B
 *   - Respiration carrée    : VA/DoD PTSD Guidelines, gestion du stress aigu : Grade C / accord experts
 *   - 4-7-8                 : accord experts endormissement / crise anxieuse : Grade C
 *   - Pleine conscience     : MBSR Kabat-Zinn (1990), MBCT Segal et al. (2002) : Grade A rechute dépressive
 *
 * Conformité MDR 2017/745 : guide à rythme fixe, pas de biofeedback, aucune interprétation algorithmique.
 */

export type PhaseType = 'inhale' | 'hold_in' | 'exhale' | 'hold_out'

export interface BreathingPhase {
  type: PhaseType
  label: string
  seconds: number
}

export interface BreathingTechnique {
  key: string
  name: string
  subtitle: string
  description: string
  evidence: string
  color: string
  recommended_duration_min: number
  phases: BreathingPhase[]
}

export const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    key: 'coherence_cardiaque',
    name: 'Cohérence cardiaque',
    subtitle: '6 respirations par minute',
    description:
      'Régule le système nerveux autonome en synchronisant le rythme respiratoire avec la variabilité de la fréquence cardiaque (HRV). Recommandée pour l\'anxiété, le stress chronique et la dépression.',
    evidence: 'Grade B : Lehrer & Gevirtz (2014)',
    color: '#4F46E5',
    recommended_duration_min: 5,
    phases: [
      { type: 'inhale', label: 'Inspirez', seconds: 5 },
      { type: 'exhale', label: 'Expirez', seconds: 5 },
    ],
  },
  {
    key: 'diaphragmatique',
    name: 'Respiration diaphragmatique',
    subtitle: 'Inspiration abdominale lente',
    description:
      'Active le système parasympathique. Base de la plupart des thérapies comportementales. Recommandée par la HAS dans les thérapies non médicamenteuses de l\'anxiété et de la douleur chronique.',
    evidence: 'Grade B : HAS, Conrad et al. (2007)',
    color: '#059669',
    recommended_duration_min: 5,
    phases: [
      { type: 'inhale', label: 'Inspirez par le ventre', seconds: 4 },
      { type: 'exhale', label: 'Expirez lentement', seconds: 7 },
    ],
  },
  {
    key: 'carree',
    name: 'Respiration carrée',
    subtitle: 'Box Breathing : 4-4-4-4',
    description:
      'Technique symétrique utilisée dans la gestion du stress aigu et des symptômes de PTSD. Équilibre les phases d\'inspiration, rétention, expiration et pause. Incluse dans les guidelines VA/DoD.',
    evidence: 'Grade C / accord experts : VA/DoD PTSD Guidelines',
    color: '#D97706',
    recommended_duration_min: 4,
    phases: [
      { type: 'inhale', label: 'Inspirez', seconds: 4 },
      { type: 'hold_in', label: 'Retenez', seconds: 4 },
      { type: 'exhale', label: 'Expirez', seconds: 4 },
      { type: 'hold_out', label: 'Pause', seconds: 4 },
    ],
  },
  {
    key: 'quatre_sept_huit',
    name: 'Technique 4-7-8',
    subtitle: 'Pour l\'endormissement et la crise anxieuse',
    description:
      'Inspiration courte, rétention prolongée, expiration longue. Particulièrement efficace pour faciliter l\'endormissement et couper une montée d\'anxiété aiguë. Accord d\'experts international.',
    evidence: 'Grade C : accord experts international',
    color: '#9333EA',
    recommended_duration_min: 3,
    phases: [
      { type: 'inhale', label: 'Inspirez', seconds: 4 },
      { type: 'hold_in', label: 'Retenez', seconds: 7 },
      { type: 'exhale', label: 'Expirez', seconds: 8 },
    ],
  },
  {
    key: 'pleine_conscience',
    name: 'Pleine conscience respiratoire',
    subtitle: 'Mindfulness : MBSR / MBCT',
    description:
      'Observer sa respiration sans la contrôler. Ancrage dans le moment présent, réduction des ruminations. Composante centrale du MBSR (Kabat-Zinn, 1990) et de la MBCT (Segal et al., 2002), recommandée par NICE pour la prévention des rechutes dépressives.',
    evidence: 'Grade A rechute dépressive : NICE CG90, MBCT Segal et al. (2002)',
    color: '#0EA5E9',
    recommended_duration_min: 10,
    phases: [
      { type: 'inhale', label: 'Observez l\'inspiration', seconds: 4 },
      { type: 'hold_in', label: 'Présence au sommet', seconds: 1 },
      { type: 'exhale', label: 'Observez l\'expiration', seconds: 6 },
      { type: 'hold_out', label: 'Présence au creux', seconds: 1 },
    ],
  },
]

export function getTechnique(key: string): BreathingTechnique | undefined {
  return BREATHING_TECHNIQUES.find((t) => t.key === key)
}

/** Durée totale d'un cycle en secondes */
export function getCycleDuration(technique: BreathingTechnique): number {
  return technique.phases.reduce((acc, p) => acc + p.seconds, 0)
}
