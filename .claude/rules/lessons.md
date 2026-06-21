# Leçons : cas vécus en revue (Kær)

> **À lire intégralement avant toute `pr-review`.** Ce fichier est le journal des
> incidents réels rencontrés en review : chaque entrée est un piège déjà tombé, daté
> et rattaché à une règle de [`coding-standards.md`](coding-standards.md). Les règles
> disent *quoi* faire ; ce journal montre *comment ça a concrètement dérapé* — c'est
> ce qui permet de rattraper la même erreur la prochaine fois.
>
> **Pour les humains** : à parcourir avant d'ouvrir une PR. **Pour le skill
> `pr-review`** : lecture obligatoire en Étape 0, et l'enrichissement (Étape 5) ajoute
> ici les nouveaux cas (pas dans `coding-standards.md`, qui ne garde que les règles).

---

## Tests et couverture

> Règle source : [coding-standards.md § Principes fondamentaux](coding-standards.md#principes-fondamentaux--non-négociables).

**improve-module-organization (2026-06-12) — faux sentiment de couverture.**
La logique pure extraite (`lib/moduleFilter.ts`) était testée exhaustivement, mais
les composants qui la consomment (`ModuleFilterBar`, `ModuleTagChips` — callbacks,
rendu conditionnel) n'avaient aucun `.test.tsx`, et la nouvelle fonction
`fetchModuleTaxonomy()` n'a pas été ajoutée au `moduleCatalogService.test.ts`
**existant**.
→ Tester le helper pur ne dispense ni du test de rendu/interaction des composants,
ni d'**étendre le test du service** quand on lui ajoute une fonction. Checklist :
chaque fichier source créé OU chaque export ajouté = son test dans le même commit.

**refonte/agenda-sommeil (2026-06-15) — le piège inverse.**
`sleepHelpers.ts` (date-math : passage minuit, index lundi, jours du mois) créé
**sans `sleepHelpers.test.ts`**, et `SleepDataPanel.tsx` (géométrie noon→noon) créé
**sans test** — couverts seulement *indirectement* par un test d'intégration de
layout.
→ Une **couverture d'intégration ne remplace pas** le test unitaire d'un helper pur
à cas limites ni le test de rendu d'un composant à logique : un fichier source créé
exige **son** test direct, même si « ça passe » via un test plus haut.

---

## Mocks synchronisés avec les exports

> Règle source : [coding-standards.md § Principes fondamentaux](coding-standards.md#principes-fondamentaux--non-négociables).

**refonte-tolerance-detresse (2026-06-09).**
Le renommage `useModuleT → useModuleTranslation` a cassé 5 suites de tests mobiles :

```ts
// ❌ mock avec l'ancien nom → useModuleTranslation = undefined au runtime
jest.mock('hooks/useModuleT', () => ({ useModuleT: () => k => k }))
// ✅ mock avec le nouveau nom
jest.mock('hooks/useModuleT', () => ({ useModuleTranslation: () => k => k }))
```

→ Avant de commiter un renommage : `grep -r "useModuleT\b" apps/mobile --include="*.test.*"`

---

## Architecture `ui/` vs `features/`

> Règle source : [coding-standards.md § Architecture des composants](coding-standards.md#architecture-des-composants--ui-vs-features).

**tableau-de-bord-olivier (2026-06-06) — fuite métier dans un `ui/`.**

```ts
// ❌ ui/Chart/.../chartUtils.ts importait le type de persistance ScaleEntry
import type { ScaleEntry } from '../../../../lib/database'
export function buildChartData(entries: ScaleEntry[], …) { … }
// ✅ contrat générique local au design system ; ScaleEntry le satisfait structurellement
import type { ChartEntry } from '../chartTypes'   // { created_at, total_score, subscale_scores }
export function buildChartData(entries: ChartEntry[], …) { … }
```

```ts
// ❌ ui/ScaleMetaBadges importait scaleService + hardcodait des clés scales.* → c'est du métier
// ✅ déplacé dans components/features/ScaleMetaBadges/ (connaît le domaine des échelles)
```

→ Test : « si je supprime tout le métier (services, stores, types BDD, clés i18n de
domaine), le composant `ui/` compile-t-il encore et reste-t-il utile ailleurs ? »
Si non, il est mal rangé.

---

## Design system : documentation d'un composant ou prop

> Règle source : [coding-standards.md § Checklist obligatoire](coding-standards.md#checklist-obligatoire--concevoir-avec-le-design-system-pas-contre-lui).

**improve-module-organization (2026-06-12).**
La PR a fait le geste *parfait* côté code — étendre `ui/Chip` avec une prop
`size: 'sm' | 'md'` au lieu de dupliquer — mais a oublié la doc : ni la ligne `size`
dans la table des props `### Chip` du design-system, ni de section pour les deux
nouveaux composants `features/` (`ModuleFilterBar`, `ModuleTagChips`).
→ La règle vaut aussi pour une **simple prop ajoutée** à un composant existant, et
pour les composants `features/` (pas seulement `ui/`) : table des props + exemple
d'usage dans `apps/<app>/docs/design-system.md`, **dans le même commit**.

---

## Design system : tokens (pas de valeur hardcodée)

> Règle source : [coding-standards.md § `<button>` natif (web)](coding-standards.md#button-natif-web--quand-cest-interdit-quand-cest-légitime).

**tableau-de-bord-olivier (2026-06-06).**
`CaseloadTable.css` figeait 25+ teintes de charte (en-tête teal, dégradé de lignes,
accents de section) en hexadécimal brut, parce qu'aucun token existant ne correspondait.

```css
/* ❌ Teinte de charte absente du jeu de tokens → figée en dur dans un CSS de feature */
.caseload-data-table .data-table__th { background: #D3ECED; color: #2C6E72; }
.caseload-detail__section--actions   { background: #EFF6FF; border-left-color: #3B82F6; }
```

→ « Pas de token adapté » n'autorise **pas** le hex en dur : on **ajoute la teinte au
jeu de tokens** (`--color-caseload-header`, `--color-section-actions`…) dans le
`:root`, puis on la référence. L'habillage reste centralisé et thématisable au lieu
d'être dispersé dans le CSS d'une feature.

---

## Couches : une feuille ne possède pas son cycle de données

> Règle source : [coding-standards.md § Accès aux données](coding-standards.md#accès-aux-données--toujours-passer-par-un-service-fonctionnel).

**tableau-de-bord-olivier (2026-06-06).**
Dans `CaseloadTable`, `ActionList`/`WaitList` reçoivent `actions`/`waits` + callbacks
par props (état possédé par `FileActivePage`), mais la feuille sœur `ObservationBlock`
faisait son propre `fetchCaseloadNotes` + `createCaseloadNote`, possédait son état
`notes`, et lisait `useAuthStore`/`useToast`.

```tsx
// ❌ Feuille qui s'auto-alimente — logique métier dans le composant
function ObservationBlock({ entryId }: { entryId: string }) {
  const { practitioner } = useAuthStore()
  const [notes, setNotes] = useState<CaseloadNote[]>([])
  useEffect(() => { fetchCaseloadNotes(entryId).then(setNotes) }, [entryId])
  const handleAdd = async () => { await createCaseloadNote(practitioner.id, entryId, body) }
}
// ✅ Feuille présentationnelle — données + actions injectées par la page
function ObservationBlock({ notes, onAddNote }: ObservationBlockProps) { … }
```

→ Remonter la possession des notes à `FileActivePage` (slice `notesByEntry` ou
callbacks `onLoadNotes`/`onAddNote`), aligné sur le pattern des frères.

---

## Suppressions interdites (eslint-disable)

> Règle source : [coding-standards.md § Suppressions interdites](coding-standards.md#suppressions-interdites).

**refonte/agenda-sommeil (2026-06-15).**

```ts
// ❌ SleepEntryView.tsx — disable pour masquer exhaustive-deps (lbl omis des deps)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [quality, existingId, targetDate, /* … lbl manquant */ ])
// ✅ lbl est un useCallback STABLE côté parent → l'ajouter aux deps, pas de disable
}, [quality, existingId, targetDate, /* … */ lbl, t, showToast, onClose])
```

→ Une dépendance `useCallback`/`useMemo` stable se met **dans** le tableau de deps :
l'avertissement exhaustive-deps se corrige en listant la dépendance, jamais en la
supprimant. Avant de commiter : `grep -rn "eslint-disable" apps/*/src --include="*.ts*"`.

---

## États mutuellement exclusifs

> Règle source : [coding-standards.md § États mutuellement exclusifs](coding-standards.md#états-mutuellement-exclusifs--un-seul-usestate-discriminé-pas-n-states-couplés).

**improve-module-organization (2026-06-12).**
`PatientModulesTab` portait 4 states couplés deux à deux (`previewModule`/`dataModule`
exclusifs ; `unlockingModule`/`revokingModuleId` = une seule bascule). Fusionnés en
`activePanel` + `busyModule` discriminés, avec helpers `isPreviewOpen`/`isDataOpen`/
`isModuleBusy` ; la carte enfant `MedicationSideEffectsCard` est passée de 3 props
`ModuleType | null` à 3 booléens `loading`/`previewOpen`/`dataOpen`.

---

## Une entité cohérente reste UN objet

> Règle source : [coding-standards.md § Une entité cohérente reste UN objet](coding-standards.md#une-entité-cohérente-reste-un-objet--on-ne-léclate-jamais-en-n-variables).

**PatientPage (2026-06-12).**
L'identité patient était éclatée en 6 `useState`
(`email`/`alias`/`firstName`/`lastName`/`enrolledAt`/`teenMode`). Regroupée en un seul
`identity: PatientIdentity`. `togglingTeen` (flag busy) et `generalNote` (input
éditable) laissés dehors car ils ne sont pas l'entité identité. Les tests, qui
assertaient sur le rendu et non sur les noms de states, sont restés verts.

---

## Ponctuation : pas de tiret long

> Règle source : [coding-standards.md § Ponctuation](coding-standards.md#ponctuation--pas-de-tiret-long-u2014-ni-u2013).

**refonte/agenda-sommeil (2026-06-15).**

```tsx
// ❌ Placeholder de valeur absente écrit avec un demi-cadratin U+2013
<Text>{avgSleep !== null ? formatMinutes(avgSleep) : '–'}</Text>
// ✅ Trait d'union simple ASCII
<Text>{avgSleep !== null ? formatMinutes(avgSleep) : '-'}</Text>
```

→ Le placeholder « valeur absente » reste un **trait d'union simple `-`** : même
dispensé de la conversion en ponctuation, il ne doit jamais être un `–`/`—`.
