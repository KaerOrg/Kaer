---
date: 2026-07-01
branch: feat/note-appointment-link
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
warnings: 3
files_created: 1
files_modified: 9
rules_enriched: 0
---

# PR Review — feat/note-appointment-link
Date : 2026-07-01

## CI GitHub Actions
| Job | Statut |
|---|---|
| typecheck-web | ✅ |
| lint-web | ✅ (0 errors, warnings pré-existants jsx-no-bind) |
| test-web | ✅ 862 passed |
| typecheck-mobile | ✅ |
| test-mobile | ✅ 891 passed |

## Synchronisation avec main
- Merge origin/main : propre (Already up to date)
- Conflits : aucun

## Résumé
- 🚫 Violations bloquantes : 0
- ⚠️ Points d'attention : 3 (px bruts CSS cohérents avec siblings ; RLS appointment_id non scopé mais non exploitable ; dette jsx-no-bind pré-existante)
- VETO MDR : aucun (affichage RDV neutre/factuel)

## Feature
Colonne FK nullable `appointment_id` sur `practitioner_patient_notes` (on delete set null),
sélecteur de RDV proches (fenêtre -60j/+30j) dans les formulaires de note, affichage du RDV
lié, filtre des notes par rendez-vous. Helper pur `selectableAppointmentsForNote` testé.
Réutilisation du primitive `@ui/Dropdown`. Doc feature `docs/practitioner-notes.md` à jour.

## Enrichissement
📚 lessons.md déjà à jour — aucun cas à ajouter (0 violation bloquante).

## Déviation
Ticket listait docs/database.md, mais ce doc ne documente ni practitioner_patient_notes ni
appointments. Doc portée sur docs/practitioner-notes.md (home réel de la table).
