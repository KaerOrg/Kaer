import { Pill, Plus } from 'lucide-react'
import { buildExampleMeds } from './previewExamples'

interface Props {
  moduleId: string
  t: (key: string) => string
  lbl: (key: string) => string
}

// Volet « Mes médicaments » de l'aperçu : liste fond/PRN co-éditée patient↔praticien.
export function PreviewMedsPanel({ moduleId, t, lbl }: Props) {
  const meds = buildExampleMeds(moduleId, t, lbl)
  return (
    <div className="mt-prev">
      <span className="mt-prev-block__label">
        <Pill size={13} className="mt-prev-block__icon" />
        {lbl('meds_title')}
      </span>

      {meds.map(med => (
        <div key={med.name} className="mt-prev-mol">
          <div className="mt-prev-mol__main">
            <span className="mt-prev-mol__name">{med.name}</span>
            {med.poso ? <span className="mt-prev-mol__poso">{med.poso}</span> : null}
          </div>
          <span className={`mt-prev-mol__kind${med.prn ? ' mt-prev-mol__kind--prn' : ''}`}>{med.kindLabel}</span>
        </div>
      ))}

      <span className="preview-chip preview-chip--action">
        <Plus size={14} />
        {lbl('meds_add_label')}
      </span>
    </div>
  )
}
