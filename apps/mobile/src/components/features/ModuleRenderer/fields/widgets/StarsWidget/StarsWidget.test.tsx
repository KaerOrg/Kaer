import React from 'react'
import { render } from '@testing-library/react-native'
import { StarsWidget } from './StarsWidget'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

describe('StarsWidget', () => {
  it("rend le bon nombre d'icônes étoiles (5)", () => {
    const { UNSAFE_getAllByProps } = render(<StarsWidget spec="stars:5" />)
    const stars = UNSAFE_getAllByProps({ size: 14 })
    expect(stars).toHaveLength(5)
  })

  it('rend le bon nombre pour stars:3', () => {
    const { UNSAFE_getAllByProps } = render(<StarsWidget spec="stars:3" />)
    expect(UNSAFE_getAllByProps({ size: 14 })).toHaveLength(3)
  })

  it('stars:5 → 3 étoiles pleines, 2 vides', () => {
    const { UNSAFE_getAllByProps } = render(<StarsWidget spec="stars:5" />)
    // ceil(5/2)=3 remplies, 2 vides
    expect(UNSAFE_getAllByProps({ name: 'star' })).toHaveLength(3)
    expect(UNSAFE_getAllByProps({ name: 'star-outline' })).toHaveLength(2)
  })

  it('stars:4 → 2 étoiles pleines, 2 vides', () => {
    const { UNSAFE_getAllByProps } = render(<StarsWidget spec="stars:4" />)
    // ceil(4/2)=2 remplies, 2 vides
    expect(UNSAFE_getAllByProps({ name: 'star' })).toHaveLength(2)
    expect(UNSAFE_getAllByProps({ name: 'star-outline' })).toHaveLength(2)
  })
})
