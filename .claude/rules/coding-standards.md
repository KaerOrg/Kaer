# Coding Standards — PsyTool

## Principes fondamentaux — non négociables

- **Scalabilité d'abord** : chaque décision de design doit tenir à 10× la charge actuelle (patients, modules, praticiens).
- **Composants réutilisables** : tout composant ou fonction utilisé (ou susceptible d'être utilisé) dans ≥2 contextes est extrait dans `src/components/` ou `packages/shared/`. Zéro duplication.
- **Tests unitaires systématiques** : toute fonction de service, hook, et composant non-trivial est couvert avant livraison — happy path + cas d'erreur + edge cases.
- **Documentation inline ciblée** : uniquement pour la logique non-évidente (invariants, workarounds, race conditions). Le reste se documente dans CLAUDE.md et les fichiers `.md` de feature.

## Architecture des composants — `ui/` vs `features/`

> **Règle absolue pour tout nouveau composant.**

`src/components/` est divisé en deux sous-dossiers selon la nature du composant :

| Dossier | Rôle | Exemples |
|---|---|---|
| `components/ui/` | Primitives du design system — sans logique métier, sans appel service | `Button`, `Card`, `Toggle`, `Modal`, `StatusBadge`, `InputField` |
| `components/features/` | Composants métier — connaissent les domaines (agenda, module, patient, notification) | `Layout`, `WeekGrid`, `ModuleRenderer`, `AppointmentModal`, `TeenAccent` |

**Règle de dépendance : `features → ui` uniquement.** Un composant `ui/` ne doit jamais importer depuis `features/`. Un composant `features/` peut importer librement depuis `ui/`.

**Ajouter un composant :**
- Primitif générique, réutilisable hors de tout contexte métier → `components/ui/NomComposant/`
- Lié à un domaine spécifique (patients, modules, agenda…) → `components/features/NomComposant/`

---

## Checklist obligatoire avant tout nouveau CSS, composant UI, ou field_type

> **Cette checklist s'applique avant d'écrire la moindre ligne de CSS inline, de créer une classe CSS ad hoc, d'implémenter un nouveau composant dans une page, ou d'introduire un nouveau `field_type` dans `module_content_fields`.**

**Étape 1 — Chercher dans le design system web :**
```
apps/web/src/components/ui/   ← primitives (Card, Button, Toggle, StatusBadge, Accordion…)
apps/web/docs/design-system.md  ← référence CSS custom properties, classes utilitaires
```
**Étape 2 — Chercher dans le design system mobile :**
```
apps/mobile/src/components/ui/
apps/mobile/docs/design-system.md
```
**Étape 3 — Pour tout `field_type` ou layout FieldRenderer — consulter l'inventaire complet :**
```
docs/module-engine.md  ← section "Inventaire complet des field_types" (44+ types recensés)
```
Un `field_type` introduit sans avoir consulté cette table est un bug d'architecture : un équivalent existe probablement déjà.

**Étape 4 — Un composant existant a le même but fonctionnel mais ne couvre pas exactement le besoin ?**
→ **Le retravailler en priorité** : ajouter une prop, une variante, un slot. C'est la voie normale.
→ Créer un nouveau composant uniquement si le rework implique un virage trop important (changement de contrat, rupture de l'API existante, logique fondamentalement différente). Ce cas doit rester **marginal et rarissime** — justifier explicitement pourquoi l'extension n'était pas possible.

**Étape 5 — Si un nouveau composant est créé malgré tout :**
Mettre à jour le document de référence correspondant **dans le même commit** :

| Composant créé | Document à mettre à jour |
|---|---|
| Nouveau `field_type` | `docs/module-engine.md` — inventaire des field_types |
| Nouveau widget web/mobile | `apps/web/docs/design-system.md` ou `apps/mobile/docs/design-system.md` |
| Nouveau service | `docs/services.md` |
| Nouveau layout (`preview_kind`) | `docs/module-engine.md` — section layouts |
| Nouveau composant UI primitif | Design system doc de l'app |

Un composant livré sans sa trace documentaire crée de la dette invisible — les sessions suivantes vont réimplémenter la même chose. C'est précisément ce biais systémique qui a motivé cette règle.

**Anti-patterns bloquants — refuser d'écrire :**
- Markup HTML qui duplique un composant existant (`Toggle`, `Card`, `Button`, `StatusBadge`…)
- Style inline `style={{ ... }}` pour autre chose qu'un calcul dynamique ponctuel
- Classe CSS définie dans le `.css` d'une page pour un pattern déjà présent dans un composant
- Nouveau `field_type` introduit sans consultation de l'inventaire `docs/module-engine.md`
- Couleur, taille, espacement hardcodés (#FFFFFF, 14px, 8px) — utiliser les tokens CSS (`var(--color-*)`, `var(--spacing-*)`, `var(--font-size-*)`)

**Rappel :** la session où `PatientPage` a réimplémenté `.module-toggle__track/thumb` au lieu de `<Toggle>` illustre exactement ce problème. Coût : bug de cohérence visuelle découvert à la revue, refactorisation supplémentaire.

## Architecture en couches — ne jamais mélanger

- **UI** (`src/screens/`, `src/components/`) : affichage uniquement — zéro logique métier, zéro appel Supabase direct
- **Logique** (`src/services/*.ts`) : toutes les opérations Supabase/API ici
- **State global** (`src/contexts/`) : uniquement auth et location
- **Types** (`src/types/`) : interfaces exportées, réutilisables par toutes les couches
- Composant utilisé dans ≥2 écrans → `src/components/`
- Fonctions de service : pures, paramètres typés, sans side effects

## Accès aux données — toujours passer par un service fonctionnel

> **Règle absolue pour toute nouvelle PR.** Aucun appel à Supabase, à SQLite (`db.*`), à Supabase Storage ou à une edge function ne doit apparaître dans une page, un écran ou un composant. Toute opération de données passe par une fonction nommée d'un fichier `apps/<app>/src/services/<domaine>Service.ts`.

### Concrètement, dans un composant ou un écran

- **Interdit** : `import { supabase } from '../lib/supabase'` ou `import { db } from '../lib/database'` directement, suivi d'un `supabase.from(...)`, `supabase.auth.*`, `supabase.functions.invoke(...)`, `supabase.storage.*`, `db.execAsync(...)`, etc.
- **Obligatoire** : `import { fetchPatientHeader, setTeenMode } from '../services/patientService'` puis appel direct à la fonction. Le composant ne sait pas s'il y a une requête SQL derrière.

### Pourquoi cette règle

- **Réutilisation** — la même requête sert souvent à plusieurs écrans (ex. liste patients dashboard + dispensaire). Elle s'écrit *une seule fois*.
- **Testabilité** — un service se mocke avec `jest.mock('.../xxxService')` ; le client Supabase n'apparaît jamais dans les tests d'écrans.
- **Conformité MDR 2017/745** — le service centralise la conversion `userInput → row insert`, ce qui garantit qu'aucune logique d'interprétation clinique ne se glisse dans l'UI.
- **Lisibilité** — un écran de 600 lignes parle métier (`unlockModule`, `logEvent`), pas plomberie (`supabase.from('patient_modules').insert(...)`).

### Exceptions strictement limitées

Une seule exception : les fichiers d'**infrastructure / client** dans `src/lib/` peuvent utiliser le client Supabase ou SQLite directement, parce qu'ils l'instancient ou l'enrobent une fois pour tout le projet :

- `src/lib/supabase.ts` — création du client Supabase
- `src/lib/database.ts` (mobile) — wrapper SQLite générique (CRUD locaux par table)

Tout le reste — y compris les stores Zustand — passe par un service. Les stores délèguent aux services et n'exposent qu'un état réactif (cf. `apps/web/src/store/authStore.ts` et `apps/mobile/src/store/authStore.ts`).

### Procédure pour un nouveau dev

1. Avant d'écrire `supabase.from(...)` dans un composant : ouvrir `apps/<app>/src/services/` et chercher si une fonction existe déjà (`fetchX`, `saveX`, `unlockX`).
2. Si elle existe → l'appeler.
3. Si elle n'existe pas → créer ou étendre le service du domaine concerné, exporter une fonction typée, l'appeler depuis le composant.
4. Couvrir le service par un test unitaire (cf. les tests existants à côté de chaque service).
5. Référence complète : [`docs/services.md`](../../docs/services.md).

### Anti-pattern à refuser en revue

```tsx
// ❌ NON — appel direct dans un composant
function MyScreen() {
  const save = async () => {
    await supabase.from('patient_modules').insert({ ... })
  }
}

// ✅ OUI — service fonctionnel nommé
import { unlockModule } from '../services/moduleAssignmentService'

function MyScreen() {
  const save = async () => {
    const result = await unlockModule(patientId, practitionerId, type)
    if (!result.ok) setError(result.message)
  }
}
```

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

## Inputs non contrôlés — préférer `useRef` quand possible

**Règle : un input est contrôlé (`value` + `onChange` + `useState`) seulement si sa valeur dérive d'autre chose dans l'UI (validation visible, désactivation d'un bouton, formatage en live, etc.).** Dans tous les autres cas, utiliser un input non contrôlé (`defaultValue` + `ref`) — zéro re-render à chaque frappe.

Critères pour choisir :

| Critère | Contrôlé (`useState`) | Non contrôlé (`useRef`) |
|---|---|---|
| La valeur de l'input conditionne l'UI (classe, `disabled`, autre champ) | Oui | — |
| La valeur est lue uniquement au submit | — | Oui |
| Reset après submit | `setState(initial)` | `ref.current.value = initial` |

```tsx
// ❌ Contrôle inutile — la valeur ne sert qu'au submit
const [note, setNote] = useState('')
<textarea value={note} onChange={e => setNote(e.target.value)} />

// ✅ Non contrôlé — zéro re-render, reset impératif
const noteRef = useRef<HTMLTextAreaElement>(null)
<textarea ref={noteRef} defaultValue="" />
// Au submit : noteRef.current?.value
// Reset : if (noteRef.current) noteRef.current.value = ''
```

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
