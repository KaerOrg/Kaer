---
date: 2026-07-03
branch: feat/patient-reads-react-query
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
warnings: 2
files_created: 15
files_modified: 14
rules_enriched: 0
---

# PR Review — feat/patient-reads-react-query (#100)
Date : 2026-07-03

CI 5/5 verte (web 917 tests, mobile 890). 0 violation bloquante. 2 points d'attention
non bloquants : useCrisisPlanEditor sans test dédié (gap préexistant, chemin couvert
indirectement) ; fixtures FileActivePage.test via cast partiel (toléré, ni any ni unknown).

Migration des 5 zones de lectures patient volatiles vers React Query + invalidation :
crisis (3 widgets + editor, cache Map retiré), cssrs (save/delete → useMutation),
routines (modal), fileactive (optimiste via setQueryData + invalidation erreur, réutilise
dashboard/catalog queries), activityfeed (badge dérivé au render). Factories + composants
testés. docs/services.md.
