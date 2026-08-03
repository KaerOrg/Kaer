// Mock d'expo-keep-awake : le module natif n'existe pas sous jest-expo, et l'écran
// de session l'appelle au montage. Le hook devient un no-op, le verrou d'écran
// n'ayant aucun sens en test.

export function useKeepAwake(): void {}

export async function activateKeepAwakeAsync(): Promise<void> {}

export function deactivateKeepAwake(): void {}
