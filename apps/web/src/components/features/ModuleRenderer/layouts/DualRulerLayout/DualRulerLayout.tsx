import { Button } from '@ui/Button'
import { RatingSelector } from '@ui/RatingSelector'

// Aperçu praticien (« Vue patient ») du motif `dual_ruler` : deux échelles 0-10
// (importance / confiance) + justifications + engagement. Statique avec valeurs
// d'exemple ; les vraies saisies patient sont servies par l'onglet « Données ».
// Libellés dérivés du moduleId. MDR : valeurs brutes, aucun seuil ni couleur de
// gravité.
const RULER_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const SAMPLE_IMPORTANCE = 7
const SAMPLE_CONFIDENCE = 5

interface Props {
  moduleId: string
  t: (key: string) => string
}

export function DualRulerLayout({ moduleId, t }: Props) {
  const lbl = (key: string): string => t(`modules.${moduleId}.${key}`)

  return (
    <div className="mb-preview">
      <span className="mb-preview__title">{lbl('rulers_title')}</span>

      <div className="mb-field">
        <span className="mb-field__label">{lbl('rulers_behavior_label')}</span>
        <div className="mb-input" data-placeholder={lbl('rulers_behavior_placeholder')} />
      </div>

      <div className="mb-card">
        <RatingSelector
          variant="numbered"
          label={lbl('rulers_importance')}
          sublabel={lbl('rulers_importance_q')}
          value={SAMPLE_IMPORTANCE}
          steps={RULER_STEPS}
          valueSuffix="/10"
        />
      </div>

      <div className="mb-card">
        <RatingSelector
          variant="numbered"
          label={lbl('rulers_confidence')}
          sublabel={lbl('rulers_confidence_q')}
          value={SAMPLE_CONFIDENCE}
          steps={RULER_STEPS}
          valueSuffix="/10"
        />
      </div>

      <div className="mb-field">
        <span className="mb-field__label">{lbl('rulers_commitment_label')}</span>
        <div className="mb-textarea" data-placeholder={lbl('rulers_commitment_placeholder')} />
      </div>

      <Button type="button" variant="primary" fullWidth disabled>
        {lbl('rulers_save')}
      </Button>
    </div>
  )
}
