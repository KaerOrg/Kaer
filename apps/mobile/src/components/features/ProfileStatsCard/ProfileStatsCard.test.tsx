import React from 'react'
import { render } from '@testing-library/react-native'
import { ProfileStatsCard } from './ProfileStatsCard'

describe('ProfileStatsCard', () => {
  it('affiche chaque chiffre et son libellé', () => {
    const { getByText } = render(
      <ProfileStatsCard
        stats={[
          { value: '28', label: 'jours de suivi' },
          { value: '3', label: 'modules actifs' },
          { value: '8', label: 'séances' },
        ]}
      />,
    )
    expect(getByText('28')).toBeTruthy()
    expect(getByText('jours de suivi')).toBeTruthy()
    expect(getByText('3')).toBeTruthy()
    expect(getByText('modules actifs')).toBeTruthy()
    expect(getByText('8')).toBeTruthy()
    expect(getByText('séances')).toBeTruthy()
  })

  it('accepte deux colonnes', () => {
    const { getByText, queryByText } = render(
      <ProfileStatsCard stats={[{ value: '5', label: 'a' }, { value: '9', label: 'b' }]} />,
    )
    expect(getByText('5')).toBeTruthy()
    expect(getByText('9')).toBeTruthy()
    expect(queryByText('séances')).toBeNull()
  })
})
