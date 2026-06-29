import React from 'react'
import { TextWidget, InfoWidget } from '../widgets'

interface Props {
  // Props atomiques du champ : `widget_type` porte le *kind*. Seuls `text` et
  // `info` sont rendus : le layout `fields` n'est plus utilisé que par
  // `breathing_techniques` (info ×5 + text ×1). Les autres kinds (slider, stars,
  // radio, boolean, date, checkbox, textarea, time) n'étaient plus atteignables
  // depuis aucun module et ont été supprimés (issue #87).
  props: Record<string, string>
  detailText?: string
}

export function FieldWidget({ props, detailText }: Props) {
  const kind = props['widget_type']
  if (kind === 'text') return <TextWidget />
  if (kind === 'info') return <InfoWidget text={detailText} />
  return null
}
