import React from 'react'
import { render } from '@testing-library/react-native'
import { TextareaWidget } from './TextareaWidget'

describe('TextareaWidget', () => {
  it('se rend sans erreur', () => {
    expect(() => render(<TextareaWidget />)).not.toThrow()
  })
})
