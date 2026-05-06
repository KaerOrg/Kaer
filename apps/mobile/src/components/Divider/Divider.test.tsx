import React from 'react'
import { render } from '@testing-library/react-native'
import { Divider } from './Divider'

describe('Divider', () => {
  it('se rend sans erreur', () => {
    const { toJSON } = render(<Divider />)
    expect(toJSON()).toBeTruthy()
  })

  it('se rend avec inset', () => {
    const { toJSON } = render(<Divider inset={16} />)
    expect(toJSON()).toBeTruthy()
  })
})
