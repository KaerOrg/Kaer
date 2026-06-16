---
date: 2026-06-15
branch: refonte/agenda-sommeil
pr_number: 54
pr_url: https://github.com/KaerOrg/Kaer/pull/54
ci_pass: false
merge_clean: false
violations:
  mdr: 0
  data_access: 0
  typescript: 1
  i18n: 0
  tests: 2
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
  punctuation: 1
warnings: 11
files_created: 11
files_modified: 23
rules_enriched: 1
---

# PR Review — refonte/agenda-sommeil (PR #54)
Date : 2026-06-15

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ❌ (1 error **pré-existant sur `main`**, hors PR) |
| test-web | `cd apps/web && npx vitest run` | ✅ 747 passed |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 747 passed |

> **lint-web** : l'unique erreur est `apps/web/src/components/ui/Drawer/Drawer.tsx:99 — Cannot access refs during render`. Ce fichier **n'est pas modifié par la branche** et l'erreur **existe déjà sur `origin/main`**. Elle n'est donc pas imputable à cette PR (à corriger séparément sur `main`). Le reste du job ne remonte que des *warnings* `react/jsx-no-bind` pré-existants.

## Synchronisation avec main
- Merge `origin/main` : **conflits résolus** (commit `6b1653d`).
- Fichiers en conflit résolus : `apps/mobile/src/i18n/locales/{en,fr}/{common,teen}.json`, `apps/web/src/i18n/locales/{en,fr}/common.json`, `apps/web/.../SleepJournalLayout/SleepJournalLayout.tsx`.
- Résolutions : contenu refonte (HEAD) conservé ; **tirets longs/demi (U+2014/U+2013) bannis** corrigés dans les chaînes i18n résolues (`empty_day`, `quality_not_set`) ; layout web → fusion des **icônes HEAD + import `Button` de main** (les deux utilisés dans le corps) ; ajout du `footer` CSD côté `en` web pour parité fr/en. JSON revalidés.

## Fichiers analysés
- Créés : 11 (8 sous-vues mobile `SleepJournal/`, `SleepDataPanel.tsx` + `.css` web, `docs/spec/refonte-agenda-sommeil.md`)
- Modifiés : 23 (services, layouts, locales, seeds, docs)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 4 |
| ⚠️ Points d'attention | 11 |
| ✅ Conformité forte | sync, config-first, i18n, MDR, parité web≡mobile |

---

## 🚫 VETO MDR
Aucun. La conformité MDR est **exemplaire** : calendrier mensuel en encodage neutre (« nuit renseignée vs non », commenté), valeurs brutes/calculées sans seuil ni label clinique côté patient, efficacité affichée en `%` brut. Le codage visuel praticien (courbes/grille) est justifié et documenté.

---

## 🚫 Violations bloquantes

### `apps/mobile/.../SleepJournal/SleepEntryView.tsx`
**Lignes 116 et 131 — [Suppressions interdites]**
`// eslint-disable-next-line react-hooks/exhaustive-deps` (×2) — interdit par coding-standards.md § « Suppressions interdites ».
→ `lbl` (utilisé l.88 et l.122) est omis des deps ; c'est un `useCallback` **stable** côté parent. L'ajouter aux tableaux de deps de `handleSave` / `handleDelete` supprime le besoin du disable.

### `apps/mobile/.../SleepJournal/SleepMonthView.tsx` + `apps/web/.../tabs/SleepDataPanel.tsx`
**SleepMonthView.tsx:140,144,148,152 — SleepDataPanel.tsx:91,95,99,103 — [Ponctuation : tiret long]**
Placeholder de valeur absente écrit `'–'` (U+2013, demi-cadratin). La règle « pas de tiret long » impose le **trait d'union simple `-`** pour un placeholder de valeur absente.
→ Remplacer les 8 occurrences `'–'` par `'-'`.

### `apps/mobile/.../SleepJournal/sleepHelpers.ts`
**[Tests obligatoires]** Fichier de **helpers purs créé** (date-math : `sleepMinutes` passage minuit, `firstWeekday` index lundi, `daysInMonth`, `lastNDays`, `toYearMonth`…) **sans `sleepHelpers.test.ts` dédié**. Logique à cas limites, couverte seulement indirectement via le test d'intégration.
→ Ajouter `sleepHelpers.test.ts` (cas limites). Cf. coding-standards.md « faux sentiment de couverture ».

### `apps/web/src/pages/PatientPage/tabs/SleepDataPanel.tsx`
**[Tests obligatoires]** Composant créé **avec logique** (géométrie `noonAxisPos`/`barGeometry`, agrégats `avg`, memos, grille) et **aucun test** (ni rendu, ni helpers). Le calcul cœur (efficacité/TST) est testé dans `engagementService.test.ts`, mais la géométrie noon→noon (wrap minuit) ne l'est pas.
→ Ajouter `SleepDataPanel.test.tsx` (rendu + stats/placeholders) ; idéalement extraire `noonAxisPos`/`barGeometry` dans un `sleepGrid.ts` testé (cf. « un fichier = un composant »).

---

## ⚠️ Points d'attention

### `apps/mobile/.../SleepJournal/` (rendu)
- **Callbacks inline dans le render** (reproche récurrent) : `SleepEntryView` (nombreux `onPress/onOpen/onClose={() => …}`, `onChangeText`), `SleepListView.tsx:78` (`onPress={() => onOpenEntry(date)}` **dans un `.map()`**), `StarRating.tsx:26`, `MinutesField`. → `useCallback` / lignes mémoïsées.
- **`SleepListView.tsx:27-28`** : `entryByDate` (Record) construit dans le render à chaque rendu → `useMemo([entries])`.
- **`TimeField.tsx:4,28`** : `TouchableOpacity` au lieu de `Pressable` (coding-standards : *Pressable > TouchableOpacity*) ; le `confirmBtn` (Pressable+Text stylé bouton, l.46-48) pourrait être `ui/Button`.
- **`SleepMonthView.tsx:66` / `SleepListView`** : `toLocaleDateString('fr-FR', …)` locale **codée en dur** → le libellé de mois reste en français en mode EN. Dériver de la langue i18n.
- **Switch on/off** (`SleepEntryView.tsx:267-269, 281-283`) : track/thumb réimplémenté **deux fois** dans le fichier. Aucun primitive `Toggle` mobile n'existe (donc pas une duplication d'un primitif), mais à extraire en composant réutilisable (`ui/`) + doc + test plutôt que dupliquer.

### `apps/web/.../tabs/SleepDataPanel.tsx` + `.css`
- **Couleurs de courbe en dur** `'#06B6D4'` / `'#6366F1'` (l.166,174) : préférer `CHART_PALETTE` (`lib/chartConfig.ts`), comme `SCALE_CONFIG`, pour la cohérence du jeu de couleurs.
- **`SleepDataPanel.css`** : `background:#fff` (l.114,152) et `px`/`font-size` bruts (tokens absents). **Cohérent avec le CSS voisin existant** (`ModuleDataPanel.css`, `PatientEvolutionTab.css` font déjà du hex/px brut) → dette de zone, pas spécifique à la PR ; idéaliser en tokens (`var(--color-*)`, `var(--spacing-*)`).

### Documentation
- **`docs/spec/refonte-agenda-sommeil.md` non indexé** dans `docs/README.md` (table des `spec/`). → ajouter la ligne.
- **Prose docs** : 32 tirets longs/demi (U+2014/U+2013) dans les lignes ajoutées de `docs/modules/sleep_diary.md` + `docs/spec/refonte-agenda-sommeil.md` (rédaction assistant). → remplacer par `:`/`,`/`.`. (Commentaires SQL de `sources_seed.sql` : même remarque, mineure.)

### Divers
- **`PatientEvolutionTab.tsx`** : `EvolutionCard` est un 2e composant dans le fichier (« un fichier = un composant ») — **pré-existant**, la PR n'a fait qu'ajouter des props `archived`. Idéal : extraire à terme. `isShown`/`isArchived` recréés à chaque rendu (mineur, prédicats locaux non passés à des enfants).

---

## ✅ Points positifs
- **Sync mobile exemplaire** : `sleepDiaryService.ts` enchaîne `syncUpsert`/`syncDelete`, `entry_kind: 'sleep_diary_entry'` **ajouté à l'union `EntryKind`** (zéro cast) ; test avec mock `RemoteSyncService` standard + assertions upsert/delete + ordre db→enqueue.
- **`engagementService.fetchSleepEvolution`** : strictement typé (zéro `any`/`as unknown`), `readStr`/`spanMinutes` propres, **testé** (happy path, sans `date`, erreur Supabase), calcul aligné CSD et conforme MDR.
- **Config-first irréprochable** : les **48 clés `lbl(...)`** du layout sont toutes définies dans le seed (`field_props`, 76 props), zéro contenu de module en dur ; `ON CONFLICT DO NOTHING`.
- **Parité i18n complète** : chaque clé `modules.sleep_diary.*` existe en `fr`/`en` **common ET teen** (mobile).
- **Parité web≡mobile (Étape 4)** : stats mensuelles + grille mobile ↔ `SleepDataPanel` web (grille agenda 24h, courbes efficacité/TST, stats moyennes). Satisfaite.
- **Découpage mobile** : layout éclaté en sous-vues focalisées (`SleepListView`/`SleepEntryView`/`SleepMonthView` + `TimeField`/`MinutesField`/`StarRating` + `sleepHelpers`/`types`), couvert par **12 tests d'intégration** (liste/saisie/mois, save, validation, compteur, switch, suppression, navigation).
- **Design system** : usage correct de `ui/Button` (`fullWidth`, `iconLeft`, `loading`, `variant="danger"`), `ui/Card` (`variant="elevated"`, `onPress`), `Toggle` (feature archivage web), `ConfirmDialog`, `useToast`.
- **Migrations SQLite idempotentes** (`ALTER … ADD COLUMN`) ; **`sources_seed.sql` idempotent** (`on conflict (id) do update`), 7 sources avec PMID vérifiés.
- **Feature « archivage »** : union discriminée propre dans `engagementQueries.ts`, `Promise.all` pour les fetches indépendants, bascule via `Toggle`.

---

## Checklist finale
- [x] Zéro Supabase/SQLite **brut** dans les composants (lecture via fns typées de `lib/database` = pattern établi des layouts ; écritures via service + sync)
- [x] Feuilles présentationnelles : `SleepDataPanel`/sous-vues reçoivent données + callbacks par props
- [ ] **TypeScript strict** : 2× `eslint-disable` à retirer (sinon zéro `any`/`as unknown`)
- [ ] Zéro allocation inline dans le render (callbacks inline — point d'attention)
- [x] Architecture ui/ vs features/ respectée
- [x] i18n — zéro texte en dur (code + seed) + parité fr/en + teen
- [x] Sécurité/Schéma — pas de nouvelle table Supabase ; SQLite schéma + migrations à jour
- [x] config-first — contenu en seed, zéro tableau TS
- [x] sync-service — `syncUpsert`/`syncDelete` + `EntryKind` + mock test
- [x] MDR 2017/745 — affichage neutre, aucun seuil/label automatique côté patient
- [x] Parité graphique web ≡ mobile
- [ ] **Tests** — manquent `sleepHelpers.test.ts` et `SleepDataPanel.test.tsx`
- [ ] **Doc indexée** — `docs/spec/refonte-agenda-sommeil.md` à ajouter dans `docs/README.md`
- [ ] **Tiret long** — `'–'` placeholders (×8) + prose docs (×32) à corriger
