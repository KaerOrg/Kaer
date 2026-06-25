---
date: 2026-06-25
branch: test/retention-purge-harness
pr_number: null
pr_url: null
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 0
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 0
files_created: 3
files_modified: 2
rules_enriched: 0
---

# PR Review — test/retention-purge-harness
Date : 2026-06-25

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 errors) |
| test-web | `cd apps/web && npx vitest run` | ✅ (855 passed) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (872 passed) |
| test-edge (nouveau) | `deno test supabase/functions/` | ✅ (13 passed) |

## Synchronisation avec main
- Merge `origin/main` : propre (already up to date)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 3 (`retention.ts`, `retention.test.ts`, `deno.lock` généré)
- Modifiés : 2 (`purge-retention/index.ts`, `docs/retention-conservation.md`, `.github/workflows/ci.yml`)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 1 |
| ✅ Conformes | tous |

## 🚫 VETO MDR
Aucun. La sélection des lignes à purger est 100 % temporelle (ancienneté + inactivité
par dates), aucun seuil ni label clinique. Commentaires MDR explicites dans
`retention.ts` et `index.ts`. Les tests ne réintroduisent aucune logique de seuil.

## 🚫 Violations bloquantes
Aucune.

## ⚠️ Points d'attention
### `supabase/functions/purge-retention/index.ts`
- L'enveloppe Deno (`index.ts`) n'est pas type-checkée en CI : `deno check` échoue
  hors edge-runtime car `jsr:@supabase/supabase-js` tire la dépendance npm
  `realtime-js` non résolue sans `node_modules`. Choix assumé et cohérent avec les
  6 autres edge functions du dépôt (aucune n'est type-checkée). La logique testable a
  justement été extraite dans `retention.ts` (type-checkée + testée par `deno test`).
  `index.ts` reste une glue fine vérifiée par lecture.

## ✅ Points positifs
- Refactor propre par injection de dépendance : `RetentionStore` isole l'accès données,
  rendant l'orchestration testable sans Postgres ni Supabase (la part atteignable d'un
  test unitaire). Saluer l'extraction de logique d'un orchestrateur vers un module pur.
- `isAuthorized` durci : rejette un bearer vide même si la clé service_role est vide
  (garde-fou de misconfig), couvert par test.
- Couverture des cas limites : échec lecture config (→500), purge à 0 ligne tracée,
  isolation d'erreur par table, échec d'audit non bloquant.
- Doc mise à jour dans le même commit : section « Couverture de test » distinguant
  l'orchestration testée et la sélection SQL vérifiée par requête à blanc.
- Idempotence/sécurité du schéma SQL inchangées (hors scope de cette PR).

## Checklist finale
- [x] MDR — aucun seuil/alerte/interprétation
- [x] TypeScript strict (zéro any/as unknown/suppression)
- [x] Tests — `retention.ts` couvert par `retention.test.ts` (happy path + erreurs + edge)
- [x] Documentation — `docs/retention-conservation.md` mise à jour et indexée (CLAUDE.md)
- [x] i18n — N/A (backend, zéro texte visible)
- [x] Design system — N/A (backend)
- [x] Config-first — `retention_config` pilote tout, zéro donnée packée
- [x] Schéma — inchangé (refactor edge function + tests)
