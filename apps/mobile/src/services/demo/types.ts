import type { ModuleType } from '@kaer/shared'

/**
 * Préfixe porté par TOUS les local_id fabriqués par le moteur de démo.
 * Invariant de sûreté : la purge cible exactement les local_id préfixés `demo-`,
 * donc aucune donnée réelle (jamais préfixée) ne peut être supprimée par erreur.
 */
export const DEMO_PREFIX = 'demo-'

/**
 * Comptes de test autorisés à fabriquer des données de démo. Fabriquer des
 * données de santé dans un vrai dossier patient serait une faute RGPD/clinique :
 * la génération est donc verrouillée à cette liste, re-vérifiée dans le service
 * (barrière réelle) et pas seulement masquée dans l'UI. Comparaison insensible
 * à la casse et aux espaces.
 */
export const TEST_ACCOUNT_EMAILS: readonly string[] = ['teil.patient@gmail.com']

/** Vrai si l'email appartient à la liste blanche des comptes de test. */
export function isTestAccount(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return TEST_ACCOUNT_EMAILS.some((e) => e.toLowerCase() === normalized)
}

/**
 * Construit un `local_id` de démo à partir d'un suffixe propre au module
 * (ex. `demoLocalId('sleep-2026-07-01')`). Impose le préfixe `demo-` côté
 * écriture, en miroir du filtre de purge : l'invariant de sûreté est ainsi
 * verrouillé des deux côtés, jamais laissé à la discipline de chaque générateur.
 */
export function demoLocalId(suffix: string): string {
  return `${DEMO_PREFIX}${suffix}`
}

/** Contexte d'exécution d'une génération/purge : l'identité qui déclenche l'action. */
export interface DemoContext {
  readonly patientEmail: string | null | undefined
}

/**
 * Contrat « un générateur par ModuleType ». Chaque module fournit son propre
 * générateur, qui écrit ~2 mois d'utilisation réaliste via la couche services
 * RÉELLE du module (donc SQLite + sync outbox → patient_entries, cohérence
 * web ≡ mobile par construction).
 *
 * Le générateur n'expose que ses **accès données** (module-spécifiques par
 * nature) — l'algorithme de purge (filtre `demo-`) vit une seule fois dans
 * l'infra (`demoDataService.purgeAllDemo`), jamais recopié ici : aucun futur
 * générateur ne peut se tromper de règle de purge et supprimer des données réelles.
 */
export interface DemoGenerator {
  readonly module: ModuleType
  /** Fabrique ~2 mois d'entrées de démo. Retourne le nombre d'entrées créées. */
  readonly generate: () => Promise<number>
  /** Tous les `local_id` d'entrées du module (démo ET réelles). L'infra filtre `demo-`. */
  readonly listEntryIds: () => Promise<string[]>
  /** Supprime une entrée par son `local_id`, via le service réel (→ syncDelete). */
  readonly deleteEntry: (id: string) => Promise<void>
}

/** Résultat d'une opération de démo — discriminé pour un traitement UI explicite. */
export type DemoResult =
  | { readonly ok: true; readonly count: number }
  | { readonly ok: false; readonly reason: 'not_test_account' | 'unknown_module' }
