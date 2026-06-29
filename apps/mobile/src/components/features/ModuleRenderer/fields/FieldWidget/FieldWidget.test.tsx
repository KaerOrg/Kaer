import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { FieldWidget } from './FieldWidget'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

describe('FieldWidget', () => {
  it('text → TextWidget (champ non éditable, sans texte)', () => {
    const { toJSON } = render(<FieldWidget props={{ widget_type: 'text' }} />)
    expect(toJSON()).not.toBeNull()
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
