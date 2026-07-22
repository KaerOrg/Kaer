import { useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'

// Re-déclenche un refetch TanStack Query quand un écran reprend le focus, SAUF au
// premier focus (le montage initial est déjà couvert par la query elle-même).
//
// Pourquoi : les écrans d'une stack React Navigation ne se démontent pas en
// changeant d'onglet — `refetchOnMount` ne se redéclenche donc pas. Ce helper
// rétablit le comportement « les données se rafraîchissent quand je reviens sur
// l'écran » sans casser la déduplication apportée par `staleTime`.
// Le callback passé à `useFocusEffect` doit rester STABLE : react-navigation le
// ré-exécute à chaque changement d'identité, écran focalisé compris. Un appelant
// qui passe une fonction recréée à chaque rendu (ex. `useCallback` dépendant de
// l'objet query) provoquerait sinon une boucle refetch -> rendu -> refetch, visible
// à l'écran comme un indicateur de chargement permanent. On passe donc par une ref.
export function useRefreshOnFocus(refetch: () => void): void {
  const firstTimeRef = useRef(true)
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false
        return
      }
      refetchRef.current()
    }, []),
  )
}
