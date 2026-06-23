import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { FieldWidget } from './FieldWidget'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

describe('FieldWidget', () => {
  it('time → TimeWidget affiche 22:00', () => {
    render(<FieldWidget props={{ widget_type: 'time' }} />)
    expect(screen.getByText('22:00')).toBeTruthy()
  })

  it('slider (min/max props frères) → SliderWidget affiche la valeur médiane 5', () => {
    render(<FieldWidget props={{ widget_type: 'slider', slider_min: '0', slider_max: '10' }} />)
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('slider avec unité → SliderWidget affiche "60 min"', () => {
    render(<FieldWidget props={{ widget_type: 'slider', slider_min: '0', slider_max: '120', slider_unit: 'min' }} />)
    expect(screen.getByText('60 min')).toBeTruthy()
  })

  it('stars (stars_count=4) → StarsWidget affiche 4 icônes', () => {
    const { UNSAFE_getAllByProps } = render(<FieldWidget props={{ widget_type: 'stars', stars_count: '4' }} />)
    expect(UNSAFE_getAllByProps({ size: 14 })).toHaveLength(4)
  })

  it('boolean → BooleanWidget affiche Oui et Non', () => {
    render(<FieldWidget props={{ widget_type: 'boolean' }} />)
    expect(screen.getByText('Oui')).toBeTruthy()
    expect(screen.getByText('Non')).toBeTruthy()
  })

  it('radio (radio_variant=ok) → RadioWidget affiche "Pris"', () => {
    render(<FieldWidget props={{ widget_type: 'radio', radio_variant: 'ok' }} />)
    expect(screen.getByText('Pris')).toBeTruthy()
  })

  it('radio (radio_variant=miss) → RadioWidget affiche "Non pris"', () => {
    render(<FieldWidget props={{ widget_type: 'radio', radio_variant: 'miss' }} />)
    expect(screen.getByText('Non pris')).toBeTruthy()
  })

  it('date → DateWidget affiche le placeholder', () => {
    render(<FieldWidget props={{ widget_type: 'date' }} />)
    expect(screen.getByText('jj/mm/aaaa')).toBeTruthy()
  })

  it('checkbox → CheckboxWidget affiche "Non accompli"', () => {
    render(<FieldWidget props={{ widget_type: 'checkbox' }} />)
    expect(screen.getByText('Non accompli')).toBeTruthy()
  })

  it('info avec detailText → InfoWidget affiche le texte', () => {
    render(<FieldWidget props={{ widget_type: 'info' }} detailText="une note" />)
    expect(screen.getByText('une note')).toBeTruthy()
  })

  it('info sans detailText → InfoWidget vide', () => {
    render(<FieldWidget props={{ widget_type: 'info' }} />)
    expect(screen.queryByText(/.+/)).toBeNull()
  })

  it('widget_type inconnu → null', () => {
    const { toJSON } = render(<FieldWidget props={{ widget_type: 'widget_inconnu' }} />)
    expect(toJSON()).toBeNull()
  })
})
