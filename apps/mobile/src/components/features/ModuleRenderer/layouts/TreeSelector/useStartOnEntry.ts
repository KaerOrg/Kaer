import { useMemo } from 'react'
import { useRoute } from '@react-navigation/native'
import type { TreeSelectorStartRequest } from '@ui/TreeSelector'

// Le module a-t-il été ouvert POUR SAISIR, plutôt que pour relire ?
//
// Un tap sur un rappel pose `startEntry` sur la route (#257). Sans lui, le patient
// atterrit sur l'historique et doit encore lancer une saisie : trois gestes pour
// noter une émotion qui en dure dix secondes.
//
// Le `token` est figé au montage : rouvrir l'écran repart de l'historique, et un
// re-rendu ne relance pas le flux en pleine saisie.

interface RouteWithStart {
  params?: { startEntry?: boolean }
}

export function useStartOnEntry(): TreeSelectorStartRequest | null {
  const route = useRoute() as RouteWithStart
  const startEntry = route.params?.startEntry === true
  return useMemo(() => (startEntry ? { token: 1 } : null), [startEntry])
}
