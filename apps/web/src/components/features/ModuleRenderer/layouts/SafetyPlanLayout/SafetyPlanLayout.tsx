import { LifeBuoy, Settings } from 'lucide-react'
import type { ContentField } from '@services/moduleService'
import { ExerciseSafetyField } from '../../fields/ExerciseSafetyField'
import { CrisisAnchorsWidget } from '../../fields/CrisisAnchorsWidget'
import { StepsLayout } from '../StepsLayout'
import './SafetyPlanLayout.css'

interface Props {
  /** Étapes du plan, regroupées par `section_id`. */
  sections: Map<string, ContentField[]>
  /** Fields hors section (boutons d'urgence, ancres). */
  unsectioned: ContentField[]
  /** Module courant — sert à dériver les clés i18n (jamais de clé en dur). */
  moduleId: string | undefined
  t: (key: string) => string
}

/**
 * Aperçu praticien de la vue de consultation « Je suis en crise » (motif `safety_plan`).
 * Reflète l'écran patient mobile : numéros d'urgence en tête, plan de sécurité (6 étapes),
 * « Mes raisons de tenir ». Les réponses saisies par le patient sont privées (stockées sur
 * son téléphone) — le web affiche la structure + un rappel, comme pour les photos d'ancrage.
 */
export function SafetyPlanLayout({ sections, unsectioned, moduleId, t }: Props) {
  const lbl = (key: string) => t(`modules.${moduleId ?? 'crisis_plan'}.${key}`)
  const emergencyFields = [...unsectioned]
    .filter(f => f.field_type === 'exercise_safety')
    .sort((a, b) => a.sort_order - b.sort_order)
  const hasAnchors = unsectioned.some(f => f.field_type === 'crisis_anchors_preview')

  return (
    <div className="safety-plan">
      <div className="safety-plan__header">
        <div className="safety-plan__title-wrap">
          <LifeBuoy size={18} className="safety-plan__title-icon" />
          <span className="safety-plan__title">{lbl('consultation_title')}</span>
        </div>
        <Settings size={18} className="safety-plan__gear" aria-hidden="true" />
      </div>

      {emergencyFields.length > 0 && (
        <div className="safety-plan__calls">
          {emergencyFields.map(f => <ExerciseSafetyField key={f.id} field={f} />)}
        </div>
      )}

      <StepsLayout sections={sections} footer={undefined} t={t} />
      <p className="safety-plan__private-note">{lbl('step_private_note')}</p>

      {hasAnchors && <CrisisAnchorsWidget />}
    </div>
  )
}
