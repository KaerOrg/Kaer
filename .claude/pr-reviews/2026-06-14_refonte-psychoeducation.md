---
date: 2026-06-14
branch: refonte/psychoeducation
pr_number: 51
pr_url: https://github.com/KaerOrg/Kaer/pull/51
ci_pass: true
merge_clean: false
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 3
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 7
files_created: 21
files_modified: 50
rules_enriched: 0
---

# PR Review — refonte/psychoeducation
Date : 2026-06-14

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, 187 warnings préexistants `jsx-no-bind`) |
| test-web | `cd apps/web && npx vitest run` | ✅ (672 passés, 6 todo) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (742 passés) |

## Synchronisation avec main
- Merge `origin/main` : **conflits résolus** (la branche était basée sur un `main` antérieur à la migration react-query).
- Fichiers en conflit résolus :
  - `apps/mobile/src/screens/modules/ModuleContentScreen.tsx` — config patient migrée vers react-query (`useQuery` + `useRefreshOnFocus`), généralisée à `CONFIG_LAYOUTS` (inclut `psyedu_library`).
  - `apps/web/src/pages/ModuleCatalogPage/ModuleCatalogPage.tsx` — adoption de `useTagFilters` + `catalogQueries` (la logique taxonomie de la branche était déjà extraite côté main).
  - `apps/web/src/pages/PatientPage/PatientPage.tsx` — adoption react-query ; ajout des queries `libraryTopics`/`themes`.
  - `apps/web/src/pages/PatientPage/tabs/PatientModulesTab.tsx` — `useTagFilters` + helpers `isPreviewOpen`/`isDataOpen` de main, préservation des features psyedu (PsychoLibraryPicker, libraryTopics, themes) ; nettoyage de 2 doublons d'auto-merge (`ACTIVE_FILTER_THRESHOLD` dupliqué, `EMPTY_TAXONOMY` orphelin).
  - `docs/spec/module-taxonomy.md` — statut « implémentée » (côté main).
- **Bug d'auto-merge silencieux corrigé** : l'auto-merge a réintroduit `fetchPsychoCards`/`PsychoCardInfo` (système de cartes psychoeducation de main) que la refonte a remplacés par la bibliothèque (`libraryTopics` + `themes`). Le `tsc` a échoué (TS2305 + TS6133). Suppression du plumbing mort (`catalogQueries.psychoCards`, `EMPTY_CARDS`, `psychoCardsQuery`) et ajout d'un factory `psyeduQueries` react-query pour `libraryTopics`/`themes`. CI verte après correction.

## Fichiers analysés (périmètre `origin/main...HEAD`)
- Créés : 21 fichiers
- Modifiés : 50 fichiers

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 3 (tests manquants) |
| ⚠️ Points d'attention | 7 |
| ✅ Conformes | reste du périmètre |

---

## 🚫 VETO MDR
Aucun. La bibliothèque psychoéducation **affiche** du contenu éditorial débloqué par le praticien et un statut « lu / non lu » factuel. Aucun seuil, score, alerte, comparaison à une norme ni codage couleur de gravité clinique. `CheckCircle2` (vert) = affordance « lu », pas une interprétation. **Conforme.**

---

## 🚫 Violations bloquantes
> Empêchent le merge. (Étape 5.1 — toute source créée avec logique/callbacks a un test couvrant rendu + interaction.)

### `apps/web/src/components/features/ThemeSuggestionButton/ThemeSuggestionButton.tsx`
**[Tests]** Composant avec logique (modale, appel service `submitThemeSuggestion`, toast succès/erreur, état `saving`/`text`) **sans fichier de test**.
→ Ajouter `ThemeSuggestionButton.test.tsx` : rendu, ouverture modale, submit OK (toast success), submit KO (toast error), bouton désactivé si texte vide.

### `apps/web/src/components/features/ModuleRenderer/layouts/PsyEduLibraryLayout/PsyEduLibraryLayout.tsx`
**[Tests]** Layout avec fetch (`fetchLibraryTopics` + `fetchThemes`), groupement par thème, accordéon (`openId`), états loading/error/empty — **sans test** (la version mobile, elle, a `PsyEduLibraryLayout.test.tsx`).
→ Ajouter un test : rendu groupé, expand/collapse, état vide, état erreur.

### `apps/web/src/pages/PatientPage/tabs/PsychoLibraryPicker.tsx`
**[Tests]** Composant complexe (filtrage par facettes restreintes aux tags présents, recherche tokenisée, groupement par thème, sélection multiple) **sans test**.
→ Ajouter un test : filtrage par tag, recherche, toggle de sélection, libellés `unlock` vs `edit`, compteur singulier/pluriel.

---

## ⚠️ Points d'attention
> Ne bloquent pas le merge mais doivent être adressés.

### `apps/mobile/.../layouts/PsyEduLibrary/PsyEduLibraryLayout.tsx`
**Ligne 141-148 — [Design system]** Le bouton « marquer comme lu » est un `Pressable + Text + styles.readBtn/readBtnText` stylé en bouton primaire (`backgroundColor: colors.primary`, texte blanc) alors que `ui/Button` (variant `primary`) existe. Anti-pattern explicitement listé dans coding-standards (incident `CrisisCompanionLayout`).
→ Remplacer par `<Button variant="primary">`.

**Ligne 215-224 — [Design system]** Les lignes de fiche (`row` = `View` bord + radius + padding, navigable via `onPress`) reproduisent une carte cliquable : `ui/Card` avec `onPress` couvre le besoin. Reste cohérent avec le `PsyEduLayout` existant, d'où le niveau « attention » et non bloquant.

### `apps/web/.../PsyEduLibraryLayout.tsx` & `PsychoLibraryPicker.tsx`
**[Architecture post-merge / react-query]** Ces deux surfaces lisent les données via appel service direct + `useState`/`useEffect` (web `PsyEduLibraryLayout`) ou état local, alors que le merge a introduit react-query et qu'un factory `psyeduQueries` existe désormais. Pour la cohérence avec le reste du web post-merge, le layout web `PsyEduLibraryLayout` gagnerait à utiliser `useQuery(psyeduQueries.libraryTopics()/themes())` au lieu du `Promise.all` manuel.
→ Migrer le fetch du layout web vers `psyeduQueries`.

### `apps/web/.../PsyEduLibraryLayout.tsx`
**Ligne 80-98 — [Design system]** L'accordéon est fait main (`<button>` + chevrons + `aria-expanded`) alors que `ui/Accordion` existe. Reste aligné sur le style `psyedu__row` existant du `PsyEduLayout` → « attention ».

### Documentation
**[Doc — module-engine]** Le nouveau `preview_kind` **`psyedu_library`** (layout web + mobile) n'est pas ajouté à l'inventaire des layouts de `docs/module-engine.md`.
**[Doc — design system]** Les nouveaux composants web `ThemeSuggestionButton`, `PsychoLibraryPicker` et le layout `PsyEduLibraryLayout` ne sont pas documentés dans `apps/web/docs/design-system.md` (§5.2.1). La feature est bien documentée au niveau spec (`docs/spec/refonte-psychoeducation.md` créé, `docs/modules/psychoeducation.md` mis à jour), d'où le niveau « attention ».

### `supabase/migration_psyedu_refonte_p0.sql` vs `supabase/seed/psyedu_themes_seed.sql`
**[Seed]** La migration P0 seed inline **2 thèmes** (`treatment`, `lifestyle`) tandis que le seed dédié en déclare **3** (`understanding` en plus). Risque d'incohérence si la migration est appliquée seule en prod sans rejouer le seed.
→ Aligner la migration P0 sur les 3 thèmes, ou retirer le seed inline de la migration et renvoyer au seed dédié.

### Tests secondaires
**[Tests]** `apps/web/src/hooks/queries/psyeduQueries.ts` (ajout merge) et `apps/web/src/pages/PatientPage/hooks/usePsychoEducationPicker.ts` (modifié) sans test. `psyeduQueries` reflète `catalogQueries` (lui-même non testé) → mineur. `usePsychoEducationPicker` porte de la logique de sélection : un test serait bienvenu.

### Lint
**[jsx-no-bind]** Callbacks fléchés inline dans le JSX des nouveaux composants (`onClick={() => setOpen(true)}`, `onChange={() => onToggle(topic.id)}`…) → warnings `react/jsx-no-bind` (187 au total, pattern préexistant projet, non bloquant en CI).

---

## ✅ Points positifs

- **Edge function `send-theme-suggestion`** : identité dérivée du JWT (jamais du payload client), rate-limit par **hash d'IP** (jamais l'IP en clair), `escapeHtml` sur tout contenu injecté dans l'email, `theme_suggestions` en RLS **sans policy client** (insertion service_role uniquement). Sécurité exemplaire.
- **Couches respectées** : `PsychoLibraryPicker` est purement présentationnel (données + callbacks injectés par props) ; l'orchestration (sélection, save) vit dans la page / le hook parent.
- **`markTopicRead` (mobile)** documente explicitement en JSDoc pourquoi il échappe à `syncHelpers` (écriture directe sur `patient_modules.config`, pas de SQLite local) — exactement le protocole d'exception de `sync-service.md`.
- **Schéma source de vérité** : `psyedu_themes`, `module_topics`, `psyedu_topic_tags`, `theme_suggestions` + colonnes `psyedu_topics.theme_id/reviewed_at` toutes répercutées dans `supabase/schema.sql`, **RLS activée partout**, seeds **idempotents** (`on conflict do update/nothing`), migration de config patient `unlocked_cards → unlocked_topics` idempotente.
- **Config-first** : zéro prose en base. Libellés de thèmes/fiches via clés i18n dérivées des rows (`theme.<id>`, `<module_key>.<topic_key>.title/summary`), tags/thèmes en table.
- **i18n** : parité fr/en complète sur les 20 clés `patient.psycho_*` ; teen géré via namespace `psyedu_teen` (`localizeKey` priorise teen puis common).
- **Services** `psyeduService` / `themeSuggestionService` : typés (zéro `any`/`unknown`), caches avec `clearPsyEduCache()` exporté, **tests présents**, JSDoc.
- **Dispatcher** câblé web + mobile pour `psyedu_library` (+ `FIELDLESS_LAYOUTS`), `previewKindCoverage.test.ts` mis à jour, `PreviewKind` étendu dans `packages/shared`.

---

## Checklist finale

### coding-standards.md
- [x] Zéro Supabase/SQLite dans les composants (services partout ; layouts ModuleRenderer = pattern établi)
- [x] Feuilles présentationnelles (PsychoLibraryPicker props+callbacks)
- [x] TypeScript strict (zéro any/as unknown/suppression)
- [x] i18n — zéro texte en dur code + base (clés dérivées) ; parité fr/en ; teen via psyedu_teen
- [x] Sécurité — RLS sur toutes les nouvelles tables, JWT côté edge function
- [x] Schéma — schema.sql à jour
- [~] Design system — `readBtn` mobile et accordéon web faits main (attention)

### config-first.md
- [x] Zéro tableau TS décrivant le contenu d'un module — tout en base (themes, topics, tags)

### sync-service.md (mobile)
- [x] `markTopicRead` : exception documentée en JSDoc (écriture Supabase directe, pas de SQLite)

### CLAUDE.md
- [x] MDR 2017/745 — aucun seuil/alerte/interprétation
- [~] Composants existants réutilisés/étendus (Button/Card/Accordion à privilégier sur 3 endroits)
- [x] Parité web ≡ mobile — layout `psyedu_library` présent des deux côtés

### Obligatoires pour toute nouvelle feature (Étape 5)
- [ ] **Tests** — 3 composants web sans test (ThemeSuggestionButton, PsyEduLibraryLayout web, PsychoLibraryPicker) → **bloquant**
- [~] **Documentation** — spec + doc module présentes ; module-engine.md (layout) et design-system.md (composants) à compléter
- [x] **Zéro texte en dur** — code et base/seed conformes
