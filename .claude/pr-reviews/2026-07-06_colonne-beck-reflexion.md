---
date: 2026-07-06
branch: colonne-beck-reflexion
pr_number: 113
pr_url: https://github.com/KaerOrg/Kaer/pull/113
ci_pass: true
merge_clean: false
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
warnings: 4
files_created: 12
files_modified: 31
rules_enriched: 0
---

# PR Review — colonne-beck-reflexion (PR #113)
Date : 2026-07-06

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, 191 warnings préexistants `jsx-no-bind`) |
| test-web | `cd apps/web && npx vitest run` | ✅ (1003 passed) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (933 passed) |

## Synchronisation avec main
- Merge `origin/main` : **conflits résolus** (8 fichiers, tous additifs beck ⊕ activation comportementale).
- Fichiers en conflit résolus : `packages/shared/src/index.ts`, `apps/web/src/hooks/queries/engagementQueries.ts`, `apps/web/src/services/engagementService.ts`, `.../engagementService.test.ts`, `.../PatientPage/tabs/ModuleDataPanel.tsx`, `.../ModuleDataPanel.test.tsx`, `.../PatientEvolutionTab.tsx`, `.../clinicalChartConfig.ts`. CI verte après résolution.

## Fichiers analysés
- Créés : 12 fichiers
- Modifiés : 31 fichiers

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 4 |
| ✅ Conformes | reste du périmètre |

---

## 🚫 VETO MDR
Aucun. Le statut « à compléter » est un **statut de workflow dérivé** (non stocké,
non clinique) ; les courbes et fiches restituent des **valeurs brutes** sans seuil,
label interprétatif ni couleur de gravité. `ColumnFormDataPanel.test.tsx` inclut même
une assertion anti-interprétation (aucun « sévère / élevé / danger »). Conforme.

---

## 🚫 Violations bloquantes
Aucune.

> Deux pistes initialement suspectes ont été **levées après vérification** :
> - **i18n web** : les ~46 clés `modules.beck_columns.*` référencées par l'aperçu web
>   et le panneau données ne sont PAS dupliquées dans `apps/web/.../locales`, mais
>   elles sont **fusionnées depuis le mobile** par `mergeModules` (`apps/web/src/i18n/index.ts:41`).
>   Elles résolvent donc correctement côté praticien. Parité intacte.
> - **Date rétroactive → serveur** : `formEntryService.saveFormEntry` propage
>   `client_created_at` et `syncHelpers.syncUpsert` (lignes 12-28) accepte désormais
>   la surcharge — la régression « chronobiologie » (lessons.md 2026-06-21) est corrigée.

---

## ⚠️ Points d'attention

### `apps/web/src/pages/PatientPage/tabs/ColumnFormDataPanel.tsx`

**Ligne 4 — [Imports / alias @ui]**
Fichier **créé** important un primitive par chemin relatif profond :
`import { Button } from '../../../components/ui/Button'`. L'alias `@ui` est configuré
côté web (`vite.config.ts` + `tsconfig.app.json`) → devrait être `import { Button } from '@ui/Button'`.
Nuance : toute la fratrie de `tabs/` (`ModuleDataPanel`, `PatientEvolutionTab`…) importe
encore en relatif (migration `@ui` partielle). Non bloquant, mais un fichier neuf devrait
adopter `@ui`.

### `apps/web/src/components/features/ModuleRenderer/layouts/ColumnFormLayout/ColumnFormLayout.tsx`

**Lignes 129-139, 180 — [Design system : cohérence primitive]**
L'aperçu praticien introduit trois éléments **statiques** reproduisant des primitives :
- `<div className="cf-new-btn">` (fond `var(--color-primary)`, `border-radius: 999px` —
  `ModulePreviewPanel.css:1936`) et `cf-new-btn--secondary` (1950) = un `ui/Button`
  `variant="primary"` / `variant="secondary"`.
- `<span className="cf-suggestion">` (pilule bordée teintée, `:1976`) = un `ui/Chip`.

Dans le **même fichier**, le bouton d'enregistrement utilise le vrai primitive
(`<Button variant="primary" fullWidth disabled icon={<Save/>}>`, ligne 228) et les
curseurs le vrai `<RatingSelector>` (196) — preuve que les primitives fonctionnent en
aperçu. Côté mobile, l'équivalent utilise bien `ui/Button` (584, 592) et `ui/Chip` (352).

Nuance qui **maintient ceci non bloquant** : le pattern `div className="x-btn"` pour les
contrôles secondaires **non interactifs** d'un aperçu est une convention **préexistante
et répandue** (`sj-time-btn`, `sj-month-btn`, `ej-date-btn`… dans `SleepJournalLayout`,
`ExposureFormView`, etc.). L'incident bloquant de référence (roue-des-emotions,
lessons.md) portait sur un layout **interactif** avec de vrais `onClick`, pas un aperçu
statique. Recommandation : aligner sur le save (`<Button … disabled>`) et `ui/Chip`
pour cohérence, comme le fait déjà le mobile.

### `apps/mobile/src/components/features/ModuleRenderer/layouts/ColumnForm/ColumnFormLayout.tsx`

**Lignes 342, 358-363, 471, 482, 490, 497 — [Render : callbacks inline dans une liste]**
Le rendu des fiches (`entries.map`) et des chips de suggestions passe des callbacks
anonymes inline à des primitives mémoïsables (`ui/Button`, `ui/Chip`, `Pressable`) —
recréés à chaque render, ils annulent la mémoïsation des enfants. Les nouveaux
(`onPress` d'expand, `onPress` des chips de suggestion) sont introduits par cette PR.
Piste : extraire un composant `RecordCard` mémoïsé recevant des handlers stables — ce
qui allègerait aussi ce fichier de ~600 lignes (règle « un fichier = un composant »,
le rendu de la carte y est inline).

### `apps/web/src/pages/PatientPage/tabs/ColumnFormRecordCard.tsx`

**[Tests / couverture]**
Composant à logique (filtre colonnes vides, texte vs curseur) **créé sans `.test.tsx`
dédié**. Il est réellement exercé (non mocké) par `ColumnFormDataPanel.test.tsx`
(colonnes vides masquées, textes intégraux, valeurs brutes, antichronologie) — donc
couverture effective, pas nulle. Un test de rendu direct resterait préférable ; non
bloquant vu la couverture d'intégration réelle.

---

## ✅ Points positifs

- **Config-first + `field_props` atomiques** : `quick_key_1..2`, `complete_key_1`,
  `suggestion_1..8`, `dist_1..8` en clés indexées (jamais de CSV/`:`/JSON) ; tous les
  `text_code` référencent des clés i18n, zéro prose en seed. Structure des colonnes
  dérivée de la base côté web ET mobile (`columnFormData.ts`, `buildColumnSpecs`).
- **Parité web ≡ mobile** soignée : capture rapide, chips de suggestions, badge colonne
  optionnelle, courbes Beck (`intensity_before/after`) répliqués dans l'aperçu et le
  panneau données praticien.
- **Sync correcte** : `formEntryService` passe par `syncUpsert`/`syncDelete`, `entry_kind: 'form_entry'`
  (union `EntryKind`), surcharge `client_created_at` pour la saisie rétroactive.
- **Couverture de tests forte** : `FieldRenderer.column_form.test.tsx` couvre capture en
  deux temps, puce « à compléter », curseur non pré-sélectionné, fiche dépliable,
  colonnes `optional_group`, chips de suggestions. Chaque helper pur créé a son test
  (`entryCompletion` 5, `textSuggestions` 5, `columnFormData` 7, `patientModuleConfig` 3).
- **MDR** : statut de complétion dérivé (non stocké), valeurs brutes, test anti-interprétation.
- **Documentation** à jour et cohérente : `docs/modules/beck_columns.md` (dont la nature
  **dormante et intentionnelle** d'`optional_group`, ligne 31-37), `docs/module-engine.md`,
  `docs/services.md`.
- **i18n** : `mergeModules` réutilisé pour éviter la duplication des traductions
  praticien ; parité `fr/en/teen` mobile complète (0 clé manquante sur 46).

---

## Checklist finale

### coding-standards.md
- [x] Zéro Supabase/SQLite direct dans un composant (services partout)
- [x] Feuilles présentationnelles (RecordCard reçoit données + `t` en props)
- [x] TypeScript strict (zéro any/as unknown/suppression)
- [ ] Zéro allocation inline — ⚠️ callbacks inline dans le `.map` mobile (point d'attention)
- [x] Architecture ui/ vs features/ respectée
- [x] Un composant par fichier (sauf rendu record inline mobile — voir point d'attention)
- [x] Design system — ⚠️ aperçu web reproduit Button/Chip en div (non bloquant, convention aperçu)
- [x] i18n — zéro texte en dur ; clés résolues via merge mobile ; parité teen OK
- [x] Sécurité / Schéma — pas de nouvelle table (config en `field_props`, schema inchangé)

### config-first.md
- [x] Zéro tableau TS décrivant le contenu du module
- [x] `field_props` atomiques (clés indexées, pas de packing)

### sync-service.md
- [x] `dbSave`/`dbDelete` encapsulés dans `syncUpsert`/`syncDelete`
- [x] `entry_kind` ∈ `EntryKind`, surcharge `client_created_at` propre

### CLAUDE.md
- [x] MDR — aucun seuil / interprétation / couleur de gravité
- [x] Composants réutilisés (ui/Button, ui/Chip, ui/RatingSelector côté mobile)
- [x] Parité graphique web ≡ mobile (courbes Beck dans PatientEvolutionTab + panneau)
- [x] Tests + doc livrés pour la feature
