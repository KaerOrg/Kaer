# Coding Standards — PsyTool

## Principes fondamentaux — non négociables

- **Scalabilité d'abord** : chaque décision de design doit tenir à 10× la charge actuelle (patients, modules, praticiens).
- **Composants réutilisables** : tout composant ou fonction utilisé (ou susceptible d'être utilisé) dans ≥2 contextes est extrait dans `src/components/` ou `packages/shared/`. Zéro duplication.
- **Tests unitaires systématiques** : toute fonction de service, hook, et composant non-trivial est couvert avant livraison — happy path + cas d'erreur + edge cases.
- **Documentation inline ciblée** : uniquement pour la logique non-évidente (invariants, workarounds, race conditions). Le reste se documente dans CLAUDE.md et les fichiers `.md` de feature.

## Architecture en couches — ne jamais mélanger

- **UI** (`src/screens/`, `src/components/`) : affichage uniquement — zéro logique métier, zéro appel Supabase direct
- **Logique** (`src/services/*.ts`) : toutes les opérations Supabase/API ici
- **State global** (`src/contexts/`) : uniquement auth et location
- **Types** (`src/types/`) : interfaces exportées, réutilisables par toutes les couches
- Composant utilisé dans ≥2 écrans → `src/components/`
- Fonctions de service : pures, paramètres typés, sans side effects

## Suppressions interdites

Ne jamais utiliser :
- `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`
- `// biome-ignore`, `// eslint-disable`
- `as any`, `as unknown as X`

Si le compilateur ou le linter signale une erreur, la corriger — jamais la supprimer.

## TypeScript strict

- Zéro `any`, zéro `as unknown`
- `readonly` sur les données venant de Supabase
- Discriminated unions pour les états : `| { status: 'idle' } | { status: 'loading' } | { status: 'error'; error: Error }`

## Render — zéro déclaration inline

Les objets, tableaux et fonctions déclarés dans le render sont re-créés à chaque rendu. Cela brise `React.memo`, cause des re-rendus inutiles, et déclenche des boucles dans les `useEffect`.

- Lookup maps statiques → constantes **module-level**
- Fonctions pures sans dépendances → **module-level**
- Styles dynamiques (props/state) → `useMemo`
- Callbacks passés à des enfants → `useCallback`
- Objets passés en props (`style={{}}`, `action={{}}`) → `useMemo` ou variable pré-calculée
- Config Animated (`inputRange`, `outputRange`) → constantes module-level `number[]`
- Items de liste complexes → composant dédié + `React.memo`

## Design system

- Glassmorphisme : `GlassCard` + `BlurView`
- Boutons gradient : `PremiumButton`
- Avatars : `PremiumAvatar`
- Couleurs et spacing : `src/theme-redesign.ts` — **ne jamais hardcoder**
- Animations complexes : `React Native Reanimated` uniquement (jamais `Animated` de base)

## React Native

- `expo-image` pour toutes les images
- `Pressable` > `TouchableOpacity`
- `FlashList` > `FlatList` pour les listes longues — items mémoïsés, callbacks stables, zéro inline style dans les items
- Navigateurs natifs uniquement (`createNativeStackNavigator`, native bottom tabs)
- Safe areas dans les ScrollViews
- `StyleSheet.create` — jamais de styles inline ad hoc
- Animer uniquement `transform` et `opacity`
- `useDerivedValue` pour les valeurs calculées en animation
- Texte toujours dans `<Text>` — jamais de string nue dans le JSX
- Ternaire plutôt que `&&` avec valeurs potentiellement falsy

## React performance

- `Promise.all` pour les fetches indépendants — démarrer tôt, `await` tard
- `React.memo` pour les composants coûteux
- Dépendances primitives dans `useEffect` (pas d'objets instables)
- Dériver l'état pendant le render, pas dans les effets
- `functional setState` pour les callbacks stables
- **`useState` est INTERDIT si la valeur ne provoque pas de changement de rendu.** Avant chaque `useState`, se demander : « modifier cette valeur *seule* doit-il mettre à jour l'UI ? » Si non → `useRef` obligatoire. `useState` inutile provoque des re-rendus parasites et masque la vraie intention du code. Cas typiques où `useRef` est obligatoire :
  - `Animated.Value` (opère hors du cycle React)
  - Conteneurs mutés directement (`Map`, `Set`, array avec `splice`)
  - Snapshot de `route.params` ou props qui ne changent jamais
  - Valeur lue uniquement dans des callbacks, effects, ou autres refs
- JSX statique extrait hors du composant
- `Map`/`Set` pour les lookups O(1) répétés
- Early return dans les fonctions
- Hoister les `RegExp` hors des boucles

## Sécurité

- Toute nouvelle table → RLS policies dans `supabase/schema.sql`
- `user_id` toujours depuis `auth.uid()` Supabase — jamais depuis le payload client
- Secrets dans `expo-secure-store` uniquement (jamais AsyncStorage)
- Inputs utilisateur validés avant écriture en base
- Accès aux ressources privées vérifié par RLS, pas seulement côté client

## Schéma

- Tout changement de schéma (table, colonne, trigger, RLS, index PostGIS) → répercuté dans `supabase/schema.sql` (source de vérité)

## Internationalisation — zéro texte hardcodé

**Règle absolue : aucun texte visible par l'utilisateur n'est hardcodé, ni dans le code ni en base de données.**

### Principe général

- **Code (web + mobile)** : tout libellé, label, message d'erreur, consigne, placeholder ou texte d'interface passe par `t('clé')` (i18next). Zéro string littérale dans le JSX ou les fonctions UI.
- **Base de données** : la colonne `text_code` de `module_content_fields` contient une **clé i18n**, jamais le texte lui-même. Le rendu appelle `t(field.text_code)`.
- **Violations** : toute string littérale dans le JSX (hors valeurs purement techniques : ids, URLs, formats de date) est un bug bloquant — corriger avant de merger.

### Langues

| Fichier | Obligatoire | Fallback |
|---|---|---|
| `locales/fr/common.json` | Oui | — |
| `locales/en/common.json` | Oui | — |
| `locales/{de,es,it,pt}/common.json` | Best-effort | `en` via i18next |
| `locales/fr/teen.json` | Oui (clés module) | `fr/common` |
| `locales/en/teen.json` | Oui (clés module) | `en/common` |

### Convention de nommage des clés

- Clés de module : `modules.<module_id>.<élément>` — ex. `modules.phq9.instructions`, `modules.phq9.q1`, `modules.phq9.opt_0`
- Clés communes : `common.<élément>` — ex. `common.save`, `common.cancel`
- Clés d'interface par section : `<section>.<élément>` — ex. `auth.login_title`, `home.title`

### Mode ado (teen) — règle d'or

Chaque clé `modules.<module_id>.*` ajoutée dans `common.json` **doit** avoir une variante correspondante dans `teen.json` (fr + en). La variante teen utilise le tutoiement et un registre adapté aux adolescents.

- i18next résout `['teen', 'common']` : si la clé existe dans `teen`, elle prime ; sinon fallback sur `common`. L'absence dans `teen` est un **bug bloquant** pour toute clé de module.
- `de`, `es`, `it`, `pt` n'ont pas de `teen.json` — aucune traduction teen requise pour ces langues.
- **Le web n'a pas de mode ado** — `teen.json` est mobile uniquement.

### Fonctions de traduction — quand utiliser quoi

| Fonction | Quand l'utiliser | Exemple |
|---|---|---|
| `t('clé')` | Textes hors module (auth, navigation, common) | `t('common.save')` |
| `tt(moduleId, textKey)` | Textes de module dans les écrans custom (résout `modules.{moduleId}.{textKey}` en mode teen si actif) | `tt('phq9', 'instructions')` |
| `tg(textKey)` | Textes globaux avec override teen (résout `global.{textKey}`) | `tg('greeting')` |
| `useTranslation(isTeenMode ? ['teen', 'common'] : 'common')` | Dans `FieldRenderer` et tout composant générique qui reçoit une `text_code` depuis la base | Voir règle ci-dessous |

### FieldRenderer — intégration teen obligatoire

`FieldRenderer` et tous les composants du `ModuleRenderer` qui appellent `t(field.text_code)` **doivent** utiliser le namespace teen quand le mode est actif :

```ts
// Obligatoire dans FieldRenderer et ses layouts
const { isTeenMode } = useTeen()
const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
// t(field.text_code) résout automatiquement teen → common
```

Ne pas appeler `tt()` dans `FieldRenderer` — `text_code` est déjà la clé complète (`modules.phq9.q1`), pas un fragment.

### Nouveaux modules — checklist i18n

Avant toute PR introduisant un nouveau module :

- [ ] Toutes les clés `modules.<id>.*` ajoutées dans `fr/common.json` et `en/common.json`
- [ ] Toutes les clés `modules.<id>.*` ajoutées dans `fr/teen.json` et `en/teen.json` (tutoiement, registre ado)
- [ ] Clés optionnelles ajoutées dans `de/es/it/pt common.json` (best-effort)
- [ ] `text_code` en base référencent des clés existantes dans les locales
