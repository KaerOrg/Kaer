---
date: 2026-06-02
branch: refonte-thermometre-de-l-humeur
pr_number: null
pr_url: null
ci_pass: false
merge_clean: true
violations:
  mdr: 0
  data_access: 1
  typescript: 3
  i18n: 2
  tests: 1
  docs: 1
  design_system: 1
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
  sync: 1
warnings: 8
files_created: 26
files_modified: 26
rules_enriched: 0
---

# PR Review — refonte-thermometre-de-l-humeur
Date : 2026-06-02

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ |
| test-web | `cd apps/web && npx vitest run` | ✅ (445 passed, 7 skipped) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ❌ (20 erreurs TS) |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (663 passed) |

> Le skill demande de corriger la CI avant de poursuivre ; l'en-tête du skill
> interdit cependant de modifier les fichiers (« Tu ne modifies aucun fichier hormis
> la résolution de conflits »). J'ai honoré la contrainte la plus forte : **aucune
> modification de code**, l'échec typecheck-mobile est reporté comme violation
> bloquante n°1 et la review est complète.

## Synchronisation avec main
- Merge `origin/main` : propre (Already up to date)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 26 fichiers
- Modifiés : 26 fichiers

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 6 |
| ⚠️ Points d'attention | 8 |
| ✅ Conformes | majorité |

---

## 🚫 VETO MDR
Aucun. Les graphiques utilisent des couleurs **catégorielles** (une teinte par
dimension/symptôme, constante quelle que soit la valeur) et l'opacité du calendrier
encode l'intensité de façon neutre — aucun dégradé de gravité, aucun seuil, aucun
label interprétatif. Les bandeaux/notes MDR sont présents (`footer`). Le seed porte
même un commentaire explicite rappelant l'interdiction des couleurs interprétatives
sur les options d'échelle. **Conforme.**

---

## 🚫 Violations bloquantes

### 1. CI typecheck-mobile échoue (20 erreurs TypeScript)

**`apps/mobile/src/components/features/TimeRangeCharts/MonthCalendar.tsx:88`**
`Array.from(...).reduce((s, v) => s + v, 0)` sur un tableau `(0 | 1)[]` — TS infère
le type de retour `0 | 1` et rejette `number`.
→ Typer l'accumulateur : `.reduce<number>((s, v) => s + v, 0)`.

**`apps/mobile/src/lib/scaleScoring.ts:109`** — `'a' is possibly 'null'`.
```ts
const valid = answers.filter(a => a != null && !isNaN(a))   // ne narrow pas le type
return Math.round(valid.reduce<number>((s, a) => s + a, 0) / valid.length)  // a: number | null
```
→ Utiliser un type guard : `.filter((a): a is number => a != null && !isNaN(a))`.

**`apps/mobile/src/screens/modules/MoodTrackerScreen.test.tsx`** — 18 erreurs
`implicit any` / `TS2345` (params `_m`, `k`, `cb`, `children`, `label`, `onChange`,
`entries`, `sel`, `d`, `id`, `date`, `scores`, `p`, `daysAgo`, `n` non typés ; deux
`UNSAFE_queryAllByType('string')`). Les mocks et helpers du test ne sont pas typés.
→ Typer les paramètres des mocks et helpers.

### 2. [Design system — duplication] Deux piles de graphiques parallèles créées dans la même PR

L'inventaire des primitives a été lu (`ls components/ui`, `components/features`).
Constat : la PR introduit **deux jeux de primitives charts qui se recouvrent**.

- **`features/TimeRangeCharts/LineChart.tsx` & `BarChart.tsx`** dupliquent
  **`ui/Chart/LineChart.tsx` & `ui/Chart/BarChart.tsx`** (mêmes `SVG_W=280`,
  `DATA_H=56`, mêmes `xAt`/`yAt`, mêmes rayons de points, mêmes labels). Différences :
  `yMax` (10 vs 3 par défaut), graduations Y, gouttière `PAD_LEFT`, connexion à
  travers les gaps, **couleurs en dur** vs tokens. → Ces variantes doivent **étendre**
  `ui/Chart` (props `yMax`, `showGrid?`, `gutter?`), pas le forker. *(coding-standards
  § Checklist Étape 4 ; config-first « étendre, ne pas redupliquer »)*
- **`features/TimeRangeCharts/RangeSelector.tsx`** est une copie quasi-exacte de
  **`ui/PillSelector`** (même rangée de `Pressable`, même `backgroundColor: color`
  actif, même lookup `labels[x] ?? x`, styles identiques). L'écran médicaments
  utilise déjà `PillSelector` pour exactement ce besoin. → Supprimer `RangeSelector`,
  utiliser `PillSelector` (typer `value`/`onChange` côté appelant).
- **`features/TimeRangeCharts/chartUtils.ts`** duplique
  **`screens/modules/MedicationSideEffectsHistory/chartUtils.ts`** :
  `buildXLabels`, `buildChartData`, `computeAvg`, `computeStreak` sont identiques (au
  bucket `3M`/`6M` près). → Une seule util partagée, paramétrée par l'ensemble des
  plages.
- **`features/TimeRangeCharts/DimensionChart.tsx`** duplique
  **`MedicationSideEffectsHistory/SymptomChart.tsx`** (même carte, même header moyenne,
  même `range === '7J' ? Bar : Line`).
- Les types **`DataPoint` / `XLabel`** sont définis **deux fois**
  (`ui/Chart/chartTypes.ts` et `TimeRangeCharts/chartUtils.ts`).

> L'écran `MedicationSideEffectsHistoryScreen` est l'exemple **correct** (réutilise
> `ui/Button`, `Card`, `EmptyState`, `PillSelector`, `Chart`). `MoodTrackerScreen`
> réimplémente à la main bouton (`newBtn` `Pressable`), carte (`card`), état vide
> (`empty`), sélecteur (`RangeSelector`) et charts — alors que tout existe au DS.

### 3. [Accès données + Sync] Écrans appelant `lib/database` directement, deletes non synchronisés

**`apps/mobile/src/screens/modules/MoodTrackerScreen.tsx:18-26`** et
**`MedicationSideEffectsHistory/MedicationSideEffectsHistoryScreen.tsx:15`**
importent et appellent des fonctions de `lib/database` depuis un écran :
```ts
import { getAllScaleEntries, deleteScaleEntry, getAllMoodMarkers,
         saveMoodMarker, deleteMoodMarker } from '../../lib/database'
```
- `deleteScaleEntry` est ici la version **brute** de `lib/database` (DELETE SQLite
  seul) et non `scaleEntryService.deleteScaleEntry` qui enchaîne `syncDelete`. → Les
  suppressions d'entrées ne sont **jamais répliquées vers Supabase**. Importer depuis
  `scaleEntryService`. *(.claude/rules/sync-service.md)*
  *(Note : `ScaleHistoryScreen.tsx:15` fait déjà la même erreur — précédent
  pré-existant à corriger aussi.)*
- `saveMoodMarker` / `deleteMoodMarker` écrivent/suppriment des **données patient**
  en SQLite **sans `syncUpsert`/`syncDelete` ni service** dédié. La table
  `mood_markers` n'a aucun flux de sync ni de commentaire JSDoc justifiant le
  local-only. → Créer un `moodMarkerService` qui passe par `syncHelpers` (ajouter
  `mood_marker` à `EntryKind`), **ou** documenter explicitement le choix local-only.
  *(coding-standards § Accès aux données + sync-service.md règles 2 & 5)*

### 4. [Tests — Étape 5.1] Composants créés sans test

Aucun test pour les composants suivants (logique non triviale : grille calendaire,
overlay composite + repères, sélecteur, mise à l'échelle SVG) :
- `features/TimeRangeCharts/` : `DimensionChart`, `CompositeChart`, `MonthCalendar`,
  `RangeSelector`, `LineChart`, `BarChart` (6 composants, 0 test).
- `MedicationSideEffectsHistory/` : `SymptomChart`, `chartUtils` (non testés
  directement — `computeStreak`/`buildChartData` médicaments n'ont pas de suite).

> `chartUtils` de TimeRangeCharts est partiellement couvert via
> `MoodTrackerScreen.test.tsx` (`jest.requireActual`), mais les composants de rendu
> et le `chartUtils` médicaments ne le sont pas.

### 5. [i18n teen] Clé de module ajoutée sans variante teen

**`supabase/seed.sql`** ajoute `mse.notes` → `modules.medication_side_effects.notes_placeholder`,
mais cette clé est **absente de `fr/teen.json` et `en/teen.json`**. La règle d'or i18n
(« chaque clé `modules.<id>.*` doit avoir une variante teen ») la qualifie de bloquante.
Le fallback `teen → common` masque le défaut à l'exécution mais ne le corrige pas.
→ Ajouter `notes_placeholder` (tutoiement) dans `fr/teen.json` et `en/teen.json`.
*(mood_tracker.notes_placeholder est aussi absent côté teen — à vérifier/cleaner.)*

### 6. [Build] `tsconfig.tsbuildinfo` committé

`tsconfig.tsbuildinfo` apparaît dans le diff (fichier d'artefact de build incrémental
TS). → À retirer du suivi git et ajouter au `.gitignore`.

---

## ⚠️ Points d'attention

### `apps/mobile/src/screens/modules/MoodTrackerScreen.tsx`
- **[Design system — couleurs en dur]** `#F3F4F6` (l.703), `#F8FAFC` (l.743),
  `#475569` (l.824), `#FFFFFF` (l.828). L'écran médicaments utilise `colors.neutral`
  / `colors.background` pour les mêmes éléments. → Utiliser les tokens du thème.
- **[Render inline]** `rangeLabels` (objet, l.134) recréé à chaque render et passé en
  prop → `useMemo`. Tableau `(['entry','charts','month'] as Tab[])` littéral dans le
  render (l.277) → constante module-level. Callbacks `onPress={() => setActiveTab(tab)}`
  non mémoïsés dans un `.map`.
- **[config-first]** `DIMENSION_COLORS` (l.60) ré-hardcode les hex déjà présents en
  base dans `field_props` (`color`) du seed. Source de vérité dédoublée pour les
  couleurs de dimensions.

### `apps/mobile/src/components/features/TimeRangeCharts/` (LineChart, BarChart, CompositeChart, MonthCalendar)
- **[Design system — couleurs en dur]** Nombreux gris SVG en dur (`#F1F5F9`,
  `#CBD5E1`, `#94A3B8`, `#475569`, `#64748B`, `#9CA3AF`, `#D1D5DB`, `#E5E7EB`,
  `#FFFFFF`). Les versions `ui/Chart` équivalentes utilisent `colors.border` /
  `colors.textMuted`. → Tokeniser.

### `apps/mobile/src/screens/modules/ScaleEntryScreen.tsx`
- **[i18n]** `formatEntryDate` (l.~37) hardcode `'fr-FR'` au lieu de `i18n.language`.
  Le reste de l'app dérive le locale d'i18n.

### `apps/web/src/i18n/locales/*/common.json`
- **[i18n parité fr/en]** `medication_side_effects` : `footer` présent en fr mais
  absent en en ; `new_btn` / `empty_title` / `empty_text` présents en en mais absents
  en fr.

### i18n teen — lacunes pré-existantes
- `mood_tracker` et `medication_side_effects` ont plusieurs clés `common` sans variante
  `teen` (label, description, dim_mood/energy/pleasure, scale_*…). Pré-existant (le
  fallback fonctionne), mais à régulariser au regard de la règle d'or.

### `apps/web/src/components/ui/Chart/BarChart.tsx`
- **[Design system web]** Styles inline littéraux (`gap: 3`, `borderRadius: '3px 3px
  1px 1px'`). Acceptable pour un primitif data-viz mais à surveiller (le reste utilise
  `var(--color-*)`).

### Documentation
- **[docs/services.md]** Non mis à jour pour les nouvelles fonctions de service
  `fetchModuleEvents`, `getAllRoutinesForPatient`, `logScaleSubmission`.

---

## ✅ Points positifs
- **`ui/Button` étendu avec `iconLeft`** (+ type `ReactNode` documenté, style
  `withIcon`) — extension propre du primitif, exactement le comportement attendu.
- **`ui/Card` étendu avec `onPress` + `accessibilityLabel`** — extension propre, rend
  la carte pressable sans dupliquer le composant.
- **`MedicationSideEffectsHistoryScreen`** : réutilisation exemplaire de `ui/Button`,
  `Card`, `EmptyState`, `PillSelector`, `Chart`.
- **`SYMPTOM_KEYS` dérivé de `SCALE_SCORING[...].chips`** — pas de redéclaration de la
  liste des symptômes (config-first respecté).
- **`seed.sql`** : tous les `text_code` sont des clés i18n, inserts idempotents
  (`on conflict do nothing`), commentaire MDR sur la neutralité des couleurs d'options.
- **`preview_kind` renommé `mood_tracker` → `slider_dashboard`** (HomeScreen) — suit la
  règle « nommer un layout par son motif, pas par un module ».
- **`ui/Chart`** : primitives pures, tokenisées, documentées (design-system.md) et
  testées (BarChart/LineChart web + mobile).
- **`QuestionnaireLayout`** : ajout `mid_hint_code` propre (extension, i18n via `t()`).
- **`useTeen` + `TeenAccent`** présents sur les deux écrans de module ; mocks de test
  conformes.

---

## Checklist finale
### coding-standards.md
- [x] Zéro Supabase/SQLite dans les composants → **❌ violation #3**
- [x] TypeScript strict → **❌ CI typecheck-mobile #1** (pas de any/as any/suppression manuelle néanmoins)
- [ ] Zéro allocation inline dans le render → ⚠️ MoodTrackerScreen
- [x] Architecture ui/ vs features/ respectée
- [x] Un seul composant par fichier
- [x] Primitives RN correctes (Pressable, expo-image)
- [ ] Design system — zéro valeur hardcodée → ⚠️ couleurs en dur
- [ ] i18n — parité fr/en + teen → **❌ #5** + ⚠️ parité web
- [x] Sécurité — pas de nouvelle table Supabase (mood_markers est SQLite local)
- [x] Schéma — pas de DDL Supabase touché
### config-first.md
- [x] Contenu de module en base (seed) — respecté ; ⚠️ DIMENSION_COLORS dédoublé
### sync-service.md
- [ ] `dbSave`/`dbDelete` encapsulés dans syncUpsert/syncDelete → **❌ #3 (mood_markers + deleteScaleEntry brut)**
### CLAUDE.md
- [x] MDR 2017/745 — conforme
- [ ] Composants existants réutilisés/étendus avant création → **❌ #2 (duplication charts)**
- [x] Mode Ado (useTeen + TeenAccent + mock)
- [x] Parité web ≡ mobile
### Étape 5
- [ ] Tests — chaque source créé a son test → **❌ #4**
- [x] Documentation — modules.md / mood_tracker.md / medication_side_effects.md / design-system.md mis à jour ; ⚠️ services.md manquant
- [x] Chaque composant ui/ ajouté a une section de doc (Chart, PillSelector)
- [ ] Zéro texte en dur → globalement OK (clés i18n) ; ⚠️ `'fr-FR'` locale
