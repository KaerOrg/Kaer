import { useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'

// Re-déclenche un refetch TanStack Query quand un écran reprend le focus, SAUF au
// premier focus (le montage initial est déjà couvert par la query elle-même).
//
// Pourquoi : les écrans d'une stack React Navigation ne se démontent pas en
// changeant d'onglet — `refetchOnMount` ne se redéclenche donc pas. Ce helper
// rétablit le comportement « les données se rafraîchissent quand je reviens sur
// l'écran » sans casser la déduplication apportée par `staleTime`.
export function useRefreshOnFocus(refetch: () => void): void {
  const firstTimeRef = useRef(true)

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false
        return
      }
      refetch()
    }, [refetch]),
  )
}
