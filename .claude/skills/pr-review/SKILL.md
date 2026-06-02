---
name: pr-review
description: Valide les bonnes pratiques d'implémentation PsyTool sur la branche courante — lit chaque fichier modifié/ajouté en entier et applique toutes les règles des `.claude/rules/` (coding-standards, config-first, sync-service), plus les règles CLAUDE.md (MDR, module engine, design system, i18n, tests, doc). Triggers — "review la PR", "valide la branche", "pr-review", "vérifie les pratiques", "audit la branche".
---

# PR Review — PsyTool

Tu es un **reviewer senior** pour PsyTool. Tu lis chaque fichier modifié ou ajouté par la branche en entier, et tu appliques l'intégralité des règles du projet contre son contenu. Tu ne modifies aucun fichier (hormis la résolution de conflits à l'étape préliminaire). Tu produis un rapport structuré avec références `fichier:ligne` exactes.

---

## Étape préliminaire — Synchroniser la branche avec `main`

> **À exécuter en tout premier, avant de calculer le périmètre.** La review doit porter sur une branche à jour avec `main`, sinon le diff `main...HEAD` est faussé et des conflits restent cachés jusqu'au merge.

1. Vérifier que l'arbre de travail est propre. Si des changements non commités existent :

   ```bash
   git status --porcelain
   ```

   S'il y a des modifications non commitées → **s'arrêter** et demander à l'utilisateur de commiter ou stasher avant de relancer la review. Ne jamais merger par-dessus un arbre sale.

2. Récupérer la dernière version de `main` et la merger dans la branche courante :

   ```bash
   git fetch origin main
   git merge origin/main
   ```

3. Analyser le résultat :

   - **Merge propre (fast-forward ou auto-merge sans conflit)** → continuer directement à l'Étape 0.
   - **Conflits détectés** (`git merge` retourne un code d'erreur, `CONFLICT` dans la sortie) → passer au point 4.

4. **Résolution des conflits.** Lister les fichiers en conflit :

   ```bash
   git diff --name-only --diff-filter=U
   ```

   Pour chaque fichier en conflit :
   - Lire le fichier en entier avec `Read` pour comprendre les deux versions (marqueurs `<<<<<<<`, `=======`, `>>>>>>>`).
   - Résoudre le conflit en respectant **toutes les règles du projet** (coding-standards, config-first, MDR, i18n, design system) — la résolution ne doit jamais introduire une violation. En cas de doute sur l'intention métier d'un côté du conflit, **demander à l'utilisateur** plutôt que deviner.
   - Retirer les marqueurs de conflit et marquer le fichier résolu : `git add <fichier>`.

   Une fois tous les conflits résolus :

   ```bash
   git commit --no-edit
   ```

   Terminer le message de commit par :

   ```
   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

5. **Signaler le merge dans le rapport final** : indiquer en tête si le merge de `main` était propre ou s'il a nécessité une résolution de conflits, et lister les fichiers concernés. Les fichiers touchés par la résolution de conflits sont à inclure dans le périmètre de review de l'Étape 0.

---

## Étape CI — Reproduire exactement les checks GitHub Actions

> **À exécuter avant toute analyse de code.** Ces commandes sont copiées mot pour mot
> depuis `.github/workflows/ci.yml`. Toute divergence de commande (chemin, flag,
> outil) masque des erreurs, comme `tsc --project` ≠ `cd apps/web && tsc -b`.

Lancer les 5 jobs en parallèle (ou séquentiellement si les ressources le limitent) :

```bash
# Job: typecheck-web  (flag -b = build mode, résout les références de projet)
cd apps/web && npx tsc -b --noEmit

# Job: lint-web
cd apps/web && npx eslint .

# Job: test-web
cd apps/web && npx vitest run

# Job: typecheck-mobile  (cd obligatoire — la résolution moduleResolution:bundler
#   diffère selon le répertoire de travail, cf. expo-file-system/legacy)
cd apps/mobile && npx tsc --noEmit

# Job: test-mobile
cd apps/mobile && npx jest --passWithNoTests
```

> **Règle du `cd` :** ne jamais substituer `npx tsc --project apps/<app>/tsconfig.json`
> au `cd apps/<app> && npx tsc`. La résolution de modules change avec le répertoire
> courant (notamment `moduleResolution: "bundler"` + sous-chemins de packages sans
> champ `exports`) — ce qui passe depuis la racine peut échouer en CI.

### Interprétation des résultats

| Résultat | Action |
|---|---|
| Toutes les commandes passent (exit 0) | Continuer à l'Étape 0 |
| Au moins une commande échoue | **S'arrêter**, corriger les erreurs CI en premier, puis relancer avant de poursuivre la review |

Reporter dans le rapport final la liste des jobs CI avec leur statut (✅ / ❌).

---

## Étape 0 — Préparer le périmètre

```bash
git diff main...HEAD --name-status
```

Construire deux listes :
- **Fichiers créés** (`A`) — à analyser en entier avec toutes les rules
- **Fichiers modifiés** (`M`) — à analyser en entier avec toutes les rules

Ignorer : fichiers supprimés (`D`), `package-lock.json`, fichiers binaires, `*.snap`.

Lire les rules de référence si elles ne sont pas en contexte :
- `.claude/rules/coding-standards.md`
- `.claude/rules/config-first.md`
- `.claude/rules/sync-service.md`

---

## Étape 1 — Lire et analyser chaque fichier

Pour **chaque fichier** de la liste (créé ou modifié), dans l'ordre :

1. Lire le fichier en entier avec l'outil `Read`
2. Appliquer **toutes les sections** de rules ci-dessous qui s'appliquent à son type
3. Accumuler les violations et points d'attention

Ne pas analyser uniquement le diff — lire le fichier complet pour avoir le contexte (imports, corps des fonctions, StyleSheet en bas de fichier, etc.).

---

## Rules applicables par type de fichier

### Pour tout fichier `.tsx` ou `.ts` (composant, écran, hook, service, store)

#### RULE — Accès données : zéro Supabase/SQLite dans un composant
*(source : coding-standards.md § "Accès aux données")*

Les imports et appels suivants sont **interdits** dans tout fichier autre que `src/lib/supabase.ts` et `src/lib/database.ts` :
```
import { supabase } from   → interdit dans un composant/écran/store
supabase.from(
supabase.auth.
supabase.functions.invoke
supabase.storage.
db.execAsync(
db.runAsync(
db.getAllAsync(
```
Chercher ces patterns dans le fichier lu. Si trouvé dans un `.tsx` qui n'est pas dans `src/lib/` → **violation bloquante**.

**Exception légitime** : un store Zustand peut importer un service, pas supabase directement.

#### RULE — TypeScript strict : zéro suppressions, zéro any, zéro unknown
*(source : coding-standards.md § "Suppressions interdites" + "TypeScript strict")*

Chercher dans le fichier :
- `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck` → **violation bloquante**
- `// eslint-disable`, `// biome-ignore` → **violation bloquante**
- `: any` (type annotation) → **violation bloquante**
- `as any` → **violation bloquante**
- `as unknown` (seul ou en double-cast `as unknown as`) → **violation bloquante** — les casts via `unknown` contournent la sécurité du typage au même titre que `as any`
- `<any>` (cast JSX/TypeScript) → **violation bloquante**
- `Record<string, any>`, `Array<any>`, `Promise<any>` → **violation bloquante**
- `Function` (type brut sans signature) → **violation bloquante** : typer explicitement avec une signature `(...args) => ReturnType`
- Props de composant sans interface typée explicite (composant exporte une fonction sans `interface Props` ou type inline) → **violation**
- États sans discriminated union quand plusieurs états sont possibles → **point d'attention**

**Exception légitime** : `unknown` comme type de valeur capturée dans un `catch` (`catch (err: unknown)`) est autorisé et recommandé — ne pas le signaler.

#### RULE — Render : zéro allocation inline
*(source : coding-standards.md § "Render — zéro déclaration inline")*

Chercher à l'intérieur du corps des fonctions composant (entre `{` et `return`) :

- Objet ou tableau statique déclaré dans le render :
  ```ts
  // ❌ const MAP = { ... }  ou  const ITEMS = [...]  dans le corps du composant
  ```
  Si la valeur ne dépend pas de props/state → doit être à niveau module.

- `style={{ }}` avec des valeurs **littérales** (nombres, chaînes de couleur) — pas de calcul dynamique :
  ```tsx
  // ❌ style={{ marginTop: 12 }}  style={{ color: '#fff' }}
  // ✅ style={{ borderTopColor: accentColor }}  ← dynamique : ok
  ```

- Callback anonyme passé à un composant enfant via prop sans `useCallback` :
  ```tsx
  // ❌ <Child onPress={() => doSomething(id)} />   dans une liste ou composant mémoïsé
  ```

- Config Reanimated (`inputRange`, `outputRange`) déclarée dans le composant → doit être à niveau module.

#### RULE — Bonnes pratiques React (Vercel guidelines)
*(source : React docs + Vercel best practices)*

Ces règles s'appliquent à tous les fichiers `.tsx` / `.ts` React.

**Règles des Hooks (Rules of Hooks) — violations bloquantes :**
- Hook appelé dans une condition, une boucle, ou une fonction imbriquée (pas au niveau racine du composant) → **violation bloquante**
  ```ts
  // ❌ if (condition) { useState(...) }
  // ❌ for (...) { useEffect(...) }
  ```
- Hook appelé dans une fonction utilitaire non-composant (nom ne commençant pas par `use`) → **violation bloquante**

**Effets — violations bloquantes :**
- `useEffect` avec effet qui crée un abonnement (event listener, timer, observable, subscription) **sans fonction de cleanup retournée** → **violation bloquante**
  ```ts
  // ❌ useEffect(() => { window.addEventListener('resize', handler) }) — fuite mémoire
  // ✅ useEffect(() => { window.addEventListener('resize', handler); return () => window.removeEventListener('resize', handler) })
  ```
- `useEffect` sans tableau de dépendances (`[]`) alors que l'effet dépend de valeurs extérieures → **violation** (boucle infinie potentielle)
- `useEffect` utilisé uniquement pour transformer des données dérivables dans le render → **point d'attention** : dériver pendant le render, pas dans un effet

**Keys dans les listes — violations bloquantes :**
- `<Component key={index} />` dans une liste dont l'ordre peut changer (ajout/suppression/tri) → **violation bloquante** : utiliser un identifiant stable (`id`, `uuid`)
- Élément rendu dans `.map()` sans `key` prop → **violation bloquante**

**Memoïsation — points d'attention :**
- `React.memo` absent sur un composant enfant coûteux qui reçoit des callbacks → **point d'attention**
- `useMemo` / `useCallback` avec tableau de dépendances vide `[]` alors que la valeur dépend de props/state → **point d'attention**
- Dépendance objet non-primitif dans `useEffect` / `useMemo` / `useCallback` (objet recréé à chaque render) → **point d'attention** : stabiliser ou extraire les props primitives

**Gestion d'erreurs :**
- Composant qui peut planter (fetch, parse, valeur nullable) sans Error Boundary parent → **point d'attention**
- `async` directement dans `useEffect` (le callback ne peut pas être `async`) → **violation**
  ```ts
  // ❌ useEffect(async () => { ... })
  // ✅ useEffect(() => { const load = async () => {...}; void load() }, [])
  ```

**Patterns web (Vite / déploiement Vercel) :**
- Import dynamique (`React.lazy` / `import(...)`) sans `Suspense` wrapper → **violation**
- `console.log` / `console.debug` laissés dans le code de production → **point d'attention** (ne pas bloquer si délibéré/debug)
- Image importée avec `<img>` brut au lieu d'`expo-image` (mobile) ou d'un composant optimisé (web) → **point d'attention**

#### RULE — useState vs useRef
*(source : coding-standards.md § "React performance")*

Pour chaque `useState` trouvé dans le fichier, vérifier que la valeur **conditionne le rendu JSX**.

Signaler comme **point d'attention** si la valeur semble ne jamais apparaître dans le JSX (ex. timer ID, Map de cache, Animated.Value, snapshot de params).

#### RULE — Inputs contrôlés vs non contrôlés
*(source : coding-standards.md § "Inputs non contrôlés")*

Si un `useState('')` ou `useState<string>` est couplé à un `<input>` ou `<TextInput>` avec `value` + `onChange`/`onChangeText`, vérifier que la valeur est réellement utilisée pour piloter l'UI (validation visible, `disabled`, formatage live).

Si la valeur est uniquement lue au submit → **point d'attention** : préférer `useRef`.

#### RULE — Architecture composants : `ui/` vs `features/`
*(source : coding-standards.md § "Architecture des composants")*

Si le fichier est un **nouveau composant** (fichier créé dans `components/`) :
- Est-il dans `ui/` (primitif sans logique métier) ou `features/` (composant métier) ?
- Un composant `ui/` importe-t-il depuis `features/` ? → **violation bloquante**

#### RULE — Un seul composant par fichier
*(source : module-builder SKILL.md § 4.11)*

Chercher le nombre de déclarations `export function` ou `export const ... = (` qui retournent du JSX dans le fichier. Si > 1 → **violation**.

Exception : fichiers `index.ts` de ré-export uniquement.

#### RULE — React Native : primitives correctes
*(source : coding-standards.md § "React Native") — applicable uniquement aux fichiers dans `apps/mobile/`*

- `TouchableOpacity` utilisé au lieu de `Pressable` → **point d'attention**
- `FlatList` utilisé pour une liste potentiellement longue au lieu de `FlashList` → **point d'attention**
- `Image` de react-native au lieu de `expo-image` → **point d'attention**
- String nue dans le JSX (hors attributs) sans être dans `<Text>` → **violation**
- `&&` avec valeur potentiellement falsy (ex. `{count && <View>}`) → **point d'attention** — préférer ternaire
- Animations sur des propriétés autres que `transform` ou `opacity` → **point d'attention**
- `Animated` de react-native au lieu de `Reanimated` pour animations complexes → **point d'attention**
- Safe area manquante dans un `ScrollView` plein écran → **point d'attention**

#### RULE — Design system web : zéro valeur hardcodée
*(source : coding-standards.md § "Design system" + module-builder SKILL.md § 4.10) — applicable aux fichiers dans `apps/web/`*

Dans les fichiers `.tsx` :
- `style={{ color: '#`, `style={{ background`, `style={{ padding: \d`, `style={{ margin: \d`, `style={{ fontSize: \d` → **violation** sauf si valeur dynamique issue d'une prop/token
- `style={{ borderRadius: \d`, `style={{ gap: \d` → **point d'attention**

Dans les fichiers `.css` co-localisés :
- Valeurs de couleur brutes (`#`, `rgb(`, `hsl(`) sans `var(--` → **violation**
- Valeurs de spacing/taille en dur (`px`, `rem`) sans `var(--` → **violation**

#### RULE — Design system mobile : StyleSheet + tokens
*(source : coding-standards.md § "Design system" + module-builder SKILL.md § 4.10) — applicable aux fichiers dans `apps/mobile/`*

- Styles inline dans le JSX (objet littéral non mémoïsé) → **violation**
- `StyleSheet.create` avec valeurs numériques ou couleurs en dur sans import du thème → **violation**
- Import du thème manquant quand des couleurs/spacing sont utilisés → **violation**

#### RULE — Internationalisation : zéro texte en dur (code ET données)
*(source : coding-standards.md § "Internationalisation" — « aucun texte visible par l'utilisateur n'est hardcodé, ni dans le code ni en base de données »)*

> **Règle absolue et bloquante.** Aucun texte visible par l'utilisateur ne doit être en dur, où qu'il soit : JSX, props, constantes, **ou base de données / fichiers seed**.

**a) Texte en dur dans le code** — chercher des strings littérales françaises ou anglaises dans le JSX (entre `>` et `<`, ou dans des props `label=`, `placeholder=`, `title=`, `message=`, `alt=`, `aria-label=`) qui ne passent pas par `t(...)`, `tt(...)` ou `tg(...)` → **violation bloquante**.

**b) Texte en dur rendu depuis la base** — si le composant rend une colonne de données directement (`{row.label}`, `{source.description}`, `{topic.title}`…) **sans** passer par `t(...)`, vérifier que cette colonne contient une **clé i18n** (`text_code`) et non de la prose. Si la colonne contient du texte humain (français/anglais) affiché tel quel → **violation bloquante** : la donnée doit être un `text_code` résolu via `t()`, le texte vivant dans les locales.

Exceptions légitimes : valeurs techniques (IDs, noms de routes, formats de date ISO, URLs), et noms propres non traduisibles (PMID, DOI bruts). Une **citation bibliographique** (titre d'étude, auteur, revue) reste du texte visible : si elle est multilingue dans l'UI, elle passe par i18n ; si elle est volontairement mono-langue, le justifier explicitement dans la PR (sinon **point d'attention**).

Si des clés `modules.<id>.*` sont référencées ou si le fichier est un écran de module → vérifier que les clés existent aussi dans `teen.json` (mobile uniquement).

#### RULE — Mode Ado : useTeen + TeenAccent obligatoires
*(source : CLAUDE.md § "Pattern : Mode Ado") — applicable aux écrans dans `apps/mobile/src/screens/modules/`*

Pour chaque écran de module mobile :
- `import { useTeen }` présent ? Sinon → **violation**
- `<TeenAccent` utilisé ? Sinon → **violation**
- `teenColor('<module_id>')` passé à `TeenAccent` ? Sinon → **violation**

#### RULE — Service : cache + JSDoc + test + docs/services.md
*(source : coding-standards.md § "Accès aux données" + module-builder SKILL.md § 4.4)*

Pour chaque fichier `*Service.ts` créé ou modifié :
- Si un `Map` est utilisé comme cache → `clearXxxCache()` exportée ? Sinon → **violation**
- Les fonctions exportées ont-elles une JSDoc (même courte : paramètres + retour) ? Sinon → **point d'attention**
- Un fichier `*Service.test.ts` existe-t-il à côté ? Sinon → **violation**
- `docs/services.md` sera-t-il mis à jour ? (vérifier si le fichier est dans la PR) Sinon → **point d'attention**

#### RULE — Synchronisation distante (mobile) : syncUpsert/syncDelete obligatoires
*(source : .claude/rules/sync-service.md + coding-standards.md § "Synchronisation distante")*

Applicable uniquement aux services dans `apps/mobile/src/services/` qui gèrent des **entrées patient en SQLite**.

Pour chaque fichier `*Service.ts` mobile créé ou modifié, chercher toutes les fonctions qui appellent un `db*` (écriture ou suppression) — `dbSave`, `dbDelete`, `db.execAsync`, `db.runAsync` :

- L'appel `dbSave(...)` / `dbDelete(...)` est-il **encapsulé dans `syncUpsert(...)` ou `syncDelete(...)` de `syncHelpers.ts`** ? Sinon → **violation bloquante**.
- `RemoteSyncService.getInstance().enqueue(...)` appelé **directement** (sans passer par `syncHelpers`) → **violation** : duplique `syncUpsert`, passer par le helper.
- Le `entry_kind` passé à `syncUpsert` / `syncDelete` est-il **une valeur de l'union `EntryKind`** dans `apps/mobile/src/lib/syncOutbox.ts` ? Si un cast `as EntryKind` est présent → **violation** : ajouter la valeur à l'union.
- Le mock de test `jest.mock('../services/sync', () => ({ RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) } }))` est-il présent dans `*Service.test.ts` ? Sinon → **violation**.

**Exceptions légitimes** (ne pas signaler) :
- Services sans écriture de données patient locales : `psyeduService`, `authService`, `appointmentService`, `moduleService`, `homeService`, `notificationService`, etc. (lecture-only ou écriture directe Supabase).
- Modules sans stockage local (`grounding` — zéro persistance).
- Exception documentée par un commentaire JSDoc dans la fonction (ex. `// Pas de sync : données techniques, pas cliniques`).

---

### Pour tout fichier SQL (`*.sql`)

#### RULE — Schéma : source de vérité dans schema.sql
*(source : coding-standards.md § "Schéma")*

Si la PR crée une nouvelle table, colonne, index, trigger ou policy dans un fichier seed ou migration **sans que `supabase/schema.sql` soit modifié en parallèle** → **violation bloquante**.

#### RULE — RLS obligatoire sur toute nouvelle table
*(source : coding-standards.md § "Sécurité")*

Chercher `create table` dans le fichier. Pour chaque table créée, vérifier que le fichier (ou `schema.sql`) contient :
- `enable row level security` pour cette table
- Au moins une `create policy` couvrant les opérations prévues

Si manquant → **violation bloquante**.

#### RULE — Seed idempotent
*(source : module-builder SKILL.md § 2.4)*

Tout fichier de seed doit utiliser `ON CONFLICT ... DO UPDATE` ou `ON CONFLICT ... DO NOTHING` sur chaque `INSERT`. Un seed non idempotent écrase les données à chaque ré-exécution → **violation**.

#### RULE — `user_id` depuis `auth.uid()` uniquement
*(source : coding-standards.md § "Sécurité")*

Dans les policies RLS, vérifier que les conditions de propriété utilisent `auth.uid()` et non un paramètre passé par le client. Ex. `using (user_id = auth.uid())` → ok. `using (user_id = current_setting('app.user_id'))` → **point d'attention**.

#### RULE — Seed : aucun texte visible en dur (clés i18n uniquement)
*(source : coding-standards.md § "Internationalisation" + config-first.md)*

Pour tout `insert` dans un fichier seed, inspecter les valeurs des colonnes destinées à être **affichées** (`label`, `description`, `text_code`, `title`, `name`, `instructions`, `subtitle`…) :

- Une colonne `text_code` (ou équivalent résolu via `t()` à l'affichage) doit contenir une **clé i18n** (`modules.x.y`, `scales.descriptions.x`…), jamais le texte lui-même → texte brut = **violation bloquante**.
- Une colonne de texte visible insérée en **prose française/anglaise** (ex. `'45 % de comportements en moins'`) qui sera rendue telle quelle côté UI → **violation bloquante** : déplacer le texte dans les locales et stocker une clé.
- Vérifier la parité : si le seed insère une clé `modules.<id>.*`, les locales `fr`/`en` (+ `teen` mobile) doivent contenir cette clé (cf. RULE i18n).

Exception : données purement techniques (UUID, URL, PMID/DOI, `source_type` énuméré, `sort_order`).

---

### Pour tout fichier de test (`*.test.ts`, `*.test.tsx`)

#### RULE — Mocks obligatoires côté mobile
*(source : module-builder SKILL.md § 6.2)*

Si le fichier teste un écran de module mobile :
- `jest.mock('../../hooks/useTeen', ...)` présent ? Sinon → **violation**
- `jest.mock('../lib/supabase', ...)` ou `jest.mock('../services/...', ...)` présent si Supabase est utilisé ? Sinon → **violation**
- `jest.mock('../lib/database', ...)` présent si SQLite est utilisé ? Sinon → **violation**

#### RULE — Couverture minimale
*(source : module-builder SKILL.md § 6.1)*

Pour chaque service testé, vérifier la présence d'au moins :
- Un test happy path
- Un test d'erreur (Supabase/SQLite retourne une erreur)

Pour chaque composant/écran testé :
- Un test de rendu par défaut
- Un test d'interaction si le composant a des callbacks

---

### Pour tout fichier de configuration/documentation (`.json` i18n, `.md`)

#### RULE — Parité fr/en + teen (clés de module)
*(source : coding-standards.md § "Internationalisation")*

Si la PR modifie `fr/common.json` en ajoutant des clés `modules.<id>.*` :
- Vérifier que `en/common.json` est aussi modifié avec les mêmes clés → sinon **violation**
- Vérifier que `fr/teen.json` et `en/teen.json` sont aussi modifiés (mobile uniquement) → sinon **violation bloquante**

#### RULE — Documentation obligatoire pour un nouveau module
*(source : module-builder SKILL.md § 7)*

Si la PR crée un nouveau module (nouveau `module_id` dans les seeds) :
- `docs/modules/<module_id>.md` créé ? Sinon → **violation**
- `docs/modules.md` mis à jour ? Sinon → **point d'attention**
- `CLAUDE.md` mis à jour (tableau + état d'avancement) ? Sinon → **point d'attention**

---

## Étape 2 — VETO MDR 2017/745 (transversal)

> **Priorité absolue — à appliquer sur tous les fichiers.**
*(source : CLAUDE.md § "RÈGLE D'OR — Statut Non-Dispositif Médical")*

Pour chaque fichier `.tsx` / `.ts`, chercher :

| Pattern interdit | Explication |
|---|---|
| `if (score >` ou `score >=` ou `>= threshold` suivi d'une action UI | Seuil déclenche quelque chose |
| Label clinique apposé sur un score (`"dépression sévère"`, `"alerte"`, `"élevé"`) | Interprétation automatique |
| `scheduleNotification` conditionné par une valeur de données | Alerte conditionnelle aux données |
| `"moins que la moyenne"`, `"sous la normale"` | Comparaison à une norme |
| Couleur rouge ou icône de dégradation pilotée par une valeur clinique | Encodage interprétatif |

Si une violation MDR est trouvée → **VETO ABSOLU** en tête du rapport.

---

## Étape 3 — Config-first (transversal sur les fichiers de module)
*(source : .claude/rules/config-first.md)*

Pour chaque fichier `.tsx` ou `.ts` lié à un module thérapeutique (dans `screens/modules/`, `ModuleRenderer/`, `HomeScreen.tsx`, `PatientPage.tsx`) :

Chercher des tableaux ou objets TypeScript qui décrivent le **contenu ou le comportement** d'un module :

```ts
// ❌ Patterns à signaler
const QUESTIONS = [{ id: 'q1', text: '...' }]
const OPTIONS = ['Jamais', 'Parfois', 'Souvent', 'Toujours']
const STEPS = [{ label: 'Signes avant-coureurs', ... }]
const SCALES = [{ id: 'phq9', name: 'PHQ-9', category: '...' }]
const ITEMS = [{ key: '...', label: '...' }]
```

Test décisif : "cette donnée pourrait-elle changer sans modifier le code ?" Si oui → **violation**, elle appartient à `module_content_fields` / `field_props` / `psyedu_topics`.

**Exceptions légitimes** (ne pas signaler) :
- Constantes purement présentationnelles partagées entre tous les modules (`HOUR_HEIGHT_PX`, tokens CSS, noms de routes)
- Types TypeScript et interfaces (pas des données)
- Logique de scoring (algorithme, pas données — `SCALE_SCORING` dans `scaleScoring.ts`)
- Maps d'icônes techniques (`SOURCE_ICONS`, `MODULE_ICONS`) — la correspondance icône est du code, pas du contenu

---

## Étape 4 — Design system d'abord : réutiliser, sinon étendre, jamais redupliquer

> **Tu es le gardien du code, pas un tampon encreur.** « Ça marche, c'est juste
> perfectible » n'est **pas** un motif pour laisser passer. Une UI qui réinvente
> un primitive déjà présent au design system est une **violation bloquante**, même
> si elle fonctionne, même si elle est jolie. Ne te raisonne pas pour fermer les
> yeux : si une duplication existe, tu la nommes, tu cites le composant existant,
> et tu indiques la prop/variante qui aurait suffi.

Cette étape s'applique à **tout fichier créé OU modifié** dès qu'il introduit de
l'UI : nouveau composant `.tsx`, **nouvelle classe CSS**, **bloc de markup JSX**,
nouveau `field_type`, nouveau layout (`preview_kind`). Pas seulement les fichiers `A`.

### 4.0 — Lire l'inventaire AVANT de juger (obligatoire)

```bash
ls apps/web/src/components/ui/        # primitives web
ls apps/web/src/components/features/  # composants métier web
ls apps/mobile/src/components/ui/
ls apps/mobile/src/components/features/
```
Plus les références : `apps/web/docs/design-system.md`, `apps/mobile/docs/design-system.md`,
et l'inventaire des field_types/layouts dans `docs/module-engine.md`.

Un rapport qui conclut « pas de duplication » **sans avoir listé l'inventaire** est
invalide : la duplication la plus fréquente vient de l'ignorance de ce qui existe.

### 4.1 — L'arbre de décision (à appliquer à CHAQUE morceau d'UI ajouté)

Pour chaque composant / classe CSS / bloc de markup introduit :

1. **Quelle est sa responsabilité fonctionnelle précise ?** (onglets, carte, bascule,
   barre de valeur, badge, champ, accordéon, bandeau, slider…)
2. **Un composant du design system couvre-t-il ce besoin ?**

| Situation | Verdict |
|---|---|
| Un composant DS fait **exactement** ça → il fallait l'importer | **Violation bloquante** — markup/CSS fait main qui duplique un primitive existant. Cite le composant + l'usage attendu. |
| Un composant DS couvre le besoin **mais pas tout à fait** (taille, variante, couleur d'accent, slot manquant) → il fallait **l'étendre** : ajouter une **prop / variante / slot** | **Violation bloquante** — un composant parallèle a été créé (ou du markup ad hoc écrit) au lieu d'étendre l'existant. Nomme le composant + la prop qui aurait suffi. |
| **Rien** au design system ne correspond → création légitime d'un nouveau primitive | **Autorisé**, mais alors : il va dans `ui/` (générique) ou `features/` (métier), **+ doc design-system + test** (Étape 5), sinon **violation**. |

> **Extension > duplication, toujours.** « Le composant existant ne fait pas
> exactement ce que je veux » n'autorise **pas** à en écrire un nouveau : la voie
> normale est d'ajouter une prop/variante au composant existant (ex. `variant`,
> `size`, `accentColor`, un slot `children`). Créer un composant parallèle n'est
> justifié **que** si l'extension romprait le contrat public du composant
> (changement d'API incompatible) — et ce cas doit être **explicitement argumenté**
> dans la PR. À défaut d'argumentaire : **violation bloquante**.

### 4.2 — Catalogue des duplications à traquer (liste non exhaustive)

| Tu vois… | Cherche d'abord… |
|---|---|
| Boutons d'onglets faits main (`__tab`, `__tabs`, `role="tab"` en dur) | `ui/Tabs` (props `variant`, `accentColor`) ou la variante compacte d'aperçu |
| Bascule on/off (`__track`/`__thumb`) | `ui/Toggle` |
| Carte / conteneur encadré (`__card`, bord + ombre + radius) | `ui/Card` (étendre avec `onPress` si tappable, sinon `View`) |
| Carte à en-tête cliquable / repliable | `ui/Accordion`, `ui/Card` |
| Badge de statut coloré | `ui/StatusBadge` |
| Bouton primaire/secondaire | `ui/Button` (étendre avec `iconLeft?: ReactNode` si icône nécessaire) |
| Champ texte + label | `ui/InputField`, `ui/SelectField`, `ui/SearchInput` |
| Modale / confirmation | `ui/Modal`, `ConfirmDialog` |
| État vide (icône + titre + texte) | `ui/EmptyState` (mobile : `icon` accepte emoji string) |
| Barre/slider de valeur, jauge | primitive slider/`ValueBar` existante — sinon en créer **une seule**, réutilisable |
| Bandeau d'avertissement (mobile) | `DisclaimerBanner` |
| Bande d'accent colorée (mobile) | `TeenAccent` |
| `Pressable` stylé comme un bouton plein | `ui/Button` — jamais de `Pressable + Text + styles.xxxBtn` ad hoc |
| `View + icon + Text + Text` comme état vide | `ui/EmptyState` |
| `Pressable + View(card-like)` navigable | `ui/Card` avec prop `onPress` |

Et au-delà de la liste : **toute** classe CSS nouvelle qui restyle un élément déjà
couvert par un primitive, **tout** bloc de markup qui reproduit visuellement un
primitive → même verdict (4.1).

### 4.3 — Nommage des layouts (`preview_kind`) : par motif, pas par module

Un layout/`preview_kind` doit être nommé d'après son **motif visuel réutilisable**
(`column_form`, `tree_selector`, `decision_grid`, `slider_dashboard`), **pas**
d'après un module précis. Un `preview_kind` portant un nom de module
(`mood_tracker`, `phq9`…) → **point d'attention** : il bride la réutilisation
(un autre module voulant le même écran hériterait d'un nom trompeur). Recommander
un nom de pattern et la dérivation des clés i18n via le `module_id` des fields.

### 4.4 — Composants découplés du métier : le métier s'injecte par les props

> **Un composant du design system est une coquille générique. Le métier n'en fait
> jamais partie — il y entre par les props.** Plus un composant est détaché du
> domaine (patient, module, échelle, agenda, craving…), plus il est réutilisable.
> Un primitive qui « connaît » un module précis n'est plus un primitive : c'est du
> métier déguisé en design system.

S'applique à **tout composant**, mais avec un seuil de sévérité selon le dossier :

| Dossier | Attendu | Couplage métier en dur |
|---|---|---|
| `components/ui/` | **Zéro** connaissance métier. Ne sait rien des patients/modules/échelles. Tout vient des props. | **Violation bloquante** |
| `components/features/` | Connaît **un** domaine, mais reste paramétrable : les données arrivent par props, pas codées en dur dans le composant. | **Point d'attention** → bloquant si le composant n'est utilisable que pour une seule entité figée |

**Signaux de couplage à traquer dans un composant** (surtout sous `ui/`) :

- Référence à un **module/échelle/domaine précis** en dur : `if (moduleId === 'phq9')`, `'mood_tracker'`, clé i18n figée `t('modules.craving_journal.x')` dans un composant censé être générique → **violation bloquante**. La clé/le libellé doit **arriver par une prop** (`label`, `textCode`) ou être **dérivé** du `module_id` reçu (cf. config-first.md § « un layout générique ne hardcode pas les clés i18n d'un module »).
- **Données métier** (liste de questions, options, étapes, valeurs cliniques) **codées dans le composant** au lieu d'être reçues en props → **violation bloquante** (recoupe Étape 3 config-first).
- **Appel service / fetch / accès store** depuis un composant `ui/` → **violation bloquante** : un primitive ne va pas chercher ses données, on les lui passe. (Un `features/` peut consommer un hook de domaine, mais privilégier la réception par props quand c'est raisonnable.)
- **Import depuis `features/` dans un `ui/`**, ou import d'un service/contexte métier dans un `ui/` → **violation bloquante** (recoupe la règle de dépendance `features → ui`).
- Nom de prop **trop spécifique** trahissant le couplage (`phq9Score`, `patientCravingValue`) là où un nom générique (`value`, `label`) conviendrait → **point d'attention**.

**Test décisif :** « si un autre domaine (autre module, autre écran) voulait ce
composant, faudrait-il modifier le composant lui-même ? » Si oui → le métier est
*dans* le composant au lieu d'être *injecté*. La correction attendue : **remonter
le métier dans le parent** et l'exposer en prop (`label`, `value`, `items`,
`onSelect`, `renderItem`, `textCode`…), laissant le composant agnostique.

Référence : `ValueBar`/`Sparkline` (purs, tout par props) et la règle « nommer un
layout par son motif, pas par un module » de [`config-first.md`](../../rules/config-first.md).
Si la PR **retire** un couplage métier d'un composant pour le passer en prop → le
**saluer** dans les points positifs.

### 4.5 — Posture du reviewer

- Ne **jamais** clore une duplication par « mais ça fonctionne » / « c'est mineur ».
  Le rôle du gardien est précisément d'empêcher la dette qui « fonctionne ».
- Toujours rendre la remarque **actionnable** : `fichier:ligne` + composant DS exact
  + la prop/variante précise qui résout le besoin.
- Si la PR **étend** correctement un composant existant (nouvelle prop documentée +
  testée) → le **saluer** explicitement dans les points positifs : c'est le
  comportement attendu.

---

## Étape 5 — Documentation ET tests : obligatoires et bloquants (transversal)
*(source : CLAUDE.md § "Règles de développement" — « Toute nouvelle feature doit être accompagnée d'un fichier `.md` de documentation ET de tests avant d'être considérée comme terminée. »)*

> **Règle absolue, sans exception.** Elle s'applique à **toute nouvelle feature**, pas seulement aux modules thérapeutiques : nouveau composant, service, hook, écran, util, table, pattern UI, prop/variante d'un composant existant.
>
> Le critère « nouveau module » des règles précédentes (`docs/modules/<id>.md`) n'est qu'**un cas particulier** de cette règle générale. Une feature qui n'est pas un module (ex. un onglet, un panneau, un service de lecture) y est **tout autant soumise**.

### 5.1 — Tests obligatoires (bloquant)

Pour **chaque fichier source créé**, chercher dans la branche le fichier de test correspondant (`*.test.ts` / `*.test.tsx` à côté, ou suite dédiée). Absent → **violation bloquante**, sauf exception triviale ci-dessous.

| Fichier source créé | Test attendu | Manquant |
|---|---|---|
| `*Service.ts` (service de données) | `*Service.test.ts` — happy path **+** cas d'erreur (Supabase/SQLite échoue) | **violation bloquante** |
| `use<Xxx>.ts` (hook) | test du hook (états + transitions) | **violation bloquante** |
| Composant / écran avec logique ou callbacks | test de rendu par défaut **+** test d'interaction | **violation bloquante** |
| Util pur / fonction de scoring | test des cas limites | **violation bloquante** |
| Primitive `ui/` purement présentationnelle (zéro logique) | test de rendu | **point d'attention** |

Vérification : `find <dir> -name '<base>.test.*'` pour chaque source. Ne pas se contenter d'un test qui existe « quelque part » — il doit **couvrir le code ajouté** (happy path + erreur au minimum, cf. § "Couverture minimale").

### 5.2 — Documentation obligatoire (bloquant)

Toute nouvelle feature doit **livrer ou mettre à jour** de la documentation `.md`. Si la PR ajoute une feature et qu'**aucun fichier `.md` n'est créé ni modifié** → **violation bloquante**.

| Surface ajoutée | Doc attendue |
|---|---|
| Nouveau module thérapeutique | `docs/modules/<id>.md` + `docs/modules.md` + `CLAUDE.md` (déjà couvert § module) |
| Nouveau composant réutilisable (`ui/` ou `features/`) | section dans le design system de l'app (`apps/<app>/docs/design-system.md` ou `apps/<app>/docs/components/<nom>.md`) |
| Nouvelle prop / variante d'un composant existant | mise à jour de la doc de ce composant |
| Nouveau service | entrée dans `docs/services.md` |
| Nouvelle table / pattern transversal | doc dans `docs/` |
| Nouvelle feature web/mobile (onglet, panneau, écran…) | doc fonctionnelle dans `docs/` ou `apps/<app>/docs/` |

**Indexation** : toute doc créée doit être référencée (`docs/README.md` et/ou l'index du design system). Doc présente mais **non indexée** → **point d'attention**.

### 5.2.1 — Vérification mécanique : chaque composant ajouté a une VRAIE section de doc (bloquant)

> **Une mention dans la liste d'inventaire n'est PAS de la documentation.** Un
> composant cité dans la phrase « Primitives — Accordion, Button, Card… » mais sans
> section décrivant ses props/usage est **non documenté**. C'est le trou exact par
> lequel 8 primitives (`Button`, `Card`, `Modal`, `StatusBadge`, `ConfirmDialog`,
> `Toast`…) ont vécu sans doc : le reviewer voyait le nom et croyait la doc présente.

Pour **chaque composant créé** dans `apps/<app>/src/components/ui/` ou `components/features/`
(repérable par un dossier `NomComposant/` nouveau dans le diff `A`) :

```bash
# Le nom apparaît-il AILLEURS que dans la ligne d'inventaire / l'arbre de fichiers ?
grep -n "NomComposant" apps/<app>/docs/design-system.md
ls apps/<app>/docs/components/NomComposant*.md 2>/dev/null
```

Verdict :
- Le composant a une **section dédiée** (`### NomComposant`) avec props/usage, **ou** un fichier `docs/components/<nom>.md` → **conforme**.
- Le composant n'apparaît **que** dans la liste d'inventaire (ligne « Primitives — … ») et/ou l'arbre de fichiers, **sans section ni props** → **violation bloquante** : la doc d'inventaire ne documente pas, elle liste.
- Le composant n'apparaît **nulle part** dans la doc → **violation bloquante**.

Une section de doc valable contient au minimum : le **chemin** du composant, un **exemple d'usage**, et la **table des props** (nom, type, rôle). Une simple phrase descriptive sans props → **point d'attention**.

**Cas des composants pilotés par contexte** (Toast/ConfirmDialog/ActionSheet et équivalents) : la doc doit indiquer le **hook de déclenchement** (`useToast`, `useConfirmDialog`…) et sa signature, pas seulement les props présentationnelles — sinon un dev remontera le composant à la main au lieu d'appeler le hook.

### 5.3 — Exception

Un **refactor pur** ou un **bugfix** sans nouvelle surface fonctionnelle ne requiert pas de nouveau `.md` ni de nouveau test — mais doit **garder la doc et les tests existants à jour** (un test cassé ou une doc devenue fausse → **violation bloquante**).

---

## Format du rapport final

```
# PR Review — <nom de branche>
Date : <date>

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅/❌ |
| lint-web | `cd apps/web && npx eslint .` | ✅/❌ |
| test-web | `cd apps/web && npx vitest run` | ✅/❌ |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅/❌ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅/❌ |

## Synchronisation avec main
- Merge `origin/main` : <propre (fast-forward / auto-merge) | conflits résolus>
- Fichiers en conflit résolus (si applicable) : <liste ou "aucun">

## Fichiers analysés
- Créés : N fichiers
- Modifiés : N fichiers

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | N |
| ⚠️ Points d'attention | N |
| ✅ Conformes | N fichiers sans remarque |

---

## 🚫 VETO MDR (si applicable)
> Signaler en premier, avant tout le reste.

---

## 🚫 Violations bloquantes
> Empêchent le merge.

### `apps/web/src/components/Foo/Foo.tsx`

**Ligne 42 — [Accès données]**
Appel direct `supabase.from('modules')` dans un composant.
→ Déplacer dans `moduleService.ts`.

**Ligne 78 — [TypeScript]**
`as any` utilisé pour contourner une erreur de type.
→ Typer correctement ou créer un type discriminé.

---

### `supabase/seed/foo_seed.sql`

**[Schéma]** Table `foo` créée dans le seed mais absente de `supabase/schema.sql`.
→ Répercuter le DDL dans `schema.sql`.

---

## ⚠️ Points d'attention
> Ne bloquent pas le merge mais doivent être adressés.

### `apps/mobile/src/screens/modules/FooScreen.tsx`

**Ligne 23 — [Render]**
`const LABELS = { ... }` déclaré dans le corps du composant — statique, doit être au niveau module.

**Ligne 55 — [useState vs useRef]**
`useState<NodeJS.Timeout | null>` pour stocker un timer — ne pilote pas le rendu, préférer `useRef`.

---

## ✅ Points positifs
> Bonnes pratiques observées.

- `moduleSourcesService.ts` : cache Map avec `clearModuleSourcesCache()` exportée — pattern correct.
- Seed idempotent avec `ON CONFLICT DO UPDATE` sur toutes les tables.

---

## Checklist finale

### Bonnes pratiques React / Vercel
- [ ] Rules of Hooks respectées (pas de hook dans condition/boucle/fonction non-hook)
- [ ] useEffect avec abonnement a une cleanup
- [ ] Clés stables dans les listes `.map()` (pas d'index si ordre peut changer)
- [ ] Zéro `async` callback direct dans `useEffect`
- [ ] Imports dynamiques avec `Suspense` si `React.lazy`

### coding-standards.md
- [ ] Zéro Supabase/SQLite dans les composants
- [ ] TypeScript strict (zéro any, zéro as any, zéro as unknown, zéro suppression)
- [ ] Zéro allocation inline dans le render
- [ ] useState vs useRef correct
- [ ] Architecture ui/ vs features/ respectée
- [ ] Un seul composant par fichier .tsx
- [ ] Primitives RN correctes (Pressable, FlashList, expo-image)
- [ ] Design system — zéro valeur hardcodée (web CSS + mobile StyleSheet)
- [ ] i18n — zéro texte en dur **dans le code ET en base/seed** + parité fr/en + teen.json (mobile)
- [ ] Sécurité — RLS sur nouvelles tables, auth.uid() dans policies
- [ ] Schéma — schema.sql à jour

### config-first.md
- [ ] Zéro tableau/objet TypeScript décrivant le contenu d'un module
- [ ] Nouveau contenu → seed SQL (module_content_fields / field_props / psyedu)

### sync-service.md (mobile uniquement)
- [ ] Chaque `dbSave(...)` mobile encapsulé dans `syncUpsert(...)` (syncHelpers)
- [ ] Chaque `dbDelete(...)` mobile encapsulé dans `syncDelete(...)` (syncHelpers)
- [ ] Zéro appel direct à `RemoteSyncService.getInstance().enqueue()`
- [ ] `entry_kind` est une valeur de l'union `EntryKind` (zéro cast `as EntryKind`)
- [ ] Mock `jest.mock('../services/sync', ...)` dans les tests du service mobile

### CLAUDE.md
- [ ] MDR 2017/745 — aucun seuil, alerte ou interprétation automatique
- [ ] Composants existants réutilisés/étendus avant création
- [ ] Mode Ado (mobile) — useTeen + TeenAccent + mock test
- [ ] Parité web ≡ mobile (si module)
- [ ] Service — cache + JSDoc + test + docs/services.md

### Obligatoires et bloquants pour TOUTE nouvelle feature (Étape 5)
- [ ] **Tests** — chaque source créé (service / hook / composant / util) a son test couvrant happy path + erreur
- [ ] **Documentation** — au moins un `.md` créé/mis à jour (module, composant, service, pattern…) **et indexé**
- [ ] **Chaque composant ajouté (`ui/`/`features/`) a une vraie section de doc** (chemin + usage + props) — pas seulement une mention d'inventaire (§5.2.1)
- [ ] **Zéro texte en dur** — ni dans le code, ni en base/seed (colonnes affichées = clés i18n)
```

---

## Étape finale — Publication du rapport dans la PR et notification

> **À exécuter systématiquement après avoir produit le rapport**, quelle que soit la sévérité des résultats.

### 1. Trouver le numéro de PR

```bash
gh pr list --head <nom-de-la-branche-courante>
```

Si aucune PR n'existe pour la branche courante → s'arrêter ici, afficher le rapport uniquement dans la conversation.

### 2. Poster le rapport en commentaire

Publier le rapport complet (tel que produit ci-dessus) comme commentaire sur la PR :

```bash
gh pr comment <PR_NUMBER> --body "$(cat <<'REVIEW'
<contenu intégral du rapport>
REVIEW
)"
```

Le rapport doit être posté **tel quel**, sans reformulation ni résumé — le commentaire doit contenir exactement le même contenu que ce qui a été produit à l'étape précédente.

### 3. Notifier l'auteur de la PR

Récupérer l'auteur de la PR et mentionner son handle GitHub dans un second commentaire court :

```bash
# Récupérer le handle GitHub de l'auteur
gh pr view <PR_NUMBER> --json author --jq '.author.login'
```

Puis poster un commentaire de notification :

```bash
gh pr comment <PR_NUMBER> --body "@<AUTHOR_LOGIN> La review automatique vient d'être postée ci-dessus — $([ <NB_BLOCKING> -gt 0 ] && echo '<NB_BLOCKING> violation(s) bloquante(s) à corriger avant merge.' || echo 'aucune violation bloquante détectée ✅')"
```

Remplacer `<NB_BLOCKING>` par le nombre réel de violations bloquantes trouvées.

### 4. Retourner les URLs des commentaires

Afficher dans la conversation les URLs des deux commentaires postés, pour confirmation.

### 5. Enrichir la documentation à partir des violations détectées

> **Toujours exécuter**, même s'il n'y a aucune violation — confirmer que les règles existantes couvrent déjà les patterns observés.
>
> Objectif : chaque review améliore les règles du projet pour que la même erreur ne passe plus jamais. Les fichiers `.claude/rules/` et `CLAUDE.md` sont vivants — ils s'enrichissent à chaque PR.

#### Principe

> **Priorité d'écriture : rules/docs avant le skill.** L'objectif est que les développeurs ne commettent plus l'erreur — pas seulement que Claude la détecte mieux. Enrichir `.claude/rules/` et `CLAUDE.md` aide tout le monde (devs, autres skills, onboarding) ; enrichir ce skill n'aide que la review. En cas de doute sur où écrire : **rules/docs en premier, skill en dernier recours.**

Pour chaque **violation bloquante** trouvée dans le rapport (les warnings sont ignorés — trop de bruit) :

1. Identifier la règle correspondante dans `.claude/rules/coding-standards.md`, `.claude/rules/config-first.md`, ou `CLAUDE.md`.
2. Lire la section concernée et vérifier : **la règle a-t-elle déjà un exemple concret illustrant exactement ce pattern ?**
   - **Oui, l'exemple est déjà là** → rien à faire pour cette violation, passer à la suivante.
   - **Non, la règle est présente mais sans exemple de ce cas précis** → ajouter un bloc `> **Cas rencontré :**` avec le code fautif extrait du fichier reviewé.
   - **Le pattern n'est couvert par aucune règle existante** → ajouter une nouvelle entrée dans la section pertinente du fichier de règle (ou dans `CLAUDE.md` si transversal). N'enrichir le skill lui-même que si le pattern est propre au processus de review (ex. un nouveau type de fichier à analyser, une étape manquante) — jamais pour une règle métier ou de code.

#### Format d'un enrichissement

Insérer directement dans le fichier de règle, juste après la rule concernée :

```markdown
> **Cas rencontré — <branche> (<date>) :**
> ```tsx
> // ❌ Code fautif extrait de apps/mobile/src/screens/modules/FooScreen.tsx:42
> supabase.from('modules').select('*')  // dans un composant
> ```
> → Déplacer dans un service : `moduleService.fetchModules()`.
```

#### Mapping violation → fichier de règle

| Catégorie de violation | Fichier à enrichir | Section |
|---|---|---|
| React (hooks, effets, keys, async) | `coding-standards.md` | § "React performance" + RULE Vercel |
| Accès données (Supabase/SQLite dans composant) | `coding-standards.md` | § "Accès aux données" |
| TypeScript (`any`, `unknown`, suppressions) | `coding-standards.md` | § "Suppressions interdites" / "TypeScript strict" |
| Render inline (objets, callbacks) | `coding-standards.md` | § "Render — zéro déclaration inline" |
| i18n (texte en dur) | `coding-standards.md` | § "Internationalisation" |
| Design system (duplication d'un primitive) | `coding-standards.md` | § "Checklist obligatoire" |
| Config-first (données en TS statique) | `config-first.md` | § "L'erreur classique" |
| Sync absent (dbSave sans syncUpsert, mobile) | `sync-service.md` | § "Pattern obligatoire" |
| MDR 2017/745 | `CLAUDE.md` | § "RÈGLE D'OR — INTERDIT" |
| Tests / documentation manquants | `CLAUDE.md` | § "Règles de développement" |
| Mode Ado (useTeen/TeenAccent manquants) | `CLAUDE.md` | § "Pattern : Mode Ado" |
| RLS / schema.sql | `coding-standards.md` | § "Sécurité" / "Schéma" |

#### Après les enrichissements

Afficher dans la conversation la liste des fichiers de règles modifiés et les enrichissements apportés, sous la forme :

```
📚 Documentation enrichie :
- coding-standards.md — § "Accès aux données" : +1 exemple (FooScreen.tsx:42)
- config-first.md — § "L'erreur classique" : +1 exemple (BarModule)
```

Si aucune règle n'a nécessité d'enrichissement : `📚 Règles déjà à jour — aucun enrichissement nécessaire.`

### 6. Archiver le rapport

Sauvegarder le rapport dans `.claude/pr-reviews/` pour permettre de mesurer rétrospectivement l'efficacité des enrichissements de règles.

**a)** Créer le dossier si nécessaire :

```bash
mkdir -p .claude/pr-reviews
```

**b)** Nommer le fichier `YYYY-MM-DD_<branche>.md` :

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD | tr '/' '-')
DATE=$(date +%Y-%m-%d)
# → .claude/pr-reviews/${DATE}_${BRANCH}.md
```

**c)** Écrire le fichier avec un front matter YAML suivi du rapport complet :

```markdown
---
date: YYYY-MM-DD
branch: <nom-de-branche>
pr_number: <numéro ou null>
pr_url: <URL complète ou null>
ci_pass: true|false
merge_clean: true|false
violations:
  mdr: N
  data_access: N
  typescript: N
  i18n: N
  tests: N
  docs: N
  design_system: N
  config_first: N
  rls_schema: N
  one_component_per_file: N
  teen_mode: N
warnings: N
files_created: N
files_modified: N
rules_enriched: N
---

<rapport complet tel que produit ci-dessus>
```

Le champ `rules_enriched` indique le nombre de fichiers de règles modifiés à l'étape 5 — c'est le signal clé pour mesurer si les enrichissements réduisent les violations au fil du temps.

**d)** Confirmer en affichant le chemin du fichier archivé dans la conversation.
