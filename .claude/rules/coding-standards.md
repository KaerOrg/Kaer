# Coding Standards — Kær

> Ce fichier contient **les règles**. Les **cas vécus** qui les illustrent (incidents
> réels rencontrés en review) vivent dans [`lessons.md`](lessons.md), repérés ici par
> un pointeur 📌 sous chaque règle concernée. `lessons.md` est à **lire avant toute
> `pr-review`**.

## Principes fondamentaux — non négociables

- **Scalabilité d'abord** : chaque décision de design doit tenir à 10× la charge actuelle (patients, modules, praticiens).
- **Composants réutilisables** : tout composant ou fonction utilisé (ou susceptible d'être utilisé) dans ≥2 contextes est extrait dans `src/components/` ou `packages/shared/`. Zéro duplication.
- **Tests unitaires systématiques** : toute fonction de service, hook, et composant non-trivial est couvert avant livraison — happy path + cas d'erreur + edge cases.
> 📌 Cas vécus : voir [lessons.md § Tests et couverture](lessons.md).
- **Mocks synchronisés avec les exports** : tout renommage de fonction/hook exporté (`useModuleT` → `useModuleTranslation`) doit être répercuté dans **tous** les `jest.mock()`/`vi.mock()` qui le mentionnent. Un `grep` sur l'ancien nom avant de merger est obligatoire. Un mock périmé donne un faux sentiment de tests verts (la fonction mockée n'est jamais appelée, l'originale crashe en runtime).
> 📌 Cas vécu : voir [lessons.md § Mocks synchronisés](lessons.md).
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

> **Un composant `ui/` ne connaît AUCUN métier — vérifier ses imports.** Au-delà de
> la dépendance `features/`, un primitive ne doit importer **ni service, ni store,
> ni contexte métier, ni type de persistance** (`lib/database`, row Supabase), ni
> hardcoder une clé i18n de domaine (`scales.*`, `modules.*`). S'il le fait, ce n'est
> pas un primitive : il va dans `features/`, ou la donnée métier entre par une prop /
> un contrat générique local.
>
> 📌 Cas vécus : voir [lessons.md § Architecture ui/ vs features/](lessons.md).

---

## Un fichier = un composant — règle absolue

> **Un fichier `.tsx` exporte exactement un composant React.** Pas de second composant
> « utilitaire », pas de sous-composant privé déclaré à côté, pas de helper volumineux
> en vrac. Un fichier de composant a **une seule responsabilité**.

Dès qu'un fichier contient un deuxième composant, un helper non trivial, une grosse
constante de config ou de la logique qui n'est pas le cœur du composant : **extraire**
dans un fichier voisin du même dossier.

**Convention de dossier** (déjà appliquée par `layouts/*`, `fields/*`, `ui/*`) :

```
NomComposant/
  NomComposant.tsx        ← le composant, et lui seul
  NomComposant.test.tsx   ← son test, dans le même dossier
  SousPiece.tsx           ← chaque pièce extraite = son propre fichier
  helper.ts               ← helper pur = son propre fichier + son test
  types.ts                ← types partagés du dossier
  index.ts                ← re-exports publics
```

Ne jamais laisser un fichier de composant à plat à la racine d'un dossier qui suit
déjà la convention « un dossier par composant ».

**Pourquoi.** Un fichier qui accueille « juste un petit helper de plus » devient une
poubelle : chaque session y empile un bout de logique, le fichier central devient
illisible et impossible à faire évoluer sans risque. L'incident de référence :
`ModuleRenderer/FieldRenderer.tsx` avait fini par contenir le composant d'entrée,
le dispatcher de layout, le rendu du bandeau disclaimer et la logique de groupement
de fields — quatre responsabilités dans un fichier « central ». Il a été éclaté en
`FieldRenderer/{FieldRenderer,LayoutDispatcher,DisclaimerBanner}.tsx` +
`partitionBySection.ts` + `types.ts`.

**Cas des fichiers « centraux » (routeurs, dispatchers, points d'entrée).** Ils sont
les plus exposés au phénomène. Leur unique responsabilité doit rester le routage /
l'orchestration. Toute logique métier (groupement, transformation, rendu spécifique)
part dans un layout, un widget ou un helper dédié — jamais inline dans le routeur.

---

## Imports — alias `@ui` / `@theme`, jamais de relatif profond

> **Règle absolue, les deux apps.** Un primitive du design system s'importe par
> l'alias `@ui`, le thème par `@theme` — **jamais** par un chemin relatif profond
> (`../../../../../ui/X`, `../../theme`). Les alias sont configurés et opérationnels
> côté web **et** mobile.

| Alias | Cible | Exemple |
|---|---|---|
| `@ui/<Composant>` | `apps/<app>/src/components/ui/<Composant>` | `import { Radio, type RadioOption } from '@ui/Radio'` |
| `@theme` (mobile) | `apps/mobile/src/theme` (barrel) | `import { colors, spacing } from '@theme'` |

Config : web → `vite.config.ts` (`resolve.alias`) + `tsconfig.app.json` (`paths`) ;
mobile → `tsconfig.json` (`paths`, lu nativement par le metro d'Expo) + `package.json`
(`jest.moduleNameMapper`). Les deux apps résolvent déjà `@ui/*` (et `@theme` côté
mobile) en build, en runtime **et** en test.

```ts
// ❌ chemin relatif profond — illisible, casse au moindre déplacement de fichier
import { Radio } from '../../../../../ui/Radio'
// ✅ alias
import { Radio, type RadioOption } from '@ui/Radio'
```

> **Réflexe avant de commiter un import de primitive** : s'il commence par `../`,
> le convertir en `@ui/…`. Un `grep -rn "\.\./.*ui/" apps/*/src --include="*.tsx"`
> doit rester vide pour les nouveaux fichiers. La migration vers `@ui`/`@theme` est
> déjà actée (commit `6c55bef` + suivants) — ne pas réintroduire de relatif profond.

## Le design system EST ta boîte à outils — pas ton filet de sécurité

> **Principe fondamental.** On ne construit pas de l'UI et on ne vérifie pas ensuite si le design system couvre le besoin. On OUVRE le design system en premier, on assemble avec ce qui existe, et on n'écrit du JSX ou du CSS sur mesure que pour ce qui n'y est pas.
>
> La question n'est pas « est-ce que ce composant duplique quelque chose ? » — elle est « avec quoi du design system est-ce que je construis ça ? »
>
> Chaque `Pressable`, `View`, `Text` ad hoc dans un layout est une dette potentielle. La première réaction devant un besoin UI doit être : **ouvrir `src/components/ui/` et assembler**, pas ouvrir un fichier vide et coder.

## Checklist obligatoire — concevoir avec le design system, pas contre lui

> **Cette checklist s'applique dès la première ligne de JSX ou de StyleSheet — pas uniquement quand on "crée un composant". Un layout qui assemble des `Pressable` + `View` + styles ad hoc sans avoir consulté `src/components/ui/` a violé cette règle avant même d'être relié.**

**Étape 1 — Ouvrir l'inventaire (obligatoire, toujours en premier) :**
```
apps/web/src/components/ui/      ← Button, Card, Toggle, StatusBadge, Accordion, Tabs…
apps/web/docs/design-system.md   ← CSS custom properties, classes utilitaires
apps/mobile/src/components/ui/   ← Button, Card, InputField, EmptyState, Toast…
apps/mobile/docs/design-system.md
```

**Étape 2 — Pour chaque élément visuel à implémenter, se poser la question :**

> Un bouton ? → `ui/Button` (variants : primary, secondary, ghost, danger, iconLeft).
> Une carte / conteneur avec ombre + radius ? → `ui/Card` (variants, accentColor, onPress).
> Un champ de saisie ? → `ui/InputField`. Une liste déroulante ? → `ui/SelectField`.
> Un badge coloré ? → `ui/StatusBadge`. Un état vide ? → `ui/EmptyState`.
> Des onglets ? → `ui/Tabs`. Une bascule ? → `ui/Toggle`. Un accordéon ? → `ui/Accordion`.
>
> Si le composant existe → **l'utiliser directement**. S'il couvre le besoin à 90% → **ajouter la prop manquante**. Ne jamais écrire un `Pressable + Text + styles.xxxBtn` quand `Button` existe, ni un `View` avec shadow/radius quand `Card` existe.

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

> 📌 Cas vécu : voir [lessons.md § Design system, documentation](lessons.md).

**Anti-patterns bloquants — refuser d'écrire :**
- `Pressable + Text + StyleSheet` ad hoc quand `ui/Button` couvre le besoin
- `View` avec shadow + radius + padding codés en dur quand `ui/Card` couvre le besoin
- Tout markup qui reproduit visuellement un composant `ui/` existant
- Style inline `style={{ ... }}` pour autre chose qu'un calcul dynamique ponctuel
- Classe CSS définie dans le `.css` d'une page pour un pattern déjà présent dans un composant
- Nouveau `field_type` introduit sans consultation de l'inventaire `docs/module-engine.md`
- Couleur, taille, espacement hardcodés (#FFFFFF, 14px, 8px) — utiliser les tokens CSS (`var(--color-*)`, `var(--spacing-*)`, `var(--font-size-*)`)

### `<button>` natif (web) — quand c'est interdit, quand c'est légitime

> **Règle : aucun `<button>` HTML natif dans une page, un écran, un layout ou un
> composant `features/` dès qu'un primitive du design system couvre le besoin.**
> Avant d'écrire `<button`, ouvrir `apps/web/src/components/ui/` : si le besoin est un
> contrôle bouton, c'est `ui/Button` (variants `primary`/`secondary`/`danger`/`ghost`/
> `outline`, tailles `xs`→`lg`, `category`, `loading`, `fullWidth`, `icon` / icône-seule).
> Si c'est une puce/filtre/tag → `ui/Chip`. Un choix exclusif → `ui/SegmentedControl`.
> Une bascule on/off → `ui/Toggle`. Un onglet → `ui/Tabs`.

**Procédure devant un `<button>` existant ou à écrire :**

1. **Contrôle bouton** (label, ou icône, action au clic, état `disabled`/`loading`) →
   `ui/Button`. Inclut les CTA pleine largeur (`fullWidth`), les boutons « retour » /
   navigation icône-seule (`variant="ghost"` + `icon`), les « + Ajouter » (`variant="outline"`).
   Jamais de `<button className="xxx-btn">` + CSS `.xxx-btn` réinventant fond/bordure/radius.
2. **Le primitive couvre à 90 %** → l'**étendre** (prop/variante), pas réécrire un `<button>`.
   Ex. la prop `fullWidth` a été ajoutée à `Button` pour absorber les `*-save-btn` des
   layouts de preview au lieu de garder un `width:100%` ad hoc.
3. **Doublon d'un AUTRE primitive** (filtre, tag, choix exclusif, bascule) → migrer vers
   `Chip` / `SegmentedControl` / `Toggle`, pas vers `Button`.

**`<button>` natif légitime (ne PAS migrer) — uniquement ces cas :**

- **Le primitive lui-même** : `ui/Button`, `ui/Chip`, `ui/Tabs`, `ui/SegmentedControl`,
  `ui/Modal` (close), `ui/Banner`, `ui/Accordion`… un primitive ne se construit pas sur
  un autre.
- **Surface cliquable non bouton-shaped** : une carte, une ligne de liste/tableau, une
  cellule, un item de menu, une vignette entière rendue cliquable. `Button` imposerait
  son habillage (padding/fond/radius) — garder un `<button>` neutre (reset CSS) est correct.
- **Wrapper d'interaction autour d'un primitive présentationnel** : ex. `<button>`
  transparent (padding 0, sans fond) qui rend un `<Toggle>` cliquable. Ce n'est pas un
  bouton visuel.

> **Test décisif** : « ce `<button>` a-t-il un habillage de bouton (fond, bordure, radius,
> padding de bouton) ? » Si oui → `ui/Button` (ou la variante à ajouter). Si non (reset
> nu, surface large, wrapper) → natif légitime, mais le justifier en une ligne.

**Cas particulier — pas de variante exacte** : si le besoin est un contrôle bouton mais
qu'aucune variante ne correspond (ex. bouton « soft danger » persistant rouge clair),
**ne pas dégrader en outline neutre ni inventer un CSS parallèle silencieusement** :
soit ajouter la variante au design system (avec doc + test), soit laisser le `<button>`
natif **avec un commentaire** expliquant l'absence de primitive — pour qu'une session
ultérieure tranche, pas pour qu'elle re-réinvente.

**Incidents de référence :**
- `PatientPage` a réimplémenté `.module-toggle__track/thumb` au lieu de `<Toggle>` → bug de cohérence visuelle, refacto en review.
- `CrisisCompanionLayout` (PR #45, 2026-06-08) a écrit 4 styles de carte ad hoc + 3 styles de bouton ad hoc au lieu d'utiliser `<Card>` et `<Button>` → refacto requise post-review.

> 📌 Cas vécu : voir [lessons.md § Design system, tokens](lessons.md).

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

> **Passer par un service ne suffit pas : une feuille ne possède pas son propre
> cycle de données.** Un composant peut respecter « zéro Supabase dans un composant »
> (il appelle un service) tout en **embarquant la logique métier** : fetch dans un
> `useEffect`, mutation dans un handler, état de données local, `useAuthStore`/`useToast`
> internes. Si ses **frères remontent leur état au parent par props**, c'est une
> incohérence de couches : remonter aussi cette donnée à la page.
>
> 📌 Cas vécu : voir [lessons.md § Couches, feuille présentationnelle](lessons.md).

## Synchronisation distante (mobile) — toujours via syncHelpers

> **Règle absolue pour tout service mobile qui écrit ou supprime des données patient en SQLite.**

Toute fonction de service qui persiste une entrée patient localement doit enchaîner
la synchronisation vers Supabase via `syncUpsert` / `syncDelete` de
`apps/mobile/src/services/syncHelpers.ts`. Ne jamais appeler `dbSave()` seul.

```ts
// ✅ OUI — écriture locale + sync outbox atomique
import { syncUpsert, syncDelete } from './syncHelpers'

export async function saveMyEntry(entry: MyEntry): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: entry.module_id,
    entry_kind: 'my_entry_kind',   // valeur de EntryKind dans syncOutbox.ts
    payload: { ...entry },
  })
}

// ❌ NON — données jamais synchronisées
export async function saveMyEntry(entry: MyEntry): Promise<void> {
  await dbSave(entry)
}
```

- **Nouveau type de données** → ajouter la valeur à `EntryKind` dans `syncOutbox.ts` **avant** d'écrire le service.
- **Gate consentement** géré par `RemoteSyncService` — pas de `if (consentEnabled)` dans le service.
- **Mock de test standard** : `jest.mock('../services/sync', () => ({ RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) } }))`
- Détail et exceptions légitimes : [`.claude/rules/sync-service.md`](sync-service.md).

## Suppressions interdites

Ne jamais utiliser :
- `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`
- `// biome-ignore`, `// eslint-disable`
- `as any`, `as unknown as X`

Si le compilateur ou le linter signale une erreur, la corriger — jamais la supprimer.

`// eslint-disable-next-line` est inclus dans l'interdiction de `// eslint-disable`.

> 📌 Cas vécu : voir [lessons.md § Suppressions interdites](lessons.md).

## TypeScript strict

- Zéro `any`, zéro `as any`, zéro `as unknown` (seul ou en double-cast `as unknown as X`)
- Zéro `Function` comme type brut — toujours écrire la signature `(...args) => ReturnType`
- Zéro `Record<string, any>`, `Array<any>`, `Promise<any>`
- `catch (err: unknown)` est la seule forme autorisée de `unknown` — pour les `catch`, pas de `any`
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

## États mutuellement exclusifs — un seul `useState` discriminé, pas N states couplés

> **Règle : quand plusieurs `useState` ne peuvent jamais être actifs en même temps,
> ou décrivent les variantes d'une même chose, ils fusionnent en UN state à union
> discriminée.** Plusieurs `useState` que chaque handler doit remettre à `null` « en
> miroir » pour préserver une exclusivité sont un bug d'invariant en attente.

Le test : *« deux de ces states peuvent-ils être non-nuls en même temps ? »*
Si la réponse devrait toujours être « non », alors deux states séparés rendent cet
état illégal **représentable** — donc atteignable. Un state unique le rend
**irreprésentable**.

```ts
// ❌ Deux states couplés — l'exclusivité repose sur des setters synchronisés à la main
const [previewModule, setPreviewModule] = useState<ModuleType | null>(null)
const [dataModule, setDataModule]       = useState<ModuleType | null>(null)
const togglePreview = (t: ModuleType) => { setPreviewModule(p => p === t ? null : t); setDataModule(null) }
const toggleData    = (t: ModuleType) => { setDataModule(p => p === t ? null : t); setPreviewModule(null) }
// → un oubli de `setDataModule(null)` quelque part = les deux panneaux ouverts à la fois

// ✅ Un state discriminé — l'exclusivité est structurelle, illégale à violer
const [activePanel, setActivePanel] = useState<
  { kind: 'preview' | 'data'; module: ModuleType } | null
>(null)
const isPreviewOpen = (t: ModuleType) => activePanel?.kind === 'preview' && activePanel.module === t
const togglePreview = (t: ModuleType) =>
  setActivePanel(p => p?.kind === 'preview' && p.module === t ? null : { kind: 'preview', module: t })
```

Vaut aussi pour les **opérations concurrentes** d'un même groupe : `unlockingModule`
(un type) + `revokingModuleId` (une row id) → une seule bascule à la fois →
`{ op: 'unlock'; type } | { op: 'revoke'; id } | null`. Exposer des **helpers de
lecture** (`isPreviewOpen(type)`, `isModuleBusy(type, id)`) plutôt que répéter la
comparaison brute dans le JSX — un seul endroit à faire évoluer.

Corollaire — **un enfant reçoit le booléen dérivé, pas le state brut.** Une feuille
qui ne gère qu'un module ne reçoit pas `previewModule: ModuleType | null` pour le
comparer elle-même à sa constante : elle reçoit `previewOpen: boolean`. La dérivation
(`isPreviewOpen('x')`) reste chez le parent qui possède le state.

> 📌 Cas vécu : voir [lessons.md § États mutuellement exclusifs](lessons.md).

## Une entité cohérente reste UN objet — on ne l'éclate jamais en N variables

> **Règle : une donnée qui est conceptuellement une seule chose (une entité, un
> agrégat aux champs solidaires) se manipule comme UN objet — jamais éclatée en N
> variables/`useState` parallèles.** Peu importe d'où elle vient (`await`, props,
> store, construite à la main) : la provenance n'est pas le critère. Le critère est
> ontologique — *est-ce que ces champs décrivent une même chose ?*

Le test : *« ces champs sont-ils des facettes d'une même entité (l'identité d'un
patient, une adresse, une période) ? »* Si oui, ils vivent dans un objet. Les éclater
en `patientEmail` / `patientAlias` / `patientFirstName`… multiplie les points de
mise à jour, casse le passage en une seule prop, et rend représentable un état
incohérent (3 champs sur 6 renseignés). Que la valeur soit chargée d'un coup ou champ
par champ ne change rien : on n'éclate pas un objet.

```ts
// ❌ Une même entité « identité » éclatée en 6 variables parallèles
const [patientEmail, setPatientEmail]         = useState('')
const [patientAlias, setPatientAlias]         = useState<string | null>(null)
const [patientFirstName, setPatientFirstName] = useState<string | null>(null)
// …+3 autres — 6 setters à synchroniser, impossible à passer en une prop

// ✅ L'entité reste un objet — un seul point de vérité, une seule prop
type PatientIdentity = { email: string; alias: string | null; firstName: string | null
                         lastName: string | null; enrolledAt: string | null; teenMode: boolean }
const [identity, setIdentity] = useState<PatientIdentity>(PATIENT_IDENTITY_INITIAL)
// mutation ciblée d'un champ : setIdentity(prev => ({ ...prev, teenMode: next }))
```

**Ce qui reste DEHORS de l'objet** — ne pas sur-regrouper : seul ce qui appartient
*ontologiquement* à l'entité y entre. Un **flag transitoire** (busy/loading d'une
opération, ex. `togglingTeen`) ou un champ **édité indépendamment** par l'UI
(`generalNote`, qui est aussi un input) ne sont pas de l'« identité » → states séparés.
Le critère reste le même qu'à l'inclusion : appartenance à l'entité, pas provenance.

> 📌 Cas vécu : voir [lessons.md § Une entité cohérente reste UN objet](lessons.md).

## Design system

- Glassmorphisme : `GlassCard` + `BlurView`
- Boutons gradient : `PremiumButton`
- Avatars : `PremiumAvatar`
- Couleurs et spacing : tokens du thème (`colors`, `spacing`, `radius`, `shadows` de `apps/mobile/src/theme/`) — **ne jamais hardcoder**
- Animations complexes : `React Native Reanimated` uniquement (jamais `Animated` de base)

**Couleurs — toujours via le thème :**
```ts
// ❌ Couleur en dur dans un StyleSheet — même si colors est importé à côté
retryBtnText: { color: '#fff' }     // ← couleur blanche en dur

// ✅ Token du thème partagé
import { colors } from '../../theme'
retryBtnText: { color: colors.white }   // colors.white = '#FFFFFF' dans @kaer/shared
```
`colors.white` existe dans `@kaer/shared/src/theme.ts`. Toujours l'importer au lieu d'écrire `'#fff'` ou `'#FFFFFF'`.

**Shadows — toujours via les tokens `shadows.sm/md` :**
```ts
// ❌ Bloc shadow copié en dur
{ shadowColor: '#000', shadowOffset: ..., shadowOpacity: 0.08, ... }

// ✅ Token prêt à l'emploi
import { shadows } from '../../theme'
{ ...shadows.md }   // ou shadows.sm selon l'intensité souhaitée
```

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
- **`field_props.prop_value` est atomique** (PK `(field_id, prop_key)`) : jamais de valeur packée (CSV, JSON, `kind:param:param`). Attribut nommé → prop frère ; liste → clés indexées `base_1`/`base_2` lues par `collectIndexed`. Règle et arbre de décision : [`config-first.md`](config-first.md) § « Jamais de valeur packée dans `field_props.prop_value` ».
> 📌 Cas vécu : voir [lessons.md § field_props : prop_value atomique](lessons.md).

## Ponctuation : pas de tiret long (U+2014 ni U+2013)

> **Règle absolue, systématique, pour tout texte visible par l'utilisateur et toute rédaction de l'assistant.**

Le tiret cadratin (U+2014) et le tiret demi-cadratin (U+2013) sont **bannis** des textes
visibles (locales i18n, contenu psyedu, labels, messages, prose) et de toute rédaction de
l'assistant (réponses, messages de commit, docs rédigées par l'IA). Ils signent une
écriture automatique et nuisent à la lisibilité.

Remplacer par la ponctuation la plus juste selon le contexte :

- introduit une explication ou une définition : deux-points « : »
- apposition, incise, énumération : virgule « , »
- deux idées indépendantes : point « . » ou point-virgule « ; »
- plage de valeurs : « à » (ex. « 16 à 18 °C »)
- citation type « Source (année) [tiret] Titre » : deux-points (« Source (année) : Titre »)

Exception : un tiret marqueur de **cellule vide** dans un tableau Markdown, ou
**placeholder de valeur absente** en code (`value || '-'`), n'est pas de la prose ;
utiliser un trait d'union simple `-`, jamais un tiret long, et ne pas le changer en virgule.

> 📌 Cas vécu : voir [lessons.md § Ponctuation, tiret long](lessons.md).

Vérification avant commit sur des textes visibles : `grep -rlP "\x{2014}|\x{2013}" apps/*/src/i18n/locales` doit être vide. Étendre le `grep` aux `.tsx` pour attraper les placeholders `'–'` codés en dur : `grep -rnP "'[\x{2013}\x{2014}]'" apps/*/src`.

---

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
