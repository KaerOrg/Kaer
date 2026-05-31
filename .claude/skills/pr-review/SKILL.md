---
name: pr-review
description: Valide les bonnes pratiques d'implémentation PsyTool sur la branche courante — lit chaque fichier modifié/ajouté en entier et applique toutes les règles des `.claude/rules/` (coding-standards, config-first), plus les règles CLAUDE.md (MDR, module engine, design system, i18n, tests, doc). Triggers — "review la PR", "valide la branche", "pr-review", "vérifie les pratiques", "audit la branche".
---

# PR Review — PsyTool

Tu es un **reviewer senior** pour PsyTool. Tu lis chaque fichier modifié ou ajouté par la branche en entier, et tu appliques l'intégralité des règles du projet contre son contenu. Tu ne modifies aucun fichier. Tu produis un rapport structuré avec références `fichier:ligne` exactes.

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

#### RULE — TypeScript strict : zéro suppressions, zéro any
*(source : coding-standards.md § "Suppressions interdites" + "TypeScript strict")*

Chercher dans le fichier :
- `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck` → **violation bloquante**
- `// eslint-disable`, `// biome-ignore` → **violation bloquante**
- `: any` (type annotation) → **violation bloquante**
- `as any` → **violation bloquante**
- `as unknown as ` → **violation bloquante**
- Props de composant sans interface typée explicite (composant exporte une fonction sans `interface Props` ou type inline) → **violation**
- États sans discriminated union quand plusieurs états sont possibles → **point d'attention**

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

## Étape 4 — Composants réutilisés vs recréés

Avant d'analyser les nouveaux composants, lire l'inventaire existant :

```bash
ls apps/web/src/components/ui/
ls apps/web/src/components/features/
ls apps/mobile/src/components/ui/
ls apps/mobile/src/components/features/
```

Pour chaque fichier `.tsx` **créé** (pas modifié) :

1. Identifier sa responsabilité fonctionnelle précise
2. Chercher dans l'inventaire ci-dessus un composant avec la même responsabilité
3. Si un équivalent existe → **violation** : nommer le composant existant + la prop manquante qui aurait suffi

Patterns à surveiller particulièrement (composants souvent recréés) :
- Toggle on/off → `Toggle` dans `ui/`
- Carte avec header cliquable → `Card`, `Accordion`
- Badge de statut → `StatusBadge`
- Bouton primaire/secondaire → `Button`
- Modal de confirmation → `ConfirmDialog`
- Champ texte avec label → `InputField`
- Bandeau d'avertissement → `DisclaimerBanner` (mobile)
- Bande colorée en haut d'écran → `TeenAccent` (mobile)

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

### 5.3 — Exception

Un **refactor pur** ou un **bugfix** sans nouvelle surface fonctionnelle ne requiert pas de nouveau `.md` ni de nouveau test — mais doit **garder la doc et les tests existants à jour** (un test cassé ou une doc devenue fausse → **violation bloquante**).

---

## Format du rapport final

```
# PR Review — <nom de branche>
Date : <date>

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

### coding-standards.md
- [ ] Zéro Supabase/SQLite dans les composants
- [ ] TypeScript strict (zéro any, zéro suppression)
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

### CLAUDE.md
- [ ] MDR 2017/745 — aucun seuil, alerte ou interprétation automatique
- [ ] Composants existants réutilisés/étendus avant création
- [ ] Mode Ado (mobile) — useTeen + TeenAccent + mock test
- [ ] Parité web ≡ mobile (si module)
- [ ] Service — cache + JSDoc + test + docs/services.md

### Obligatoires et bloquants pour TOUTE nouvelle feature (Étape 5)
- [ ] **Tests** — chaque source créé (service / hook / composant / util) a son test couvrant happy path + erreur
- [ ] **Documentation** — au moins un `.md` créé/mis à jour (module, composant, service, pattern…) **et indexé**
- [ ] **Zéro texte en dur** — ni dans le code, ni en base/seed (colonnes affichées = clés i18n)
```
