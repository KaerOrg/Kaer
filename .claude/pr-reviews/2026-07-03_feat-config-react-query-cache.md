---
date: 2026-07-03
branch: feat/config-react-query-cache
pr_number: null
pr_url: null
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 1
  i18n: 0
  tests: 0
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 2
files_created: 13
files_modified: 16
rules_enriched: 0
---

# PR Review — feat/config-react-query-cache (#99)
Date : 2026-07-03

CI 5/5 verte. 1 violation bloquante (`as unknown as` dans ModulePreviewPanel.test.tsx)
CORRIGÉE pendant la review → objet ContentField typé. 2 points d'attention non bloquants :
(1) useConfigCacheSync fire la query de version pré-auth (RLS → vide, no-op, coût
négligeable) ; (2) PatientModulesTab/LoginPage sans test dédié (dette préexistante,
migration = swap useEffect→useQuery, logique nouvelle couverte ailleurs).

Points forts : invalidation par meta.configScoped + hook central (altitude), retrait
des caches Map qui shadowaient l'invalidation, CONFIG_QUERY_OPTIONS partagé, helper
renderWithClient factorisé.

Note : le cas `as unknown as` en test est DÉJÀ couvert par lessons.md
§ "field_props : prop_value atomique" (refonte/psychotropes-et-alimentation, 2026-06-22)
— pas de nouveau cas à ajouter.
