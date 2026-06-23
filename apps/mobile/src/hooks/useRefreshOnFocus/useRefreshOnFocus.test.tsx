import React from 'react'
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { useRefreshOnFocus } from './useRefreshOnFocus'

// useFocusEffect exécute son callback immédiatement au montage (simulant le focus).
// On capture chaque exécution via la ref interne du helper.
let focusCallback: (() => void) | null = null
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => {
    focusCallback = cb
    cb()
  },
}))

function Probe({ refetch }: { refetch: () => void }) {
  useRefreshOnFocus(refetch)
  return <Text>probe</Text>
}

describe('useRefreshOnFocus', () => {
  beforeEach(() => {
    focusCallback = null
  })

  it('ne refetch pas au premier focus (montage initial)', () => {
    const refetch = jest.fn()
    render(<Probe refetch={refetch} />)
    expect(refetch).not.toHaveBeenCalled()
  })

  it('refetch aux focus suivants', () => {
    const refetch = jest.fn()
    render(<Probe refetch={refetch} />)
    // Simule un retour de focus ultérieur
    focusCallback?.()
    focusCallback?.()
    expect(refetch).toHaveBeenCalledTimes(2)
  })
})
