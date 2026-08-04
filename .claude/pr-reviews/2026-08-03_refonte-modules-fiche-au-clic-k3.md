---
date: 2026-08-03
branch: refonte/modules-fiche-au-clic-k3
pr_number: 355
pr_url: https://github.com/KaerOrg/Kaer/pull/355
base_branch: refonte/modules-sous-onglets-k2
ci_pass: true
ci_note: "PR empilee (base = branche K-2) : CI GitHub limitee a base=main. 5 jobs verts en LOCAL sur l'etat K-3."
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
files_created: 1
files_modified: 14
rules_enriched: 0
---

# PR Review — refonte/modules-fiche-au-clic-k3 (K-3, #233)

Clic ligne -> fiche module (ModuleActionsModal existante) sur le 1er onglet ;
actions rapides au survol. `ui/DataTable.onRowActivate`, `ModuleTable.onRowClick` +
`actions`, extraction `moduleActionTabMeta.tsx`.

## CI (local, 5 jobs)
typecheck-web OK - lint-web OK (0 erreur) - test-web OK 1502 - typecheck-mobile OK - test-mobile OK 1433.
CI GitHub non declenchee (PR empilee hors main).

## Resultat
- VETO MDR : 0. Le clic ouvre une fiche, ne demarre jamais une passation ; aucune interpretation.
- Violations bloquantes : 0.
- Point d'attention : 1 - decision a11y assumee (ligne cliquable souris + boutons explicites
  pour clavier/SR ; role="button" sur un <tr> contenant des boutons serait de l'ARIA invalide).

## Points positifs
- Extension du primitive (ui/DataTable onRowActivate) plutot que duplication ; reutilisation
  de ModuleActionsModal (aucune nouvelle modale).
- Guard de clic robuste (closest sur elements interactifs) ; colonne d'actions revelee au
  survol/focus, visible en tactile.
- Extraction moduleActionTabMeta.tsx pour respecter react-refresh/only-export-components.
- Couverture : DataTable (activation, clic bouton interne ignore, pas de role/tabindex),
  ModuleTable (onRowClick + actions), integration clic-ligne -> modale.
- Nettoyage des tirets longs residuels (check anti-tiret-long de K-1 silencieusement casse
  par `git diff --cached main...HEAD` + 2>/dev/null).

## Enrichissement des regles
Aucune violation bloquante. Note : le check anti-tiret-long documente (lessons/coding-standards)
echoue en silence avec `--cached` + range de commits ; utiliser `git diff main...HEAD` (sans
--cached) ou grep direct des fichiers. Non enrichi ici (a discuter avec l'utilisateur).
