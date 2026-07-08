---
date: 2026-07-08
branch: refonte/crisis-plan-phase1-remove-coping-commitment
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
warnings: 1
files_created: 1
files_modified: 24
rules_enriched: 0
---

# PR Review — refonte/crisis-plan-phase1-remove-coping-commitment
Date : 2026-07-08

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, 193 warnings pré-existants `jsx-no-bind`) |
| test-web | `cd apps/web && npx vitest run` | ✅ (1073 tests) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (965 tests) |

## Synchronisation avec main
- Merge `origin/main` : propre (already up to date)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 1 (migration SQL)
- Modifiés : 24 (hors 12 fichiers supprimés)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 1 (dette pré-existante, hors périmètre) |
| ✅ Conformes | 25 fichiers |

---

## 🚫 VETO MDR
Aucun. La PR ne fait que **retirer** des fonctionnalités (cartes de coping, engagement) ;
aucune interprétation, seuil, alerte conditionnelle ou label clinique n'est introduit.
Le plan de sécurité reste passif (affichage brut, numéros d'urgence, ancres).

## 🚫 Violations bloquantes
Aucune.

## ⚠️ Points d'attention

### Dette pré-existante (hors périmètre du ticket)
Les locales dupliquent le contenu du module `crisis_plan` sous deux namespaces :
`modules.crisis_plan.*` (contenu riche, consommé par le code et les `text_code`) et
`module.crisis_plan.*` (label/description/footer). Côté **mobile fr/common** et
**teen**, le bloc `module.crisis_plan` recopiait aussi (redondance morte) les clés
coping/commitment/urgency. J'ai retiré les clés coping/commitment des **deux** blocs
pour ne laisser aucun résidu, mais la redondance structurelle des deux namespaces
préexiste au ticket et n'a pas été dédupliquée (scope creep évité). À traiter dans un
nettoyage i18n dédié si souhaité.

## ✅ Points positifs
- **Suppression propre et complète** : widgets + tests + index + entrées des dispatchers
  (web `LayoutDispatcher`, mobile `SECTION_WIDGETS`), services, type `@kaer/shared`,
  types Supabase générés, seed, schema, migration, i18n, docs — aucun résidu
  (`grep coping_card|commitment` sur tout le repo = vide hors DDL de suppression).
- **BDD conforme** : `schema.sql` reste source de vérité (drop table + colonne +
  MAJ des RPC RGPD export & tableau d'audit), migration idempotente dédiée
  (`drop ... if exists`, `create or replace` du RPC, `delete ... where id in (...)`),
  RLS de `crisis_plan_configs` préservée.
- **Tests maintenus à jour** : chaque test touchant les symboles retirés a été mis à
  jour (services web + mobile, `CrisisPlanConfigPanel`, `CrisisAnchorsWidget`,
  `FieldRenderer.editable_steps`), aucun mock périmé.
- **Parité web ≡ mobile** respectée : retrait symétrique sur les deux plateformes.
- **Parité i18n fr/en + teen** : clés retirées symétriquement des 6 fichiers de locale.
- **Docs synchronisées dans le même commit** (module-engine, design-system mobile,
  services, audit-log) + commentaire `crisisQueries` remis à jour.

---

## Checklist finale

### coding-standards.md
- [x] Zéro Supabase/SQLite dans les composants
- [x] Aucune feuille ne pilote son propre cycle de données (aucun conteneur ajouté)
- [x] TypeScript strict (zéro any/as unknown/suppression)
- [x] Zéro allocation inline dans le render
- [x] Architecture ui/ vs features/ respectée
- [x] Un seul composant par fichier
- [x] Design system — zéro valeur hardcodée introduite
- [x] i18n — zéro texte en dur + parité fr/en + teen
- [x] Sécurité — RLS préservée, `auth.uid()` dans les policies
- [x] Schéma — `schema.sql` à jour + migration idempotente

### config-first.md
- [x] Zéro tableau/objet TypeScript décrivant du contenu de module

### sync-service.md (mobile)
- [x] `crisisPlanService` mobile : écritures restantes (ancres, phrase) via `syncUpsert`/`syncDelete` ; suppression de `saveCommitment` (qui utilisait bien `syncUpsert`) — aucune écriture orpheline introduite

### CLAUDE.md
- [x] MDR 2017/745 — aucune interprétation introduite
- [x] Parité graphique web ≡ mobile — inchangée (pas de chart concerné)

### Obligatoires pour toute feature (Étape 5)
- [x] Tests à jour couvrant le code modifié
- [x] Documentation mise à jour et indexée
- [x] Zéro texte en dur (code + seed)
