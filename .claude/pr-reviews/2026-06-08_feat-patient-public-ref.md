---
date: 2026-06-08
branch: feat/patient-public-ref
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
files_created: 3
files_modified: 12
rules_enriched: 0
---

# PR Review — feat/patient-public-ref
Date : 2026-06-08

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 errors, 185 warnings préexistants `jsx-no-bind`) |
| test-web | `cd apps/web && npx vitest run` | ✅ 611 passed / 7 todo |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 734 passed |

## Synchronisation avec main
- Merge `origin/main` : propre (already up to date)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 3 (`patientRefService.ts`, `patientRefService.test.ts`, `docs/spec/patient-public-ref.md`)
- Modifiés : 12

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 2 |
| ✅ Conformes | 13 fichiers sans remarque |

---

## 🚫 VETO MDR
Aucun. La feature ne touche que l'identification/le routing — zéro seuil, label clinique,
alerte conditionnelle ou interprétation. Conforme à la RÈGLE D'OR.

---

## 🚫 Violations bloquantes
Aucune.

---

## ⚠️ Points d'attention

### `docs/services.md`
**[Service — doc]** Le nouveau service `patientRefService.ts` n'a pas d'entrée dans le
tableau « Web — `apps/web/src/services/` ». Ce tableau recense **chaque** service web ;
l'omission crée de la dette d'indexation.
→ Ajouter une ligne : `resolvePatientRef` — résolution `public_ref → patient_id`.

### `apps/web/src/pages/PatientPage/PatientPage.tsx`
**[Tests]** Le chemin de résolution `ref → id` ajouté au montage n'est couvert
qu'**indirectement** (via `patientRefService.test.ts`). `PatientPage.test.tsx` reste un
stub `it.todo` préexistant. Non bloquant (PatientPage est *modifié*, pas créé, et la
logique extraite est testée unitairement), mais un test d'intégration du montage
(token valide → rendu ; token invalide → redirection `/`) serait un plus.

---

## ✅ Points positifs

- **Séparation des couches exemplaire** : la résolution du token est isolée dans un
  service dédié (`patientRefService.resolvePatientRef`) ; `PatientPage` ne fait
  qu'orchestrer. Zéro `supabase`/`db` dans un composant.
- **Sécurité bien raisonnée** : aucune nouvelle policy RLS — la résolution s'appuie sur
  `ptp_practitioner` (`auth.uid() = practitioner_id`) existante. La JSDoc du service
  documente explicitement que le token est de la défense en profondeur, **pas** un
  contrôle d'accès. Conforme § Sécurité.
- **TypeScript strict** : zéro `as any` / `as unknown` / suppression. Les assertions
  `as { data: … | null }` sur la réponse Supabase suivent le pattern déjà en place dans
  `patientService.ts`.
- **schema.sql source de vérité** : fonction `gen_public_ref()` + colonne `public_ref`
  ajoutées avec migration idempotente (`add column if not exists` + backfill +
  `set not null/default` + index unique), cohérente avec la section MIGRATIONS existante.
- **Hooks corrects** : effet de résolution avec cleanup (`active`), deps `[ref, navigate]`,
  pas d'`async` direct dans `useEffect`.
- **Test du service complet** : happy path + token inconnu + token d'un autre praticien
  (RLS → null) + erreur Supabase + token vide (no-op sans requête).
- **Doc livrée et indexée** : `docs/spec/patient-public-ref.md` créé, référencé dans
  `docs/README.md`, colonne documentée dans `docs/database.md`.

---

## Checklist finale

### coding-standards.md
- [x] Zéro Supabase/SQLite dans les composants
- [x] Lu chaque enfant — aucune feuille ne pilote son propre fetch ; `id` remonté/résolu en page
- [x] TypeScript strict (zéro any/as any/as unknown/suppression)
- [x] Zéro allocation inline introduite dans le render
- [x] useState vs useRef correct (`id` pilote bien le rendu)
- [x] Architecture ui/ vs features/ respectée (aucun composant UI touché)
- [x] Un seul composant par fichier
- [x] Design system — aucune valeur hardcodée (aucune UI/CSS ajoutée)
- [x] i18n — aucun texte visible en dur (token = valeur technique)
- [x] Sécurité — RLS existante couvre, `auth.uid()` dans la policy de résolution
- [x] Schéma — schema.sql à jour + migration appliquée

### config-first.md
- [x] Zéro tableau/objet TS décrivant le contenu d'un module

### sync-service.md (mobile)
- [x] N/A — aucun service mobile touché ; service web read-only

### CLAUDE.md
- [x] MDR 2017/745 — aucun seuil/alerte/interprétation
- [x] Composants existants réutilisés (aucun nouveau composant)
- [x] Parité graphique web ≡ mobile — N/A (aucun module à graphique touché)
- [~] Service — JSDoc ✓ + test ✓ ; **docs/services.md à compléter** (point d'attention)

### Obligatoires pour toute nouvelle feature
- [x] Tests — `resolvePatientRef` couvert (happy + erreur + edge)
- [x] Documentation — `spec/patient-public-ref.md` créé et indexé
- [~] `docs/services.md` — entrée du nouveau service manquante (point d'attention)
- [x] Zéro texte en dur

## Verdict
**Mergeable.** 0 violation bloquante, CI verte (5/5). 2 points d'attention mineurs à
adresser idéalement avant merge (entrée `docs/services.md`, test d'intégration PatientPage).
