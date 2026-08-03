# PR Review — refonte/nommer-nuances-k5 (#276)
Date : 2026-08-02

> **Base = `refonte/nommer-familles-k4` (pas `main`).** PR empilée (stacked) : la branche embarque tout le train K‑1 / K‑4 / K‑10 en plus du K‑5. Le vrai apport K‑5 (« nuance avec sa définition, mots en chips, élagage ») a été revu en profondeur ; les fichiers K‑1/K‑4/K‑10 ont déjà leurs rapports archivés dans la PR elle-même. Merge `main` **non exécuté** volontairement (base ≠ `main`).

## CI GitHub Actions
| Job | Commande | Statut |
|---|---|---|
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 1311 tests / 189 suites |
| typecheck-web / lint-web / test-web | — | N/A — **0 fichier web** dans le diff |

## Fichiers analysés
- Périmètre K‑5 réel : `TreeSelectorOptionCard.tsx` (A), `TreeSelector*.tsx`, `useTreeSelectorFlow.ts`, `helpers.ts`, `types.ts`, `styles.ts`, `TreeSelectorLayout.tsx`, `migration_emotion_wheel_nuances_k5.sql`, `seed.sql`, locales `common`/`teen`.

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 1 |
| ⚠️ Points d'attention | 4 |

---

## 🚫 Violation bloquante

### `apps/mobile/src/i18n/locales/{fr,en}/teen.json` — parité teen rompue (node_def × 45 + skip_btn)

Le cœur du K‑5 est **d'afficher une définition sous chaque nom** (familles + nuances). Ces définitions sont dans `common.json` sous `modules.emotion_wheel.node_def.*` : **45 clés**. Or `teen.json` (fr **et** en) en contient **0**. `skip_btn` est également absent du teen. Seul `stop_hint` a été porté.

Constat mesuré :
```
HEAD  : common node_def = 45  |  teen node_def = 0   (skip_btn: teen absent)
BASE  : common node_def =  8  |  teen node_def = 8   ← parité correcte sur la base
```
→ Sur la branche de base (`k4`), la parité teen était **correcte** (8/8, corrigée après la leçon K‑4). Cette branche K‑5, forkée **avant** ce correctif, n'a jamais eu de `node_def` en teen et a étendu `common` à 45 sans rien porter en teen. C'est une **régression** d'une parité déjà acquise, et la **troisième récurrence** de la leçon `lessons.md § Mode ado — parité teen partielle` (K‑4, 2026‑08‑02).

`emotion_wheel` est un module **applicatif** (pas une échelle validée) → la règle « L'absence dans teen est un bug bloquant pour toute clé de module » s'applique sans exemption. Le fallback i18next masque le trou au runtime (contenu à registre neutre : listes nominales), d'où l'invisibilité en test — mais c'est exactement le piège documenté.

**Correctif attendu** : porter les **45 `node_def.*` + `skip_btn`** dans `fr/teen.json` et `en/teen.json` (contenu identique acceptable, registre déjà neutre). Note : `label`/`title` absents du teen sont **intentionnels** et verrouillés par `emotionWheelNaming.guard.test.ts` (un seul nom) — ne pas les ajouter.

> Lien avec le point d'attention #2 (rebase) : une fois la branche rebasée sur `k4`, le merge ramènera les **8** `node_def` de familles côté teen, mais les **37 définitions de nuances** introduites par K‑5 resteront à porter. Le correctif reste dû.

---

## ⚠️ Points d'attention

### 1. Sortie « Je ne sais pas trop » morte dans le module (`onSkip` jamais câblé)
`TreeSelectorNavigation.tsx:140` ne rend le bouton skip + `stopHint` que si `onSkip` est fourni. Mais `TreeSelectorLayout.tsx:126‑138` monte `<TreeSelector>` **sans passer `onSkip`** (aucun handler de skip n'existe dans le layout). Résultat : `skip_btn` + `stop_hint` — stylés (`styles.skipBtn`/`stopHint`), traduits, testés au niveau primitive — sont **inatteignables** dans `emotion_wheel`. Tout l'investissement K‑4/K‑5 sur cette porte de sortie est inerte.
→ Soit câbler `onSkip` dans le layout (ex. « quitter la sélection sans enregistrer » → retour historique), soit retirer les textes/styles morts. En l'état, on traduit et on maintient (cf. violation ci-dessus) une fonctionnalité que le patient ne voit jamais.

### 2. Branche non rebasée sur sa base → diff pollué + régression de parité
Le `merge-base` avec `origin/refonte/nommer-familles-k4` est `9524342` (un commit *notifications*, très ancien), donc le diff GitHub agrège K‑1/K‑4/K‑10 déjà traités en parallèle, et c'est précisément ce décalage qui provoque la régression teen ci-dessus. Rebaser `refonte/nommer-nuances-k5` sur la tête de `refonte/nommer-familles-k4` **avant merge** : le diff se réduira au seul K‑5 et le trou de parité teen deviendra explicite (au lieu d'être masqué par la divergence).

### 3. Design system : `TreeSelectorOptionCard` reconstruit une carte + un bouton à la main
`TreeSelectorOptionCard.tsx` : le conteneur est un `View` (`styles.optionCard` = fond/bordure/radius/ombre) qui reproduit `ui/Card`, et l'en-tête tappable est un `Pressable` + `accessibilityRole="button"` qui reproduit une surface-bouton. Les feuilles, elles, réutilisent bien `ui/Chip` (👍).
→ Non classé bloquant car interne au **primitive composite** `ui/TreeSelector`, dont toute l'implémentation (`styles.ts` : `startBtn`, `skipBtn`, `stepContinueBtn`, `validateHereBtn`, `primaryCard`…) est déjà hand-rollée — c'est cohérent avec le primitive, pas un bypass depuis un `features/`/écran. Recommandation de fond : à terme, faire composer `ui/Card` + `ui/Button` **par le primitive lui-même** (dette pré-existante, hors périmètre K‑5).

### 4. Commentaires légèrement périmés
- `types.ts:20‑24` — la JSDoc de `definition` dit « affichée sous le titre, **au niveau 1** », or K‑5 l'affiche aussi aux niveaux ≥ 2 (`TreeSelectorOptionCard`). Actualiser.
- `helpers.ts:138` — `... as McIcon` sur une string issue de la BDD : narrowing `string → union` non vérifié (pré-existant, motif courant pour les noms d'icônes DB). À surveiller, non bloquant.

---

## ✅ Points positifs
- **Séparation des couches exemplaire** : `TreeSelectorLayout` (wrapper métier : parse config DB, service, i18n) → `ui/TreeSelector` (100 % présentationnel, tout par props) → `useTreeSelectorFlow` (machine d'état pure, `mode` discriminé, `useCallback` + functional setState partout). Aucune fuite service/persistance/i18n de domaine dans le primitive.
- **Config-first** : les 37 définitions de nuances vivent en base (`field_props.def` → clé i18n, jamais de prose), migration **idempotente** (`ON CONFLICT DO UPDATE`), `seed.sql` aligné (37 defs présentes, 32 nœuds élagués absents, 0 prose).
- **Sécurité donnée patient** : l'élagage supprime des nœuds de taxonomie mais **conserve les clés i18n des mots retirés** et documente le repli via `text_code` du chemin persisté — aucune entrée patient cassée.
- **MDR 2017/745** : définitions descriptives, couleurs = identité de famille (jamais gravité), zéro seuil/alerte. Conformité explicitée en tête de migration.
- `ui/Chip` réutilisé pour les feuilles ; alias `@ui`/`@theme`/`@services` respectés ; zéro tiret long dans l'i18n et la prose ajoutées ; garde-fou de renommage (`emotionWheelNaming.guard.test.ts`) ; nouveau comportement (expand/chips/définition) couvert par les tests.

---

## Checklist finale
- [x] MDR — aucun seuil/alerte/interprétation
- [x] Zéro Supabase/SQLite en composant ; couches respectées (feuilles présentationnelles)
- [x] TypeScript strict (mobile `tsc` vert) — 1 `as McIcon` pré-existant noté
- [x] Config-first (défs en base, seed idempotent aligné)
- [x] Design system — `ui/Chip` réutilisé ; carte/bouton hand-rollés = dette du primitive (pt #3)
- [ ] **i18n — parité teen** : `node_def.*` (45) + `skip_btn` absents de teen 🚫
- [x] Schéma — migration ponctuelle + `seed.sql` (pas de nouvelle table → RLS N/A)
- [x] Tests présents et verts (1311/1311)
- [ ] Câblage `onSkip` manquant (fonction morte, pt #1)
