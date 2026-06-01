import type { ContentField } from '../../../../../services/moduleService'
import { DimensionTrackerLayout } from '../DimensionTrackerLayout'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Aperçu praticien du Suivi des effets indésirables — coquille du tracker générique
// multi-dimensions (cf. DimensionTrackerLayout). Mêmes mécaniques que mood_tracker,
// contenu = effets indésirables (échelle 0–10, base à 0, sans repère central).
export function MedicationSideEffectsLayout({ fields, footer, t }: Props) {
  return (
    <DimensionTrackerLayout
      fields={fields}
      footer={footer}
      t={t}
      moduleId="medication_side_effects"
      accent="#8B5CF6"
    />
  )
}
