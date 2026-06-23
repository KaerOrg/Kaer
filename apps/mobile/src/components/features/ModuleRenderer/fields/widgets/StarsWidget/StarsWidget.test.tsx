import React from 'react'
import { render } from '@testing-library/react-native'
import { StarsWidget } from './StarsWidget'

// MaterialCommunityIcons rendu en élément hôte unique (sinon le composite expo
// double chaque nœud) — chaque icône expose name/size/color directement.
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

describe('StarsWidget', () => {
  it("rend le bon nombre d'icônes étoiles (5)", () => {
    const { UNSAFE_getAllByProps } = render(<StarsWidget count={5} />)
    expect(UNSAFE_getAllByProps({ size: 14 })).toHaveLength(5)
  })

  it('rend le bon nombre pour count=3', () => {
    const { UNSAFE_getAllByProps } = render(<StarsWidget count={3} />)
    expect(UNSAFE_getAllByProps({ size: 14 })).toHaveLength(3)
  })

  it('count=5 → 3 étoiles pleines, 2 vides', () => {
    const { UNSAFE_getAllByProps } = render(<StarsWidget count={5} />)
    // ceil(5/2)=3 remplies, 2 vides
    expect(UNSAFE_getAllByProps({ name: 'star' })).toHaveLength(3)
    expect(UNSAFE_getAllByProps({ name: 'star-outline' })).toHaveLength(2)
  })

  it('count=4 → 2 étoiles pleines, 2 vides', () => {
    const { UNSAFE_getAllByProps } = render(<StarsWidget count={4} />)
    // ceil(4/2)=2 remplies, 2 vides
    expect(UNSAFE_getAllByProps({ name: 'star' })).toHaveLength(2)
    expect(UNSAFE_getAllByProps({ name: 'star-outline' })).toHaveLength(2)
  })
})
