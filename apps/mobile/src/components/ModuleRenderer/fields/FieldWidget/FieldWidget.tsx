import React from 'react'
import {
  TimeWidget, SliderWidget, StarsWidget, BooleanWidget, RadioWidget,
  DateWidget, TextWidget, CheckboxWidget, TextareaWidget, InfoWidget,
} from '../widgets'

interface Props {
  widgetType: string
  detailText?: string
}

export function FieldWidget({ widgetType, detailText }: Props) {
  if (widgetType === 'time')                  return <TimeWidget />
  if (widgetType.startsWith('slider:'))       return <SliderWidget spec={widgetType} />
  if (widgetType.startsWith('stars:'))        return <StarsWidget spec={widgetType} />
  if (widgetType === 'boolean')               return <BooleanWidget />
  if (widgetType.startsWith('radio:'))        return <RadioWidget variant={widgetType.split(':')[1] ?? 'ok'} />
  if (widgetType === 'date')                  return <DateWidget />
  if (widgetType === 'text')                  return <TextWidget />
  if (widgetType === 'checkbox')              return <CheckboxWidget />
  if (widgetType === 'textarea')              return <TextareaWidget />
  if (widgetType === 'info')                  return <InfoWidget text={detailText} />
  return null
}
