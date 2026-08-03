import React from 'react'
import { render } from '@testing-library/react-native'
import { SummaryStat } from './SummaryStat'

describe('SummaryStat', () => {
  it('affiche la valeur brute et ce qu’elle compte', () => {
    const { getByText } = render(<SummaryStat value="5:00" label="durée" />)
    expect(getByText('5:00')).toBeTruthy()
    expect(getByText('durée')).toBeTruthy()
  })

  it('affiche une valeur nulle sans la commenter', () => {
    const { getByText, queryByText } = render(<SummaryStat value="0" label="cycles" testID="st" />)
    expect(getByText('0')).toBeTruthy()
    expect(queryByText(/aucun|jamais|pas de/i)).toBeNull()
  })
})
