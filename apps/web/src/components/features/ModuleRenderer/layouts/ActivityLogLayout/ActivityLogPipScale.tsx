import { RatingSelector } from '@ui/RatingSelector'

const PIP_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface Props {
  label: string
  sublabel?: string
  value: number
}

// Échelle à pips statique de l'aperçu activity_log (valeur mock, non interactive).
export function ActivityLogPipScale({ label, sublabel, value }: Props) {
  if (!label) return null
  return (
    <RatingSelector
      variant="track"
      label={label}
      sublabel={sublabel}
      value={value}
      steps={PIP_STEPS}
      valueSuffix="/10"
    />
  )
}
