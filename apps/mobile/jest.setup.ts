import type { ReactNode } from 'react'

// Variables d'environnement pour les tests Jest.
// Le client Supabase valide l'URL au moment de createClient() — sans ces
// valeurs, tout test qui importe transitivement `lib/supabase.ts` échoue.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'

// Doublures globales des contextes d'overlay (Toast / ConfirmDialog / ActionSheet).
// - Les hooks renvoient toujours la MÊME instance de jest.fn() (créée dans la
//   factory), pour que les tests puissent réimporter le hook et asserter dessus.
// - showConfirm auto-invoque onConfirm afin que les flux destructifs aillent
//   jusqu'au bout dans les tests, comme si l'utilisateur avait validé.
jest.mock('./src/contexts/ToastContext', () => {
  const showToast = jest.fn()
  return {
    useToast: () => ({ showToast }),
    ToastProvider: ({ children }: { children: ReactNode }) => children,
  }
})

jest.mock('./src/contexts/ConfirmDialogContext', () => {
  const showConfirm = jest.fn((config: { onConfirm?: () => void | Promise<void> }) => {
    void config?.onConfirm?.()
  })
  return {
    useConfirmDialog: () => ({ showConfirm }),
    ConfirmDialogProvider: ({ children }: { children: ReactNode }) => children,
  }
})

jest.mock('./src/contexts/ActionSheetContext', () => {
  const showActionSheet = jest.fn()
  return {
    useActionSheet: () => ({ showActionSheet }),
    ActionSheetProvider: ({ children }: { children: ReactNode }) => children,
  }
})

// Doublure globale du moteur de sync cloud.
// Empêche RemoteSyncService (et sa chaîne d'imports : supabase, authStore,
// syncOutbox) de se charger dans les tests de layouts/screens.
// Les tests unitaires des services de sync surchargent ce mock avec leur propre
// jest.mock() dans leurs fichiers respectifs.
jest.mock('./src/services/sync', () => ({
  RemoteSyncService: {
    getInstance: () => ({
      enqueue: jest.fn().mockResolvedValue(undefined),
      sync: jest.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0 }),
      setConsentEnabled: jest.fn(),
      isConsentEnabled: jest.fn().mockReturnValue(false),
      isSyncing: jest.fn().mockReturnValue(false),
      pendingCount: jest.fn().mockResolvedValue(0),
    }),
    reset: jest.fn(),
    createForTest: jest.fn(),
  },
}))
