// Mock minimal de expo-constants pour les tests jest-expo.
// Sans ça, `import Constants from 'expo-constants'` déclenche
// `Cannot read properties of undefined (reading 'EXDevLauncher')`
// car expo-modules-core tente de charger les modules natifs.

export const ExecutionEnvironment = {
  Bare: 'bare',
  Standalone: 'standalone',
  StoreClient: 'storeClient',
} as const

const Constants = {
  executionEnvironment: ExecutionEnvironment.Standalone,
  expoConfig: {} as Record<string, unknown>,
  manifest: {} as Record<string, unknown>,
}

export default Constants
