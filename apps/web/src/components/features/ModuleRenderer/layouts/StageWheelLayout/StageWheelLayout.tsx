import { Button } from '@ui/Button'

// Aperçu praticien (« Vue patient ») du motif `stage_wheel` : sélecteur de stade
// (modèle transthéorique de Prochaska, 6 stades). Statique — les vraies données
// patient sont servies par l'onglet « Données ». Libellés dérivés du moduleId
// (`modules.<id>.stage_*`), pour rester réutilisable. MDR : aucune progression
// imposée ni couleur de jugement.
const STAGE_COUNT = 6

interface Props {
  moduleId: string
  t: (key: string) => string
}

export function StageWheelLayout({ moduleId, t }: Props) {
  const lbl = (key: string): string => t(`modules.${moduleId}.${key}`)
  const stages = Array.from({ length: STAGE_COUNT }, (_, i) => i + 1)

  return (
    <div className="mb-preview">
      <span className="mb-preview__title">{lbl('stage_title')}</span>
      <span className="mb-preview__subtitle">{lbl('stage_subtitle')}</span>

      {stages.map(n => (
        <div key={n} className={`mb-stage${n === 1 ? ' mb-stage--active' : ''}`}>
          <span className="mb-stage__dot" />
          <div className="mb-stage__text">
            <span className="mb-stage__name">{lbl(`stage_${n}`)}</span>
            <span className="mb-stage__desc">{lbl(`stage_${n}_desc`)}</span>
          </div>
        </div>
      ))}

      <Button type="button" variant="primary" fullWidth disabled>
        {lbl('rulers_save')}
      </Button>
    </div>
  )
}
