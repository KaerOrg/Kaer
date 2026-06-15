import { ArrowLeft, Pencil, Trash2, Thermometer } from 'lucide-react'
import { Button } from '../../../../ui/Button'
import { peakSeries, type PreviewStep } from './exposureMock'
import { DesensitizationChartPreview } from './DesensitizationChartPreview'
import { SessionCardPreview } from './SessionCardPreview'

interface Props {
  step: PreviewStep
  lbl: (key: string) => string
  /** Libellé de la 1ʳᵉ stratégie (puce sur les cartes de séance). */
  strategyLabel?: string
  onBack: () => void
  onDoExposure: () => void
}

/** Détail d'une marche : courbe de désensibilisation + historique des expositions. */
export function ExposureStepDetailView({ step, lbl, strategyLabel, onBack, onDoExposure }: Props) {
  // Séances de la plus récente à la plus ancienne pour l'affichage en liste.
  const recent = [...step.sessions].reverse()
  return (
    <div className="ej" data-testid="ej-detail">
      <div className="ej-head">
        <Button type="button" variant="ghost" onClick={onBack} aria-label="back" icon={<ArrowLeft size={18} />} />
        <span className="ej-head__title">{lbl(step.labelKey)}</span>
        <Pencil size={16} className="ej-head__action" />
        <Trash2 size={16} className="ej-head__action" />
      </div>

      <div className="ej-chart-card">
        <DesensitizationChartPreview
          points={peakSeries(step)}
          yAxisLabel={lbl('chart_y_axis')}
          xAxisLabel={lbl('chart_x_axis')}
        />
      </div>

      <p className="ej-history-title">{lbl('detail_history_title')}</p>
      {recent.map((s, i) => (
        <SessionCardPreview key={i} session={s} lbl={lbl} strategyLabel={strategyLabel} />
      ))}

      <Button type="button" variant="primary" fullWidth onClick={onDoExposure} icon={<Thermometer size={16} />}>
        {lbl('detail_do_exposure')}
      </Button>
    </div>
  )
}
