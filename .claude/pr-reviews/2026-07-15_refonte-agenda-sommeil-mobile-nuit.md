---
date: 2026-07-15
branch: refonte/agenda-sommeil-mobile-nuit
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
files_created: 8
files_modified: 12
rules_enriched: 0
---

# PR Review — refonte/agenda-sommeil-mobile-nuit
Date : 2026-07-15

## CI GitHub Actions
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 errors, 194 warnings préexistants hors périmètre) |
| test-web | `cd apps/web && npx vitest run` | ✅ 1094 passed (dont guard field_props atomiques) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 1106 passed |

## Synchronisation avec main
- Merge `origin/main` : propre (already up to date)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 8 (ProgressRing ×3, SleepBilanView +test, SleepEvolutionView +test, SleepNightRow +test)
- Modifiés : 12 (SleepJournalLayout, SleepListView, SleepMonthView, SleepEntryView, sleepHelpers +test, styles, database, i18n ×4, seed, design-system.md, FieldRenderer.sleep_journal.test)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | reste |

---

## 🚫 VETO MDR
Aucun. Affichage neutre confirmé : barre « fenêtre de sommeil » et anneau d'efficacité
mono-couleur (`colors.primary`), aucun seuil déclencheur, aucun label clinique, aucune
ligne de tendance calculée (courbe brute nuit-par-nuit + moyennes hebdo brutes),
note explicite « L'analyse de votre évolution se fait avec votre praticien ». Le teal
code « renseigné », jamais la qualité.

## 🚫 Violations bloquantes
Aucune.

## ⚠️ Points d'attention

**1. Parité web ≡ mobile — écran Évolution (différée, dans le périmètre de #157)**
Le nouvel écran Évolution (LineChart nuit-par-nuit + BarChart hebdo) n'a pas d'équivalent
web praticien dans cette PR. C'est **explicitement hors périmètre** : l'épic #158 scinde
mobile (#155, ce ticket) et web (#157, ticket 2/2 — « Vue patient identique au mobile,
page Évolution clinique »). À traiter dans #157. Non bloquant ici.

**2. `SleepListView` — `entryByDate` reconstruit à chaque rendu (préexistant)**
`const entryByDate = {}` + boucle dans le corps du composant (non mémoïsé). Coût O(n)
faible, motif hérité de l'ancienne version. Mémoïsable via `useMemo` si besoin.

**3. Lectures via `lib/database` directement dans le layout (convention du module)**
`getSleepEntriesForRange` ajouté à `lib/database.ts` et appelé depuis l'orchestrateur,
comme `getAllSleepEntries`/`getSleepEntriesForMonth` déjà en place. Les écritures passent
bien par `sleepDiaryService` (`syncUpsert`/`syncDelete`). Cohérent avec le pattern de
lecture existant du module (lib/database = wrapper SQLite autorisé). Non bloquant.

## ✅ Points positifs
- **Nouveau primitive `@ui/ProgressRing`** : générique (zéro métier, tout par props),
  mono-couleur MDR-neutre, **documenté** (design-system.md : section + table props +
  exemple) **et testé** (rendu, label, a11y, clamp). Comportement attendu.
- **Réutilisation du design system** : SegmentedControl, Chart (LineChart/BarChart), Card,
  Button, TimePicker, RatingSelector — aucune réimplémentation ad hoc.
- **Couches propres** : l'orchestrateur possède toutes les données (entries/mois/plage) ;
  les vues (Bilan/Mois/Évolution/NightRow/List) sont présentationnelles (données + callbacks
  par props). SleepBilanView ne possède que l'onglet actif (état de vue local).
- **Dates locales** : nouveaux helpers via `@kaer/shared` (dateToIso/shiftDate/todayIso/
  mondayOf) ; `yesterdayDateStr`/`lastNDays` migrés de `toISOString` (bug fuseau) vers le
  local. Agrégations pures testées (26 cas).
- **i18n** : parité fr/en (common + teen), teen = tutoiement pro, seed field_props atomiques,
  aucune ponctuation tiret long dans les valeurs visibles.
- **Tests** : chaque source créé a son test direct ; l'intégration FieldRenderer mise à jour
  (renommages cta-bilan / bilan-back-button, mock getSleepEntriesForRange).

## Enrichissement documentaire
📚 lessons.md déjà à jour — aucune violation bloquante à archiver.
