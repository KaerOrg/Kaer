---
date: 2026-08-03
branch: refonte/echelles-tableau-jumeau-k4
pr_number: 384
pr_url: https://github.com/KaerOrg/Kaer/pull/384
base_branch: refonte/modules-fiche-au-clic-k3
ci_pass: true
ci_note: "PR empilee (base = branche K-3) : CI GitHub limitee a base=main. 5 jobs verts en LOCAL sur l'etat K-4."
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
files_created: 5
files_modified: 16
rules_enriched: 0
---

# PR Review — refonte/echelles-tableau-jumeau-k4 (K-4, #234)

Nouvel onglet « Echelles & questionnaires » + page PatientScalesTab (jumeau des modules).
Reutilise ModuleTable (titleBadge Auto/Hetero + unlockedLabelOverride), ModuleFilterBar
(extraControls = filtre Type), PatientEvolutionTab family="scales", ModuleActionsModal.
Echelles sorties de PatientModulesTab. Nouveau ScaleEvalBadge.

## CI (local, 5 jobs)
typecheck-web OK - lint-web OK (0 erreur) - test-web OK 1510 - typecheck-mobile OK - test-mobile OK 1433.
CI GitHub non declenchee (PR empilee hors main).

## Resultat
- VETO MDR : 0. Badge Auto/Hetero = type de passation (bleu/vert), pas une gravite ; "Toujours
  dispo." administratif ; suppression d'un bouton C-SSRS rouge code en dur (#DC2626).
- Violations bloquantes : 0.
- Points d'attention : (1) C-SSRS toggle visuel non interactif (mockup vs spec noToggle) ;
  (2) parallelisme PatientScalesTab <-> PatientModulesTab (follow-up : extraire useModuleSheet).

## Points positifs
- Reutilisation maximale des primitives K-1/K-2/K-3 (ModuleTable, family prop, row-click,
  ModuleActionsModal) ; extraction ScaleEvalBadge (DRY avec ScaleMetaBadges) ; filtre Type via
  slot extraControls + ui/Dropdown (pas de couplage CSS).
- Echelles proprement exclues de l'onglet Modules (collectModules + retrait branche + CSS mort).
- Couverture : PatientScalesTab (integration), ScaleEvalBadge, ModuleTable, ModuleFilterBar.
- Doc design-system + spec K-4. i18n fr/en.

## Enrichissement des regles
Aucune violation bloquante. lessons.md a jour.
