import React from 'react'
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { useRefreshOnFocus } from './useRefreshOnFocus'

// useFocusEffect exécute son callback immédiatement au montage (simulant le focus).
// On capture chaque exécution via la ref interne du helper.
let focusCallback: (() => void) | null = null
// Reproduit le contrat de react-navigation : le callback n'est ré-exécuté que si
// son identité change (comparaison par référence, comme les deps d'un effect).
let mockLastCallback: (() => void) | null = null
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => {
    focusCallback = cb
    if (cb !== mockLastCallback) {
      mockLastCallback = cb
      cb()
    }
  },
}))

function Probe({ refetch }: { refetch: () => void }) {
  useRefreshOnFocus(refetch)
  return <Text>probe</Text>
}

describe('useRefreshOnFocus', () => {
  beforeEach(() => {
    focusCallback = null
    mockLastCallback = null
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

  it('ne reboucle pas quand l appelant recrée son callback à chaque rendu', () => {
    const refetch = jest.fn()
    const { rerender } = render(<Probe refetch={() => refetch()} />)
    // Chaque rendu fournit une NOUVELLE fonction : le callback de focus doit rester
    // stable, sinon react-navigation le rejoue et déclenche une boucle de refetch.
    rerender(<Probe refetch={() => refetch()} />)
    rerender(<Probe refetch={() => refetch()} />)
    expect(refetch).not.toHaveBeenCalled()
  })

  it('appelle toujours la derniere version du callback', () => {
    const first = jest.fn()
    const second = jest.fn()
    const { rerender } = render(<Probe refetch={first} />)
    rerender(<Probe refetch={second} />)
    focusCallback?.()
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
