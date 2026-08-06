// Mock Jest d'`expo-keep-awake` : le module natif n'existe pas sous Node. Le mock est
// une fonction espionnable, pour vérifier que la Séquence pose bien le verrou de veille.
export const useKeepAwake = jest.fn()
export const activateKeepAwakeAsync = jest.fn(async () => undefined)
export const deactivateKeepAwake = jest.fn(async () => undefined)
