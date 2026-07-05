---
date: 2026-07-04
branch: chore/no-duplicate-api-guard
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
files_created: 1
files_modified: 7
rules_enriched: 1
---

# PR Review — chore/no-duplicate-api-guard (#101)
Date : 2026-07-04

0 violation bloquante. Garde-fou noRawFetch.guard.test.ts (import-based, négatif prouvé,
allowlist justifiée) + React Query Devtools (DEV only) + adminQueries.usersPrefix
(corrige clé en dur) + convention documentée (coding-standards.md § « Une clé canonique
par ressource » + docs/services.md § « Vérifier qu'un call n'est pas dupliqué »).
CI 5/5 verte (web 919 tests). Enrichissement règle : coding-standards.md.
