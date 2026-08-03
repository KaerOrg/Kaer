---
date: 2026-08-01
branch: feat/demo-data-engine
pr_number: 246
pr_url: https://github.com/KaerOrg/Kaer/pull/246
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
warnings: 2
files_created: 9
files_modified: 7
rules_enriched: 0
---

# PR Review — feat/demo-data-engine (#246)
Date : 2026-08-01

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ |
| test-web | `cd apps/web && npx vitest run` | ✅ |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ |

## Synchronisation avec main
- Merge `origin/main` : **propre** (auto-merge, aucun conflit)
- Fichiers en conflit résolus : aucun

## Fichiers analysés (périmètre `origin/main...HEAD`)
- Créés : 9 fichiers (4 sources + 5 tests/doc)
- Modifiés : 7 fichiers

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 VETO MDR | 0 |
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 2 |
| ✅ Conformes | 14 fichiers sans remarque |

## ⚠️ Points d'attention

### `apps/mobile/src/screens/DemoDataScreen.tsx`
- **Lignes 47-56 / 68-77 — [Gestion d'erreur / UX]** : `onConfirm` awaite les services sans `try/catch/finally`. Si le générateur réel throw (échec SQLite/sync), rejection non gérée + `setBusy(null)` jamais exécuté → boutons bloqués `disabled`. Écran dev caché (impact prod nul) mais piège d'usage. Wrapper try/catch/finally + toast d'erreur.
- **Ligne 117 — [Design system : token font-size]** : `styles.disclaimer` hardcode `fontSize: 13` / `lineHeight: 18` alors que `fontSize` (`@theme`, `caption = 14`) existe et est déjà importable comme `spacing`/`colors`.

## ✅ Points positifs
Séparation des couches exemplaire ; invariant de purge `demo-` verrouillé écriture+purge et testé ; barrière RGPD réelle dans le service (`isTestAccount`) + confort UI `__DEV__` ; sync-service respecté (`saveSleepEntry`/`deleteSleepEntry`) ; `buildSleepDemoEntries` pure/déterministe, dates locales `@kaer/shared` (zéro `toISOString`) ; réutilisation `ui/Card`/`ui/Button` + alias `@ui`/`@theme`/`@services` ; état discriminé `BusyState`, zéro allocation inline ; types stricts (union discriminée, `readonly`, `unknown[]` dans les mocks) ; couverture complète ; doc `docs/demo-data.md` créée et indexée, règle propagée dans `CLAUDE.md` + skill `module-builder` §6.5 ; i18n `dev.*` fr/en (teen non requis, namespace non-module).

## Enrichissement des règles
📚 `lessons.md` déjà à jour — aucune violation bloquante, aucun cas à ajouter (`rules_enriched: 0`).
