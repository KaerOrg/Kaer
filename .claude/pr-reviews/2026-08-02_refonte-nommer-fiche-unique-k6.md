---
date: 2026-08-02
branch: refonte/nommer-fiche-unique-k6
pr_number: 277
pr_url: https://github.com/KaerOrg/Kaer/pull/277
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 1
  tests: 0
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 1
warnings: 4
files_created: 2
files_modified: 19
rules_enriched: 0
---

# PR Review — refonte/nommer-fiche-unique-k6 (#277)
Date : 2026-08-02

> PR empilée (base = `refonte/nommer-nuances-k5`, pas `main`). Périmètre calculé sur
> `origin/refonte/nommer-nuances-k5...HEAD` — l'étape « merge `main` » est volontairement
> **sautée** : K-5 n'est pas encore dans `main`, merger `main` polluerait le diff. À
> refaire lors du merge final de la pile (`#272 → #273 → #275 → #276 → #277`).

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ |
| test-web | `cd apps/web && npx vitest run` | ✅ 198 fichiers |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ |

## Synchronisation avec main
- Merge `origin/main` : **non effectué** (PR empilée sur K-5, hors `main`) — à traiter au merge de la pile.
- Fichiers en conflit résolus : aucun.

## Fichiers analysés
- Créés : 2 (`TreeSelectorEntrySheet.tsx`, `migration_emotion_wheel_fiche_unique_k6.sql`)
- Modifiés : 19
- Supprimés (ignorés) : `TreeSelectorContext.tsx`, `TreeSelectorIntensity.tsx`, `TreeSelectorNotes.tsx`

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 1 |
| ⚠️ Points d'attention | 4 |
| ✅ Conformes | le reste |

---

## 🚫 VETO MDR
**Aucun.** Le module est au contraire exemplaire côté MDR 2017/745 : intensité en chiffre
brut, **aucune valeur par défaut** (une valeur pré-cochée serait une réponse non donnée),
**aucun** seuil, couleur de gravité ou label interprétatif, ancrages « à peine » / « au
maximum » qui **bornent** l'échelle sans qualifier de valeur, et **non-recalcul** des
saisies antérieures (un 7/10 reste 7/10). Les commentaires de `TreeSelectorEntrySheet.tsx`,
du seed et de la migration documentent explicitement ce raisonnement. À saluer.

---

## 🚫 Violations bloquantes

### `apps/mobile/src/i18n/locales/{fr,en}/teen.json` — parité teen incomplète

**[i18n / Mode ado]** Quatre clés `modules.emotion_wheel.*` **nouvelles** sont ajoutées à
`common.json` (fr + en) mais **absentes** de `teen.json` (fr + en) :

- `intensity_anchor_min`
- `intensity_anchor_max`
- `context_other_btn`
- `context_other_placeholder`

Le bloc teen d'`emotion_wheel` est **exhaustif** (il double déjà `stop_hint`,
`validate_here_btn`, `context_title`, `context_hint`, `notes_*`, `intensity_title`, `entry_title`…),
donc ce n'est **pas** un fallback assumé mais un **oubli** — exactement le cas décrit dans
`lessons.md` § « Mode ado » pour **refonte/nommer-familles-k4 (2026-08-02)**, une PR plus tôt.
`emotion_wheel` est un module **applicatif** (pas une échelle validée), et la règle est
sans exception : « L'absence dans teen est un bug bloquant pour toute clé de module. »

Le fallback i18next masque le trou au runtime (contenu ici à registre neutre), d'où
l'invisibilité en test — mais il faut porter les 4 clés dans `fr/teen.json` et `en/teen.json`
(contenu identique acceptable puisque neutre).

> Note : `label`, `node_def`, `skip_btn`, `title` manquent aussi de teen mais sont de la
> **dette préexistante K-4/K-5** (déjà consignée), hors périmètre de cette PR — à traiter
> séparément.

Vérification :
```
[fr/en] in common but MISSING from teen:
  context_other_btn, context_other_placeholder, intensity_anchor_max, intensity_anchor_min  ← K-6 (à corriger)
  label, node_def, skip_btn, title                                                          ← dette K-4/K-5
```

---

## ⚠️ Points d'attention

### `apps/mobile/src/components/ui/TreeSelector/TreeSelectorEntrySheet.tsx:75-99` — le sélecteur d'intensité réimplémente `ui/RatingSelector`

**[Design system — Étape 4/5]** Les crans d'intensité (`intensityRow` + `intensityBtn`
`Pressable` numérotés 1..N, avec état actif/couleur/a11y) reproduisent **exactement**
`ui/RatingSelector` **variant `numbered`** (pastilles chiffrées 1..N, props `value`,
`steps`, `color`, `readonly`, `onPress`, `accessibilityState`). Le primitive existe et
n'est pas utilisé :

```tsx
// ✅ le primitive couvre le besoin — le toggle-vers-null reste au niveau du handler
<RatingSelector
  variant="numbered"
  steps={config.intensityValues}
  value={intensity}
  color={colors.primary}
  showHeader={false}                 // le gros chiffre redondant a justement été retiré
  onPress={n => onChangeIntensity(intensity === n ? null : n)}  // re-tap = désélection
/>
```

`RatingSelector.onPress` se déclenche à **chaque** tap (y compris sur le cran actif), donc
le « re-taper désélectionne » (invariant MDR) se traite proprement dans le handler, sans
extension du primitive. Les ancrages min/max restent deux `Text` en dessous.

Classé **point d'attention** et non bloquant car : (a) le motif est **repris** du composant
supprimé `TreeSelectorIntensity` (pas une invention nette de K-6), (b) l'a11y diffère
(`role="button"` + toggle ici vs `role="radio"` dans `RatingSelector`) et mérite un arbitrage.
**Fortement recommandé** de l'adopter — soit dans cette PR, soit en suivi dédié.

### `apps/mobile/src/components/ui/TreeSelector/TreeSelectorEntrySheet.tsx:173-193` + primitive entier — boutons ad hoc vs `ui/Button`

**[Design system]** `saveBtn` / `cancelBtn` sont des `Pressable + Text + styles.xxxBtn`
là où `ui/Button` (variants `primary`/`secondary`, `disabled`, `loading`) couvre le besoin.
Même constat sur les frères **préexistants** du primitive (`startBtn`, `skipBtn`,
`validateHereBtn`, `stepContinueBtn`, `backBtn`).

Il s'agit d'une **convention interne au primitive `TreeSelector`**, en place depuis K-1 et
acceptée jusqu'ici — donc de la **dette de convention**, pas un bypass introduit par K-6
seul. La règle du projet est stricte (« cohérent avec le legacy n'est pas une excuse »),
mais migrer **tout** le jeu de boutons d'un primitive composite dépasse le périmètre d'une
étape de refonte. Recommandation : **un ticket dédié** pour aligner l'ensemble du primitive
`TreeSelector` sur `ui/Button` (les boutons à accent dynamique via `style` inline).

### `apps/mobile/src/components/ui/TreeSelector/styles.ts` — 9 styles morts

**[Simplicité]** Les styles des composants supprimés (`TreeSelectorIntensity`,
`TreeSelectorNotes`) sont restés : `intensityCard`, `intensityDisplay`, `intensityValue`,
`intensityMax`, `intensityBtns`, `continueBtn`, `summaryCard`, `summaryPrimary`,
`summaryMeta` — **0 référence** hors `styles.ts`. À supprimer (la passe `simplify` le fera).

### `TreeSelector/types.ts` + `useTreeSelectorFlow`/contrat — props devenues inutilisées

**[Simplicité]** Depuis la fiche unique, ces membres du contrat ne sont plus lus par le
primitive (0 réf hors `types.ts` / tests) :
- `TreeSelectorTexts.contextHint`, `TreeSelectorTexts.notesHint` — les hints d'étape ne
  sont plus rendus (la fiche n'affiche que les titres de section).
- `TreeSelectorConfig.intensityMax` — l'historique lit `intensityMax` depuis la config du
  **layout** (`ParsedTreeConfig`), pas depuis le primitive.

Ils continuent d'être calculés et passés par `TreeSelectorLayout`. À élaguer du contrat +
du site d'appel (la passe `simplify` peut le proposer).

---

## ✅ Points positifs
- **MDR exemplaire** (cf. section VETO) — raisonnement documenté dans le code, le seed et la migration.
- **Séparation `context_other` / `context`** : le texte patient libre est stocké dans une
  colonne dédiée, **hors** du tableau de clés i18n — évite qu'un texte patient tombe dans
  `t()` et soit « traduit ». Justifié en JSDoc (`database.ts:1836`) et en commentaire de
  layout (`helpers.ts`). Excellent réflexe.
- **`useTreeSelectorFlow`** : machine d'état réduite de 5 à 3 modes, deux handlers de
  confirmation supprimés — moins d'invariants. `resetDraft` centralise la remise à zéro.
- **Synchronisation** : `treeSelectionService.saveTreeSelection` passe par `syncUpsert`
  avec `entry_kind: 'tree_selection'` (union `EntryKind`), `context_other` ajouté au
  payload — conforme `sync-service.md`, zéro cast.
- **Seed / migration** : `on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value`
  (config-first respecté), migration idempotente miroir du seed, `intensity_hint` **supprimé**
  proprement (pas laissé vide). `prop_value` atomiques (clés i18n), aucun packing.
- **Couverture de tests** : 13 cas dans `TreeSelector.test.tsx` verrouillent les invariants
  clés (aucune présélection, désélection, ancrages présents, texte libre séparé des codes
  i18n, payload complet). Le nouveau `TreeSelectorEntrySheet` est couvert via l'intégration,
  comme ses frères `Navigation`/`History` — cohérent.
- **Documentation** : `apps/mobile/docs/design-system.md` (section TreeSelector → 3 modes)
  et `docs/modules/emotion_wheel.md` (fiche unique) mis à jour dans la PR.
- **`text_code` = clés i18n uniquement** dans le seed ; parité fr/en OK côté `common`.

---

## Checklist finale

### Bonnes pratiques React / Vercel
- [x] Rules of Hooks respectées
- [x] Pas d'abonnement sans cleanup
- [x] Clés stables dans les `.map()` (`node.id`, `opt.code`, `v`)
- [x] Zéro `async` direct dans `useEffect`
- [x] Gestion d'erreur : le primitive délègue la persistance au parent (`onSubmit`) — pas de `catch` avalé

### coding-standards.md
- [x] Zéro Supabase/SQLite dans les composants (le primitive est 100 % présentationnel)
- [x] Feuilles présentationnelles — données + callbacks par props
- [x] TypeScript strict (zéro any / as unknown / suppression)
- [x] Zéro allocation inline problématique (`SELECTED_STATE` figé hors render)
- [x] Architecture `ui/` — aucun import service/store/persistance/clé i18n de domaine
- [x] Un seul composant par fichier
- [x] Primitives RN (`Pressable`)
- [x] Design system mobile : StyleSheet + tokens (zéro couleur/spacing en dur) — ⚠️ mais `RatingSelector`/`ui/Button` non réutilisés (points d'attention)
- [ ] i18n + parité teen — **4 clés manquantes dans teen.json (bloquant)**
- [x] Sécurité — pas de nouvelle table Supabase (payload jsonb opaque)
- [x] Schéma — `context_other` est une colonne **SQLite locale** (`createTreeSelectionsTable` + `ALTER TABLE`) ; rien à répercuter dans `schema.sql`

### config-first.md
- [x] Zéro tableau TS décrivant le contenu ; config en `field_props`
- [x] `prop_value` atomiques, `ON CONFLICT DO UPDATE`

### sync-service.md
- [x] `dbSave`/`dbDelete` encapsulés dans `syncUpsert`/`syncDelete`
- [x] `entry_kind` ∈ `EntryKind`, zéro cast
- [x] Mock `jest.mock('../services/sync', …)` présent dans `treeSelectionService.test.ts`

### CLAUDE.md
- [x] MDR 2017/745 — exemplaire
- [ ] Composants réutilisés/étendus avant création — **RatingSelector / ui/Button non réutilisés** (points d'attention)
- [x] Mode ado (structure) — géré au niveau layout/i18n (le primitive reçoit les libellés résolus)
- [x] Parité web ≡ mobile — module hors périmètre graphique `PatientEvolutionTab` (sélecteur d'arbre, pas de chart)

### Obligatoires pour toute feature
- [x] Tests — happy path + invariants + interactions
- [x] Documentation `.md` créée/mise à jour et indexée
- [x] Zéro texte en dur (code + seed) — sauf parité teen (bloquant ci-dessus)
