import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { FieldWidget } from './FieldWidget'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

describe('FieldWidget', () => {
  it('time → TimeWidget affiche 22:00', () => {
    render(<FieldWidget widgetType="time" />)
    expect(screen.getByText('22:00')).toBeTruthy()
  })

  it('slider:0:10 → SliderWidget affiche la valeur médiane 5', () => {
    render(<FieldWidget widgetType="slider:0:10" />)
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('slider:0:120:min → SliderWidget affiche "60 min"', () => {
    render(<FieldWidget widgetType="slider:0:120:min" />)
    expect(screen.getByText('60 min')).toBeTruthy()
  })

  it('stars:4 → StarsWidget affiche 4 icônes', () => {
    const { UNSAFE_getAllByProps } = render(<FieldWidget widgetType="stars:4" />)
    expect(UNSAFE_getAllByProps({ size: 14 })).toHaveLength(4)
  })

  it('boolean → BooleanWidget affiche Oui et Non', () => {
    render(<FieldWidget widgetType="boolean" />)
    expect(screen.getByText('Oui')).toBeTruthy()
    expect(screen.getByText('Non')).toBeTruthy()
  })

  it('radio:ok → RadioWidget affiche "Pris"', () => {
    render(<FieldWidget widgetType="radio:ok" />)
    expect(screen.getByText('Pris')).toBeTruthy()
  })

  it('radio:miss → RadioWidget affiche "Non pris"', () => {
    render(<FieldWidget widgetType="radio:miss" />)
    expect(screen.getByText('Non pris')).toBeTruthy()
  })

  it('date → DateWidget affiche le placeholder', () => {
    render(<FieldWidget widgetType="date" />)
    expect(screen.getByText('jj/mm/aaaa')).toBeTruthy()
  })

  it('checkbox → CheckboxWidget affiche "Non accompli"', () => {
    render(<FieldWidget widgetType="checkbox" />)
    expect(screen.getByText('Non accompli')).toBeTruthy()
  })

  it('info avec detailText → InfoWidget affiche le texte', () => {
    render(<FieldWidget widgetType="info" detailText="une note" />)
    expect(screen.getByText('une note')).toBeTruthy()
  })

  it('info sans detailText → InfoWidget vide', () => {
    render(<FieldWidget widgetType="info" />)
    expect(screen.queryByText(/.+/)).toBeNull()
  })

  it('widgetType inconnu → null', () => {
    const { toJSON } = render(<FieldWidget widgetType="widget_inconnu" />)
    expect(toJSON()).toBeNull()
  })
})
