import { useCallback, useMemo, useState } from 'react'
import type { ContentField } from '@services/moduleService'
import { PREVIEW_STEPS } from './exposureMock'
import { ExposureLadderView } from './ExposureLadderView'
import { ExposureStepDetailView } from './ExposureStepDetailView'
import { ExposureFormView } from './ExposureFormView'

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

type View =
  | { kind: 'ladder' }
  | { kind: 'detail'; stepId: string }
  | { kind: 'exposure'; stepId: string }

/**
 * Aperçu praticien du Thermomètre de la peur (preview_kind `exposure_tracker`).
 * Mirroir interactif du parcours d'exposition unifié mobile : échelle de la peur →
 * détail (courbe de désensibilisation + historique) → formulaire d'exposition enrichi.
 *
 * Données MOCK déterministes (jamais de vraies données patient — conformité MDR).
 * Libellés résolus en i18n (`modules.fear_thermometer.*`) ; les stratégies de coping
 * proviennent des `exposure_tracker_strategy` de la config (data-first).
 */
export function ExposureTrackerLayout({ fields, t }: Props) {
  const [view, setView] = useState<View>({ kind: 'ladder' })

  const moduleId = useMemo(() => fields[0]?.module_id ?? 'fear_thermometer', [fields])
  const lbl = useCallback((key: string) => t(`modules.${moduleId}.${key}`), [t, moduleId])

  const strategies = useMemo(
    () => fields
      .filter(f => f.field_type === 'exposure_tracker_strategy')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(f => (f.text_code ? t(f.text_code) : ''))
      .filter(Boolean),
    [fields, t],
  )

  if (view.kind === 'detail') {
    const step = PREVIEW_STEPS.find(s => s.id === view.stepId)
    if (step) {
      return (
        <ExposureStepDetailView
          step={step}
          lbl={lbl}
          strategyLabel={strategies[0]}
          onBack={() => setView({ kind: 'ladder' })}
          onDoExposure={() => setView({ kind: 'exposure', stepId: step.id })}
        />
      )
    }
  }

  if (view.kind === 'exposure') {
    const step = PREVIEW_STEPS.find(s => s.id === view.stepId)
    if (step) {
      return (
        <ExposureFormView
          step={step}
          lbl={lbl}
          strategies={strategies}
          onBack={() => setView({ kind: 'detail', stepId: step.id })}
        />
      )
    }
  }

  return (
    <ExposureLadderView
      steps={PREVIEW_STEPS}
      lbl={lbl}
      onOpenStep={(id) => setView({ kind: 'detail', stepId: id })}
    />
  )
}
