import React from 'react'
import { render } from '@testing-library/react-native'
import { TextWidget } from './TextWidget'

describe('TextWidget', () => {
  it('se rend sans erreur', () => {
    expect(() => render(<TextWidget />)).not.toThrow()
  })
})
