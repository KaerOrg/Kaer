---
date: 2026-08-03
branch: refonte/modules-sous-onglets-k2
pr_number: 354
pr_url: https://github.com/KaerOrg/Kaer/pull/354
base_branch: refonte/modules-tableau-k1
ci_pass: true
ci_note: "PR empilée (base = branche K-1) : la CI GitHub ne tourne que sur les PR vers main. Les 5 jobs sont verts en LOCAL sur l'état K-2 ; la CI GitHub tournera au rebase sur main."
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
warnings: 1
files_created: 0
files_modified: 10
rules_enriched: 0
---

# PR Review — refonte/modules-sous-onglets-k2 (K-2, #232)

Sous-onglets Actifs/Évolution dans `PatientModulesTab` ; `PatientEvolutionTab` prop
`family` (filtrage modules/scales) ; retrait de l'onglet Évolution de la sidebar
(`PatientPage`) ; « Voir les données » interne.

## CI (local, 5 jobs)
typecheck-web ✅ · lint-web ✅ (0 erreur) · test-web ✅ 1494 · typecheck-mobile ✅ · test-mobile ✅ 1433.
CI GitHub non déclenchée (PR empilée vers une branche feature ; workflow limité à base=main).

## Résultat
- VETO MDR : 0. La légende h2 devient « Valeurs brutes, à interpréter en consultation. » ;
  le sous-titre interprétatif de la maquette (« baisse progressive… habituation ») n'est
  PAS repris. Aucun seuil/couleur/interprétation ajouté.
- Violations bloquantes : 0.
- Point d'attention : 1 — prop `family` optionnelle avec défaut « tout » : branche
  conservée pour la rétro-compat des tests existants (qui mélangent échelles+modules dans
  un même rendu) ; K-5 consommera `family="scales"`. Non bloquant.

## Points positifs
- Réutilisation : `PatientEvolutionTab` généralisé par `family` (aucun graphe réécrit),
  `ui/Tabs` pour les sous-onglets, aucune duplication.
- Couches : la page possède l'état, l'Évolution reçoit `onOpenModuleData` par prop ; le
  flux `openDataFor` de la sidebar est supprimé (orchestration simplifiée).
- Test obsolète (`PatientModulesTab.effect`) réécrit vers le nouveau comportement (couvre
  désormais les sous-onglets + « Voir les données » interne) ; tests de filtrage `family`
  ajoutés.
- Doc : `docs/spec/armoire-therapeutique.md` (K-1 + K-2 cochés, notes de livraison).

## Enrichissement des règles
Aucune violation bloquante → `lessons.md` déjà à jour, aucun cas à ajouter.
