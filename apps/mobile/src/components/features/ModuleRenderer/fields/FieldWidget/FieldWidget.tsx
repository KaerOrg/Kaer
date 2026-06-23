import React from 'react'
import {
  TimeWidget, SliderWidget, StarsWidget, BooleanWidget, RadioWidget,
  DateWidget, TextWidget, CheckboxWidget, TextareaWidget, InfoWidget,
} from '../widgets'

interface Props {
  // Props atomiques du champ : `widget_type` porte le *kind* (slider, stars…) ;
  // les paramètres sont des props frères (slider_min, slider_max, slider_unit,
  // stars_count, radio_variant). Plus aucun packing `kind:param:param`.
  props: Record<string, string>
  detailText?: string
}

export function FieldWidget({ props, detailText }: Props) {
  const kind = props['widget_type']
  if (kind === 'time')     return <TimeWidget />
  if (kind === 'slider')   return (
    <SliderWidget
      min={Number(props['slider_min'] ?? 0)}
      max={Number(props['slider_max'] ?? 10)}
      unit={props['slider_unit']}
    />
  )
  if (kind === 'stars')    return <StarsWidget count={Number(props['stars_count'] ?? 5)} />
  if (kind === 'boolean')  return <BooleanWidget />
  if (kind === 'radio')    return <RadioWidget variant={props['radio_variant'] ?? 'ok'} />
  if (kind === 'date')     return <DateWidget />
  if (kind === 'text')     return <TextWidget />
  if (kind === 'checkbox') return <CheckboxWidget />
  if (kind === 'textarea') return <TextareaWidget />
  if (kind === 'info')     return <InfoWidget text={detailText} />
  return null
}
