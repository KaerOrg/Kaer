---
date: 2026-08-04
branch: feat/echelles-programmation-k6
pr_number: 392
pr_url: https://github.com/KaerOrg/Kaer/pull/392
base_branch: main
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
files_modified: 12
rules_enriched: 0
---

# PR Review — feat/echelles-programmation-k6 (K-6, #236)

Encart Programmation (auto) / Passation (hétéro). Net-new : table scale_schedules + RLS
+ service + query + panneaux + onglets. Périmètre « cœur d'abord » (persistance + UI + MDR,
actions minimales).

## CI (local, 5 jobs)
typecheck-web OK - lint-web OK (0 erreur) - test-web OK 1524 - typecheck-mobile OK - test-mobile OK 1433.
PR vers main : la CI GitHub tourne dessus.

## Resultat
- VETO MDR : 0. Garde-fous tenus : cadence choisie par le praticien, rappel calendaire, aucune
  relance liee a un score, bandeau MDR. Point a instruire : mode auto-domicile recurrent (spec Q2).
- Violations bloquantes : 0.
- Points d'attention : (1) database.types.ts edite a la main (table absente du generateur) ;
  (2) actions « Faire passer » / « Demarrer » en toast placeholder (perimetre coeur-d-abord choisi).

## Points positifs
- Nouvelle table + RLS repercutee dans schema.sql + migration idempotente ; service dedie (zero
  Supabase dans le composant) + query factory + hooks de mutation.
- Reutilisation ModuleActionsModal (onglet schedulePanel) + computeModuleTabs etendu proprement.
- Couverture complete (service happy+erreur, panneaux, tabs, integration). Doc database/services/spec.
- Zero valeur hardcodee cote MDR (bandeau + wording neutres).

## Enrichissement des regles
Aucune violation bloquante. lessons.md a jour.
