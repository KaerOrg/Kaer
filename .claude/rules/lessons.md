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

**refonte/chronobiologie (2026-06-21) — le composant testé… est mocké.**
`ChronoRhythmogram.tsx` (web) créé avec de la logique (`buildHourTicks`, tooltip
`anchors.find`, filtre `count >= 1`) **sans `ChronoRhythmogram.test.tsx`**. Le seul
consommateur testé (`ChronoRhythmogramPanel.test.tsx`) le **mocke entièrement** :
```ts
vi.mock('../../../components/features/ChronoRhythmogram', () => ({ ChronoRhythmogram: () => <div data-testid="rhythmogram" /> }))
```
→ couverture réelle = **zéro** (même pas indirecte). En parallèle, la fonction pure
`chronoAnchors.buildRhythmogramAnchors` créée sans test (`grep` du nom sur les tests
= vide).
→ Réflexe review : pour chaque source créé, chercher **son** test direct ET vérifier
que les tests des consommateurs ne le **mockent** pas (un mock du composant *prouve*
qu'il n'est pas couvert là). `grep -rln "MonComposant\|maFonctionPure" apps/*/src | grep test`.

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

**refonte/chronobiologie (2026-06-21) — « cohérent avec le legacy » n'est PAS une excuse.**
Deux nouveaux boutons `dateBtn`/`prefillBtn` écrits en `Pressable + icône + Text +
styles.xxxBtn` dans `ColumnFormLayout`, alors que `ui/Button` (mobile) couvre le
besoin (`iconLeft` + `variant` + `label` + `accessibilityLabel`).
```tsx
// ❌ bouton ad hoc reproduisant ui/Button
<Pressable style={styles.dateBtn} onPress={…}><Icon/><Text style={styles.dateBtnText}>…</Text></Pressable>
// ✅ le primitive du design system
<Button variant="secondary" iconLeft={<Icon/>} label={…} onPress={…} accessibilityLabel={…} />
```
La review l'avait d'abord déclassé en « point d'attention » au motif que le fichier
contenait déjà des boutons ad hoc (`saveBtn`/`cancelBtn`/`newBtn`/`timeButton`).
**Erreur** : c'est de la dette préexistante, pas une norme. Le fait qu'un fichier
bypasse déjà le design system n'**autorise jamais** un nouveau bypass.
→ **`Pressable + Text + styles.xxxBtn` quand `ui/Button` existe = violation
bloquante, sans exception.** On ne bypass jamais le design system ; on étend le
primitive ou on l'utilise. « Cohérent avec le code voisin » ne s'applique qu'au
code **conforme** — jamais pour propager une violation.

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

## Parité web ≡ mobile : la donnée synchronisée doit porter le bon horodatage

> Règle source : [coding-standards.md § Synchronisation distante](coding-standards.md#synchronisation-distante-mobile--toujours-via-synchelpers) + Étape 4 du skill (parité web ≡ mobile).

**refonte/chronobiologie (2026-06-21) — la date rétroactive n'atteint jamais le serveur.**
La feature « saisie rétroactive » laisse le patient dater une saisie dans le passé.
Mobile écrit la date choisie dans SQLite (`saveFormEntry({ ..., created_at })`) → le
rythmogramme **mobile** (lu depuis SQLite) est correct. Mais `syncHelpers.syncUpsert`
**force** l'horodatage et **interdit** de le surcharger :
```ts
type UpsertParams = Omit<EnqueueParams, 'operation' | 'client_created_at'>
// …
enqueue({ ...params, operation: 'upsert', client_created_at: new Date().toISOString() })
```
Côté web, `fetchChronoEntries` date chaque saisie via `client_created_at` — son
propre commentaire annonçait le contrat « ce champ porte le jour concerné », contrat
**rompu** par `syncUpsert`. Résultat : la même saisie apparaît à **deux jours
différents** sur mobile (patient) et web (praticien).
→ Quand une saisie patient porte une **date métier** distincte de l'instant de sync
(saisie rétroactive, antidatée), cette date doit voyager jusqu'à `patient_entries`
(`client_created_at` surchargeable dans `syncUpsert`). Réflexe review : si le mobile
lit la date depuis SQLite et le web depuis `client_created_at`, vérifier que les deux
**convergent** — sinon parité rompue, même si « ça marche » sur chaque plateforme
isolément.

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

**refonte/psychotropes-et-alimentation (2026-06-22) — `as unknown as` pour un mock de test.**
`useMedicationListEditor.test.ts` construit un objet `modules` partiel via un
double-cast, en recopiant le pattern d'un test frère (`useMedicationEffectsEditor.test.ts`) :

```ts
// ❌ contourne le typage pour un mock partiel
const modules = [{ id: 'pm1', module_type: 'medication_adherence' } as unknown as PatientModule]
// ✅ factory typée locale, ou Partial explicite assemblé en objet complet
function makePatientModule(over: Partial<PatientModule>): PatientModule { return { ...BASE, ...over } }
const modules = [makePatientModule({ id: 'pm1', module_type: 'medication_adherence' })]
```

→ L'interdiction de `as unknown as X` **n'a pas d'exception « c'est un test »** : un
mock partiel se construit avec une factory typée (ou `satisfies`), pas en cassant le
typage. Le fait qu'un test frère le fasse déjà n'autorise pas à propager le motif.

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

**refonte/psychotropes-et-alimentation (2026-06-22) — tiret long dans une valeur i18n visible.**
Six clés `modules.medication_adherence.calendar_legend` (mobile fr/en common + teen,
web fr/en common) écrites avec un cadratin U+2014 dans le texte rendu à l'écran :

```json
// ❌ apps/mobile/src/i18n/locales/fr/common.json — texte visible patient
"calendar_legend": "Jour renseigné — couleur du statut déclaré"
// ✅ deux-points : introduit l'explication
"calendar_legend": "Jour renseigné : couleur du statut déclaré"
```

→ La règle ponctuation vaut **en priorité dans les locales** : une valeur de
`common.json`/`teen.json` est du texte visible. Toute incise/définition au tiret long
se remplace par deux-points (ou virgule selon le sens). Vérif systématique avant
commit i18n : `grep -rlP "\x{2014}|\x{2013}" apps/*/src/i18n/locales` doit être vide.
