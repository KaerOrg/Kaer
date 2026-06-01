import type { ContentField } from '../../../../../services/moduleService'
import { DimensionTrackerLayout } from '../DimensionTrackerLayout'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Aperçu praticien du Thermomètre de l'humeur — coquille du tracker générique
// multi-dimensions (cf. DimensionTrackerLayout). Couleur d'accent : orange mood.
export function MoodTrackerLayout({ fields, footer, t }: Props) {
  return (
    <DimensionTrackerLayout
      fields={fields}
      footer={footer}
      t={t}
      moduleId="mood_tracker"
      accent="#F97316"
    />
  )
}
