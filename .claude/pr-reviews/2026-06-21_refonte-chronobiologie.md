---
date: 2026-06-21
branch: refonte/chronobiologie
pr_number: 63
pr_url: https://github.com/KaerOrg/Kaer/pull/63
ci_pass: true
merge_clean: false
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 2
  docs: 0
  design_system: 1
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
  parite_web_mobile: 1
warnings: 4
files_created: 25
files_modified: 18
rules_enriched: 1
---

# PR Review — refonte/chronobiologie
Date : 2026-06-21

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, 200 warnings préexistants `jsx-no-bind`) |
| test-web | `cd apps/web && npx vitest run` | ✅ (794 passés, 6 todo) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (808 passés) |

## Synchronisation avec main
- Merge `origin/main` : **conflits résolus** (le `main` local était en retard sur `origin/main`).
- Fichiers en conflit résolus (additifs, les deux côtés gardés) :
  - `apps/mobile/.../ColumnForm/styles.ts`
  - `apps/web/src/hooks/queries/engagementQueries.ts`
  - `apps/web/src/pages/PatientPage/tabs/ModuleDataPanel.tsx`
  - `apps/web/src/pages/PatientPage/tabs/PatientEvolutionTab.tsx`
  - `apps/web/src/pages/PatientPage/tabs/PatientModulesTab.tsx`
  - `docs/services.md`
- Périmètre réel de la review = contribution propre de la branche (`git diff origin/main...HEAD`), hors travail déjà mergé (médication/sommeil).

## Fichiers analysés (contribution branche vs origin/main)
- Créés : ~25 fichiers (rythmogramme web+mobile, `chronoAnchors.ts`, `rhythmogram.ts` partagé, doc module, spec)
- Modifiés : ~18 fichiers (ColumnForm web+mobile, ChronoMonth web+mobile, engagement service/queries, i18n, seeds)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 4 |
| ⚠️ Points d'attention | 4 |
| ✅ Conformes | reste |

---

## 🚫 VETO MDR (si applicable)
Aucun. Le rythmogramme affiche des **horaires bruts** et un **écart-type circulaire brut** (`±X min`) sans seuil, sans label clinique, sans codage couleur de gravité (les couleurs distinguent les repères, pas une sévérité). Commentaires MDR explicites dans `rhythmogram.ts`, `ChronoRhythmogram.tsx`, `RhythmogramChart.tsx`, `fetchChronoEntries`. Conforme.

---

## 🚫 Violations bloquantes

### 1. `apps/web/src/services/syncHelpers.ts` (contrat) ↔ saisie rétroactive — parité web ≢ mobile

La fonctionnalité phare de la PR (commit `26bab8d` « saisie rétroactive : date de saisie éditable ») ne parvient pas jusqu'au praticien.

- **Mobile** : `saveFormEntry({ id, module_id, values, created_at: entryDate.toISOString() })` écrit la date choisie dans SQLite. Le rythmogramme mobile, construit depuis SQLite, place donc l'entrée au **bon jour**.
- **Sync** : `syncHelpers.syncUpsert` force `client_created_at: new Date().toISOString()` et son type `UpsertParams = Omit<EnqueueParams, 'operation' | 'client_created_at'>` **interdit** à l'appelant de transmettre la date choisie.
- **Web** : `fetchChronoEntries` lit `client_created_at` pour dater chaque saisie — et son propre commentaire documente le contrat attendu :
  ```ts
  // La date d'une saisie = client_created_at (le patient peut la dater
  // rétroactivement → ce champ porte le jour concerné).
  ```
  Ce contrat est **violé** par `syncUpsert` : une saisie datée rétroactivement remonte avec `client_created_at = aujourd'hui`. Le rythmogramme praticien la place au **jour de synchronisation**, pas au jour choisi.

→ Résultat : mobile (patient) et web (praticien) affichent la **même saisie à deux jours différents** → rupture de parité web ≡ mobile (Étape 4.4) sur la feature centrale de la PR.
→ Correctif : permettre à `syncUpsert` de recevoir un `client_created_at` optionnel (défaut = `now`) et le faire porter par `saveFormEntry` quand `editable_date` est actif, pour que `patient_entries.client_created_at` reçoive la date choisie.

### 2. `apps/web/src/components/features/ChronoRhythmogram/ChronoRhythmogram.tsx` — créé sans test

Composant créé avec de la logique non triviale : `buildHourTicks` (pur), `TooltipContent` (rendu conditionnel + `anchors.find`), filtre `anchors.filter(a => a.count >= 1)`, axes inversés. **Aucun `ChronoRhythmogram.test.tsx`**, et le seul consommateur testé (`ChronoRhythmogramPanel.test.tsx`) le **mocke intégralement** (`vi.mock('../../../components/features/ChronoRhythmogram')`). Couverture réelle = 0 (Étape 5.1 + lessons.md « la couverture d'intégration ne remplace pas le test direct » — ici il n'y a même pas de couverture indirecte).
→ Ajouter un test de rendu (au moins : courbes tracées par repère présent, légende `±SD`, libellés d'axes), idéalement extraire et tester `buildHourTicks`.

### 3. `apps/web/src/lib/chronoAnchors.ts` — fonction pure créée sans test

`buildRhythmogramAnchors(stats, t)` est une fonction pure (fusion config repères + stats brutes). Aucun `chronoAnchors.test.ts`, aucune référence dans un test (`grep buildRhythmogramAnchors` sur les tests = vide).
→ Ajouter `chronoAnchors.test.ts` : ordre canonique préservé, `sdMinutes`/`count` repris des stats, `count: 0` pour un repère sans stat, libellé résolu via `t`.

### 4. `apps/mobile/.../ColumnForm/ColumnFormLayout.tsx:225-256` — boutons ad hoc au lieu de `ui/Button`

Les nouveaux `dateBtn` et `prefillBtn` sont des `Pressable + MaterialCommunityIcons + Text + styles.xxxBtn`, alors que `ui/Button` (mobile) couvre **exactement** le besoin (`iconLeft` + variants `primary`/`secondary`/`ghost`/`danger` + `label` + `accessibilityLabel`). C'est précisément l'anti-pattern « `Pressable + Text + styles.xxxBtn` quand `Button` existe » → **violation bloquante** (coding-standards § design system, RULE design system mobile).
→ **On ne bypass jamais le design system.** « Cohérent avec le pattern ad hoc préexistant du fichier (`saveBtn`/`cancelBtn`/`newBtn`/`timeButton`) » n'est **pas** une excuse : c'est de la dette, pas une norme. Migrer `dateBtn`/`prefillBtn` vers `ui/Button` ; et tant qu'à faire, aligner les autres boutons ad hoc du layout.

---

## ⚠️ Points d'attention

### Duplication de la config des repères (config-first / source unique)
La liste des repères + couleurs + clés i18n est figée en **deux constantes TS** : `chronoAnchors.CHRONO_ANCHORS` (web) et `chronoMonthUtils.DEFAULT_ANCHORS` (mobile), et les **clés** existent aussi en base (`module_content_fields` du seed chrono). Trois sources pour le même ensemble.
→ Les couleurs et l'ordre sont de la présentation (légitimement en code), mais les **clés** des repères gagneraient à être dérivées des fields chargés pour garantir la parité web ≡ mobile par construction. Atténuation : `DEFAULT_ANCHORS` préexiste à la PR ; la PR mirroite proprement pour le web. À surveiller si l'ensemble des repères évolue.

### `apps/mobile/.../ColumnForm/ColumnFormLayout.tsx` — parité teen i18n
Des clés `modules.chronobiology_tracker.*` patient-facing ajoutées en `common.json` n'ont pas de variante dans `teen.json` (mobile) : `legend_recorded`, `no_entry_day`, `entry_date`, `prefill_from_last`, et les libellés d'axes/repères. Beaucoup sont **register-neutres** (noms de repères « Coucher », axe « Heure » : tutoiement non pertinent), mais `prefill_from_last`/`entry_date` sont des phrases qui mériteraient un registre ado.
→ Vérifier/compléter `fr/teen.json` + `en/teen.json` pour les clés à registre (laisser les libellés-noms en fallback `common` est acceptable).

### `apps/web/src/pages/PatientPage/tabs/ChronoRhythmogramPanel.tsx:55-56` — calcul en render + callbacks inline
`buildRhythmogram(...)` et `buildRhythmogramAnchors(...)` sont recalculés à chaque render (itèrent toutes les saisies) hors `useMemo`. Les `onClick={() => setIdx(safeIdx ± 1)}` sont des callbacks inline passés à `ui/Button`.
→ Mémoïser le résultat (`useMemo` sur `[entries, safeIdx]`) ; envelopper les handlers de navigation. (Cohérent avec les 200 warnings `jsx-no-bind` déjà tolérés ailleurs — non bloquant.)

### `apps/web/.../ColumnFormLayout/ColumnFormLayout.tsx` — couleur de repli en dur
`const color = h.props['color'] ?? '#6366F1'` : fallback hexadécimal d'accent dans le layout d'aperçu. `style={{ background: r.color }}` est dynamique (donnée) donc OK, mais le défaut figé gagnerait à pointer un token (`var(--color-primary)` côté CSS, ou une constante partagée).

---

## ✅ Points positifs

- **`packages/shared/src/services/rhythmogram.ts`** : logique pure partagée web ≡ mobile, exhaustivement testée (`rhythmogram.test.ts`), écart-type **circulaire** correct (passage minuit géré), MDR-safe documenté. Excellent choix d'altitude (un seul moteur, deux rendus).
- **`ChronobiologyCard.tsx`** : extraction propre du render de `PatientModulesTab` pour héberger des **callbacks stables** (`useCallback`), `ui/Card` + `ui/Button` (variants/icônes), données injectées par props — couches respectées, aligné sur les cartes sœurs. Testé.
- **`RhythmogramChart.tsx` (mobile)** : modèle mémoïsé (`useMemo`), tokens du thème (`colors.*`, `spacing.*`), `react-native-svg`, segments interrompus sur jours non saisis (`connectNulls=false` équivalent). Testé.
- **Seed `chrono_seed.sql`** : idempotent par DELETE+INSERT à UUIDs fixes, `theme_id` déjà présent dans `schema.sql`, `text_code` = clés i18n (zéro prose).
- **Conflits de merge** : tous additifs, résolus en gardant les deux contributions (sommeil + chrono), CI verte après résolution.
- Documentation livrée : `docs/modules/chronobiology_tracker.md`, `docs/spec/rythmes-regularite.md`, `docs/services.md` mis à jour.

---

## Checklist finale
- [x] MDR 2017/745 — horaires/SD bruts, aucun seuil ni interprétation
- [x] Zéro Supabase/SQLite dans un composant (services respectés)
- [x] TypeScript strict (zéro any/as unknown/suppression) — `tsc` vert
- [ ] **Tests** — `ChronoRhythmogram.tsx` et `chronoAnchors.ts` créés sans test → 🚫
- [x] Documentation créée et indexée (module + spec + services)
- [ ] **Parité web ≡ mobile** — saisie rétroactive non propagée à `client_created_at` → 🚫
- [ ] **Design system mobile** — `dateBtn`/`prefillBtn` ad hoc au lieu de `ui/Button` → 🚫
- [x] i18n — clés présentes web+mobile common ; ⚠️ parité teen partielle
- [x] Schéma — `schema.sql` à jour (`theme_id` préexistant), seed idempotent
- [x] sync-service — `formEntryService` passe par `syncUpsert`/`syncDelete` (mais voir violation #1 sur la date)
