# Moteur de données de démo (2 mois) — cohérence web ≡ mobile

> Ticket d'origine : #112. Statut : **infra générique + générateur de référence
> `sleep_diary` livrés**. Générateur `behavioral_activation` et purge des entrées
> serveur pré-existantes : follow-up (voir dernière section).

## Pourquoi

Un module ne se juge pas à vide : ses défauts d'UX n'apparaissent qu'avec des données
réalistes. Le moteur de démo fabrique **~2 mois d'utilisation artificielle continue**
par module, **visibles de façon identique sur l'app web praticien et l'app mobile
patient**.

## Principe d'architecture

Le générateur **vit dans l'app mobile**, jamais côté serveur. Il écrit via la **couche
services réelle du module** (`saveSleepEntry`, …) :

```
générateur → service réel du module → syncUpsert → SQLite (mobile)
                                                  → sync_outbox → patient_entries (Supabase)
                                                                → lecture web praticien
```

Conséquences directes :

- **Cohérence web ≡ mobile par construction** : la démo emprunte exactement le même
  pipeline qu'une vraie saisie patient. Ce qui apparaît sur mobile apparaît sur web.
- **Pipeline de sync réellement exercé** (outbox → `patient_entries`).
- **`tsc` casse le générateur si le schéma d'un module change** : le générateur dépend
  du type d'entrée du service, donc une évolution de payload est détectée à la compilation.

## Garde-fous non négociables

| Garde-fou | Mise en œuvre |
|---|---|
| **Comptes de test uniquement** | `generateDemoForModule` / `purgeAllDemo` refusent si l'email n'est pas dans `TEST_ACCOUNT_EMAILS` (`isTestAccount`). Barrière **réelle dans le service**, re-doublée par la visibilité de l'écran (`__DEV__` + compte de test). Fabriquer des données de santé dans un vrai dossier patient serait une faute RGPD/clinique. |
| **Purge intégrale** | Tous les `local_id` sont préfixés `demo-`. La purge ne cible que ce préfixe → aucune donnée réelle (jamais préfixée) ne peut être supprimée. |
| **Écriture via `syncHelpers`** | Le générateur passe par le service réel du module (`saveSleepEntry` → `syncUpsert`), jamais `dbSave` seul. La purge passe par `deleteSleepEntry` (→ `syncDelete`). |
| **MDR 2017/745** | Le générateur ne fabrique que des **données brutes** (heures, comptages, ressentis 1 à 5). **Aucun label ni score interprétatif** n'est ajouté. L'app affiche, elle ne conclut pas. |

## Où c'est dans le code

```
apps/mobile/src/services/demo/
  types.ts                     ← DEMO_PREFIX, TEST_ACCOUNT_EMAILS, isTestAccount,
                                  contrat DemoGenerator, DemoContext, DemoResult
  demoDataService.ts           ← registre { sleep_diary: … }, generateDemoForModule,
                                  purgeAllDemo (garde compte de test appliquée ici)
  sleepDiaryDemoGenerator.ts   ← générateur de référence (buildSleepDemoEntries pur)
apps/mobile/src/screens/
  DemoDataScreen.tsx           ← écran développeur caché (génération / purge)
```

Accès : **Profil → Réglages → section « Développeur » → « Données de démo »**. La
section n'apparaît qu'en build dev (`__DEV__`) **et** sur un compte de test.

## Le contrat « un générateur par module »

```ts
export interface DemoGenerator {
  readonly module: ModuleType
  readonly generate: () => Promise<number>       // fabrique ~2 mois, retourne le nb créé
  readonly listEntryIds: () => Promise<string[]> // tous les ids du module (démo ET réels)
  readonly deleteEntry: (id: string) => Promise<void> // supprime une entrée (service réel)
}
```

Un module rejoint le registre `GENERATORS` de `demoDataService.ts` le jour où son
générateur est écrit.

> **L'invariant de purge (`demo-`) vit dans l'infra, pas dans le générateur.**
> `demoDataService.purgeAllDemo` liste les ids via `listEntryIds`, **filtre sur le
> préfixe `demo-`** (une seule fois, au centre), puis appelle `deleteEntry` sur chaque
> id démo. Un générateur ne code donc jamais la règle de purge : il ne peut pas se
> tromper et supprimer une donnée réelle. Côté écriture, le préfixe est imposé par le
> helper `demoLocalId(suffix)`.

### Écrire un nouveau générateur (checklist)

1. `apps/mobile/src/services/demo/<module>DemoGenerator.ts` :
   - une **fonction pure** `build<Module>DemoEntries(today)` qui fabrique des entrées
     réalistes (pattern **non uniforme**, propre au module — pas du bruit) ;
   - **dates locales** via `@kaer/shared` (`shiftDate`, `todayIso`) — **jamais**
     `toISOString().slice(0, 10)` (décalage de fuseau) ;
   - `local_id` construit avec **`demoLocalId(suffix)`** (impose le préfixe `demo-`) ;
   - `generate()` écrit via le **service réel** du module (→ `syncUpsert`) ;
     `listEntryIds()` renvoie tous les ids du module ; `deleteEntry(id)` supprime via
     le **service réel** (→ `syncDelete`).
2. Enregistrer le générateur dans `GENERATORS` (`demoDataService.ts`).
3. Tests : `build…` pur (longueur, dates locales, valeurs bornées, déterminisme) +
   `generate`/`listEntryIds`/`deleteEntry` (mock du service réel).
4. **MDR** : que des données brutes, aucun label/score interprétatif.

## Patterns réalistes — exemple `sleep_diary`

`buildSleepDemoEntries` fabrique 60 nuits **déterministes** (PRNG seedé par nuit, pour
des tests stables) et **non uniformes** : nuits plus courtes en semaine, récupération
le week-end, insomnies ponctuelles (endormissement long, réveils multiples, ressentis
plus bas, aide au sommeil occasionnelle), siestes de week-end, légère amélioration au
fil des semaines. Les valeurs restent des **saisies brutes** que le patient aurait pu
entrer lui-même.

## Follow-up (hors périmètre de la PR initiale)

- **Générateur `behavioral_activation`** : à écrire **après le merge** de
  `refonte/activation-comportementale` (le payload `activity_record` y évolue). Il
  remplacera les 32 entrées serveur insérées manuellement sur le compte de test.
- **Purge des entrées serveur pré-existantes** : les `patient_entries` du compte
  `teil.patient@gmail.com` où `local_id like 'demo-ba-%'` (projet Supabase) seront
  purgées en une requête une fois le générateur AC en place.
