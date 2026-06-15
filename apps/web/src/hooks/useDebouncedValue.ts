import { useEffect, useState } from 'react'

/**
 * Renvoie `value` seulement après `delay` ms sans nouveau changement. Sert à limiter
 * les effets coûteux déclenchés par une saisie — typiquement un refetch côté serveur
 * (recherche). Tant que l'utilisateur tape, la valeur débouncée ne bouge pas.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
