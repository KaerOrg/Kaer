# Reprise de chantier — Epic « Mon plan de sécurité »

> **À qui s'adresse ce document** : à qui reprend l'Epic [#315](https://github.com/KaerOrg/Kaer/issues/315) sans avoir suivi la session du 2026-07-31. Il dit ce qui est fait, ce qui reste, dans quel ordre, et surtout **ce qui a déjà été tranché** pour éviter de rouvrir des débats clos.
>
> **Date d'arrêt** : 2026-07-31. **Dernier état** : PR [#332](https://github.com/KaerOrg/Kaer/pull/332) ouverte, non mergée, en attente de relecture.

---

## 1. Où en est-on, en une phrase

Les **29 tickets** de l'Epic sont écrits et en ligne. **Un seul est implémenté** (P-5, le socle de la Séquence), livré en PR #332 et non mergé. Tout le reste est à faire.

---

## 2. Carte des tickets

**Epic chapeau** : [#315](https://github.com/KaerOrg/Kaer/issues/315) — porte les décisions verrouillées, les invariants MDR, l'ordre de livraison et les questions ouvertes.

### Lot mobile (patient)

| Ticket | Sujet | État |
|---|---|---|
| [#316](https://github.com/KaerOrg/Kaer/issues/316) | P-1 · Trois vues, deux portes | À faire · **bloqué par #320** |
| [#317](https://github.com/KaerOrg/Kaer/issues/317) | P-2 · Renommage et textes | À faire |
| [#318](https://github.com/KaerOrg/Kaer/issues/318) | P-3 · Composant ressources d'urgence (3114 / 15 / 114) | À faire |
| [#319](https://github.com/KaerOrg/Kaer/issues/319) | P-4 · Consultation en lecture seule réelle | À faire |
| [#301](https://github.com/KaerOrg/Kaer/issues/301) | P-5 · Socle `safety_sequence` | ✅ **Livré, PR #332 non mergée** |
| [#302](https://github.com/KaerOrg/Kaer/issues/302) | P-6 · Écran d'arrivée | À faire · **question ouverte n° 3** |
| [#303](https://github.com/KaerOrg/Kaer/issues/303) | P-7 · Écrans d'étape 1 à 6 | À faire |
| [#304](https://github.com/KaerOrg/Kaer/issues/304) | P-8 · Composant contact | À faire |
| [#305](https://github.com/KaerOrg/Kaer/issues/305) | P-9 · Écran d'étape 6 | À faire |
| [#306](https://github.com/KaerOrg/Kaer/issues/306) | P-10 · Écran des ressources | À faire |
| [#307](https://github.com/KaerOrg/Kaer/issues/307) | P-11 · Écran de clôture | À faire |
| [#308](https://github.com/KaerOrg/Kaer/issues/308) | P-12 · Conditions d'exécution (veille, hors ligne, reprise) | À faire |
| [#309](https://github.com/KaerOrg/Kaer/issues/309) | P-13 · Composant étape 6 en édition | À faire |
| [#310](https://github.com/KaerOrg/Kaer/issues/310) | P-14 · Champs `kind` / `role` / `note` | À faire · **à réécrire, voir § 5** |
| [#311](https://github.com/KaerOrg/Kaer/issues/311) | P-15 · Suppressions et libellés | À faire |
| [#312](https://github.com/KaerOrg/Kaer/issues/312) | P-16 · Accessibilité AA et tokens | À faire |
| [#313](https://github.com/KaerOrg/Kaer/issues/313) | P-17 · Bugs relevés au passage | À faire · sans captures (choix assumé) |

### Lot web (praticien)

| Ticket | Sujet | État |
|---|---|---|
| [#320](https://github.com/KaerOrg/Kaer/issues/320) | PW-1 · Table `safety_plan_items` + RLS | À faire · **bloque tout le lot web ET #316** |
| [#321](https://github.com/KaerOrg/Kaer/issues/321) | PW-2 · Onglet « Le plan », l'éditeur | À faire |
| [#322](https://github.com/KaerOrg/Kaer/issues/322) | PW-3 · Trois champs dans l'éditeur | À faire |
| [#323](https://github.com/KaerOrg/Kaer/issues/323) | PW-4 · Étape 6 côté praticien | À faire |
| [#324](https://github.com/KaerOrg/Kaer/issues/324) | PW-5 · Date de revue | À faire |
| [#325](https://github.com/KaerOrg/Kaer/issues/325) | PW-6 · Vue patient, rail des 13 écrans | À faire |
| [#326](https://github.com/KaerOrg/Kaer/issues/326) | PW-7 · Parité du composant ressources | À faire |
| [#327](https://github.com/KaerOrg/Kaer/issues/327) | PW-8 · Onglet Données | À faire |
| [#328](https://github.com/KaerOrg/Kaer/issues/328) | PW-9 · Section Évolution clinique | À faire |
| [#329](https://github.com/KaerOrg/Kaer/issues/329) | PW-10 · Renommage, carte, sources | À faire · **question ouverte n° 4** |
| [#330](https://github.com/KaerOrg/Kaer/issues/330) | PW-11 · Onglets et disponibilité | À faire · **question ouverte n° 5** |
| [#331](https://github.com/KaerOrg/Kaer/issues/331) | PW-12 · États vides et phrase à supprimer | À faire |

> ⚠️ **Les numéros ne se suivent pas.** P-5 à P-17 sont en #301-#313, P-1 à P-4 en #316-#319. C'est la cicatrice d'une première création partielle qui avait échoué sur un problème d'encodage. Sans conséquence fonctionnelle, mais déroutant à la lecture de la liste des issues.

---

## 3. Ce qui est livré : PR #332 (P-5)

**Branche** : `refonte/safety-sequence-socle` · **Base** : `main` · **3 commits**.

### Contenu

| Fichier | Rôle |
|---|---|
| `packages/shared/src/services/safetySequence.ts` | Logique pure de la machine à états, partagée par les deux apps |
| `packages/shared/src/services/safetySequence.test.ts` | 27 cas |
| `apps/mobile/.../layouts/SafetySequence/` | Layout patient (+ styles, index, 14 cas de test) |
| `apps/web/.../layouts/SafetySequenceLayout/` | Aperçu praticien en storyboard (+ 6 cas de test) |
| `packages/shared/src/index.ts` | `safety_sequence` ajouté à `PREVIEW_KINDS`, exports de la logique |
| `packages/shared/src/theme.ts` | Palier `fontSize.display = 32` ajouté |
| Les deux `LayoutDispatcher.tsx` | Câblage du nouveau `preview_kind` |
| 6 fichiers de locales | Clés `sequence_*` (fr/en common + fr/en teen mobile, fr/en web) |
| `.github/workflows/ci.yml` | **Nouveau job `test-shared`** |
| `docs/modules/crisis_plan.md` | Créé et indexé dans `docs/README.md` |
| `docs/module-engine.md` | Entrée `safety_sequence` |

### État de la CI au moment de l'arrêt

Les six jobs sont verts en local, sur l'état mergé avec `main` (merge propre, `main` n'avait pas bougé) : `typecheck-web`, `lint-web` (0 erreur), `test-web` (1259), `typecheck-mobile`, `test-mobile` (1298), `test-shared` (81).

### Review

Rapport complet posté sur la PR : [commentaire](https://github.com/KaerOrg/Kaer/pull/332#issuecomment-5144108120). Archivé dans `.claude/pr-reviews/2026-07-31_refonte-safety-sequence-socle.md`.

Trois violations trouvées sur ce code et corrigées avant l'ouverture de la PR (erreur avalée, tailles de police en dur, commentaire d'invariant MDR inexact). Deux cas nouveaux ajoutés à `.claude/rules/lessons.md`.

### Ce que la PR ne fait PAS

Les écrans sont **volontairement minimaux** : l'accueil, les ressources et la clôture ne rendent qu'un titre. C'est le périmètre du socle. P-6, P-7, P-9, P-10 et P-11 les construisent. Les libellés `sequence_home_title`, `sequence_resources_title` et `sequence_closing_title` **seront réécrits** par ces tickets ; ils reprennent les formulations des maquettes, ce ne sont pas des inventions.

---

## 4. Ordre de reprise

L'ordre vient des deux `PROMPT` du dossier de design, et il est **contraint**, pas indicatif.

### Lot 1 — la Séquence, seule

**#301 ✅** → **#303** (P-7, écrans d'étape) → **#302** (P-6, arrivée) → **#304** (P-8, contacts) → **#305** (P-9, étape 6) → **#306** (P-10, ressources) → **#307** (P-11, clôture) → **#308** (P-12, veille et hors ligne).

**#318** (P-3, composant ressources) est une dépendance de #302, #306 et #307 : le faire dans ce lot, au moment où le besoin arrive.

S'arrêter là et montrer. C'est l'écran qui n'existe pas du tout, c'est le livrable qui a le plus de valeur, et c'est celui où une itération rapide sert le plus.

### Lot 2 — architecture et lecture seule

**#316** (P-1) → **#319** (P-4) → **#317** (P-2).

⚠️ **#316 ne doit pas être livré avant que la Séquence existe ET avant #320.** Il retire `safety_plan` de `SETUP_FALLBACK` et route le bandeau vers la Séquence. Livré trop tôt, il envoie le patient vers un écran inexistant ; livré avant #320, il laisse le plan constructible par le seul patient, ce qui vide de son sens le geste même de retirer la bascule.

### Lot 3 — données et étape 6

**#320** (PW-1) **seul, puis s'arrêter et faire relire.** Rien d'autre ne peut être juste avant. Puis **#310** (P-14, réécrit, voir § 5) → **#309** (P-13) → **#323** (PW-4).

### Lot 4 — le reste du web

**#321 + #322 + #324** (l'éditeur devient utilisable, et #316 se débloque) → **#325 + #326** → **#327 + #328 + #329 + #330 + #331**.

### Lot 5 — finitions

**#311** (P-15) → **#312** (P-16) → **#313** (P-17).

---

## 5. Pièges trouvés en chemin, à ne pas re-découvrir

### 5.1 · #310 (P-14) et #320 (PW-1) se contredisent

**Ni l'un ni l'autre ne le signale.** #310 demande d'ajouter trois clés au `payload` de `syncUpsert` ; #320 demande d'**arrêter** d'enqueuer les items de plan et de supprimer `entry_kind: 'plan_item'`.

Faire #310 avant #320 revient à écrire du code que #320 efface. **#310 est donc à traiter après #320, et sa partie sync est à retirer** : les colonnes `kind` / `role` / `note` seront créées directement par la migration de #320.

### 5.2 · Il n'existe pas de table `plan_items` côté Supabase

Le cadrage initial de #310 demandait « une migration Supabase idempotente + `seed.sql` + RLS ». **Ça n'a pas d'objet** : `plan_items` est une table **SQLite locale** (`apps/mobile/src/lib/database.ts`, `createPlanItemsTable`). Le serveur reçoit les items dans `patient_entries.payload` (jsonb opaque). Le ticket a été réécrit en conséquence.

### 5.3 · `RemoteSyncService` est strictement montant

159 lignes, **aucun** `pull`, aucun `select`. Un item écrit depuis le web n'atteindrait jamais le téléphone. C'est toute la raison d'être de #320, et ça a été vérifié dans le code, pas seulement lu dans le brief.

### 5.4 · `packages/shared` n'était testé par aucun job de CI

Découvert en livrant #301. Ni le vitest web ni le jest mobile ne ramassent ce dossier, et la CI n'appelait pas le script `test:shared` pourtant présent dans le `package.json` racine. **81 tests existants** (`weekDates`, `rhythmogram`, `chronoAnchors`, `columnForm`…) ne s'exécutaient nulle part. Le job `test-shared` a été ajouté dans la PR #332.

### 5.5 · Le `LISEZ-MOI` du dossier de design est en retard sur le canvas

Il liste un bloc « Ce que la Séquence exige côté données » qui **n'existe plus** (son contenu a été fondu dans le bloc 4b), et il omet les écrans **VUE 2 · Consultation** et **VUE 3 · Édition**, qui existent bel et bien dans le canvas et portent leur destination écrite dessus.

→ **Se fier au canvas, pas au `LISEZ-MOI`.** Deux allers-retours ont été perdus là-dessus.

### 5.6 · `SafetyPlanLayout` ne lit plus `lib/database`

Le `PROMPT` web signale cette violation comme restant à corriger. **C'est faux aujourd'hui** : le layout passe par `getPlanItems` de `@services/planItemService`. Corrigé depuis la revue de la phase 2. Ne pas partir en chasse d'un problème inexistant.

### 5.7 · PowerShell 5.1 corrompt les accents

Un `.ps1` sans BOM est décodé en Windows-1252, donc tout littéral accentué est corrompu **dès l'analyse du fichier**. Et `Get-Content -Raw` renvoie une chaîne décorée de propriétés PSObject que `ConvertTo-Json` sérialise à la place du texte.

→ Pour tout appel `gh` avec des accents : passer par `gh api <endpoint> --method POST --input payload.json`, le JSON étant écrit avec `[System.IO.File]::WriteAllText(..., new UTF8Encoding($false))` et lu avec `ReadAllText`. **Ne jamais valider un encodage sur la sortie console**, elle ment dans les deux sens.

---

## 6. Décisions verrouillées : ne pas rouvrir

Elles sont détaillées dans l'Epic #315, résumées ici pour éviter de les re-débattre.

| Sujet | Décision |
|---|---|
| Architecture | Trois vues, deux portes. L'édition est un **état**, jamais une porte |
| Nom du module | « Mon plan de sécurité ». **`module_id` reste `crisis_plan`** (clé de persistance) |
| Bascule vers l'édition sur plan vide | **Supprimée** |
| Boutons d'avancement | **Un seul** : « Autre chose que j'ai prévu ». Pas de « Ça m'aide / Ça ne suffit pas » |
| Persistance de la Séquence | **Aucune.** Zéro écriture, zéro compteur, rien côté praticien |
| Nombre d'écrans d'étape | **Six**, l'étape 6 comprise |
| Composant étape 6 | Maquette **5b** (« un arrangement par carte »). 5a écartée |
| Lien `distress_tolerance` | Visible seulement si le module est déverrouillé. Il **disparaît**, il ne se grise pas |
| Compteur d'usage de la Séquence | **Refusé.** Justification en 4 points dans l'Epic, à garder sous la main |
| Libellés des six étapes | **Formulations Kær**, jamais celles de Stanley-Brown (§ Droit d'auteur) |

---

## 7. Questions ouvertes qui bloquent

| # | Question | Bloque | Statut |
|---|---|---|---|
| 1 | `plan_items` : trois colonnes typées ou un `meta jsonb` ? | #320 | **Tranchée** : trois colonnes. Le schéma SQLite est étroit et suit déjà ce motif |
| 2 | `Linking.openURL('sms:114')` : comportement réel iOS / Android ? Fallback ? Se limite-t-on au SMS alors que le 114 accepte visio et tchat ? | #318, #326 | **Ouverte** · demande un test sur appareil réel |
| 3 | Deep-link « Respirer 1 minute » : que fait l'écran d'arrivée si `breathing_techniques` n'est pas déverrouillé ? | #302 | **Ouverte** · deux options posées dans le ticket |
| 4 | `isConfigured` : le redéfinir ou le retirer de la carte ? | #329 | **Ouverte** · PW-10 propose de le retirer |
| 5 | Scinder `NO_DATA_NO_NOTIF` en `NO_DATA` / `NO_NOTIF` ? Touche **tous** les modules | #330 | **Ouverte** · à valider avant |
| 6 | Les libellés des six étapes attendent-ils une relecture du référent clinique ? | #317 | **Ouverte** · il n'y a pas de référent identifié à ce jour, ce qui pousse vers « poser et itérer » |

**Action hors code, non bloquante** : envoyer la demande d'autorisation Stanley-Brown via le formulaire de suicidesafetyplan.com. Gratuit, courant pour un usage clinique, et ça débloque le verbatim si un clinicien l'exige un jour.

---

## 8. Invariants MDR à tenir dans tous les tickets

- **Aucune trace de la Séquence.** Ni les appuis, ni le nombre d'écrans traversés, ni l'heure d'entrée, ni le fait même de l'avoir lancée. Corollaire assumé : on ne saura pas si elle sert.
- **Sauter une étape vide est licite, lire son contenu ne l'est pas.** Dans le socle livré, l'invariant est porté par la **signature** : `buildDisplayableSteps` reçoit un `ReadonlySet<string>` des sections non vides, jamais les items. **Ne jamais élargir ce paramètre à `PlanItem[]`.**
- **Aucun élément déclenché par une donnée patient.** Les dates de l'étape 6 sont affichées, jamais surveillées.
- **L'interface ne nomme, ne liste, ne suggère et n'illustre jamais un moyen.** Les propositions de l'étape 6 portent sur le **verbe**.
- **Lexique** (Papageno / OMS 2023) : *mourir par suicide*, *tentative de suicide*, *une personne qui pense au suicide*.

Une sortie technique est autorisée et hors périmètre MDR : `reportFailedOperation` (observabilité #96), qui ne transporte aucune donnée patient.

---

## 9. Où sont les maquettes

Projet Claude Design **KAER DESIGN** (`ab89aa21-cc7f-4157-906c-1087555c2642`) :

| Fichier | Contenu |
|---|---|
| `Plan de sécurité - Vue Séquence.dc.html` | Maquettes mobile : rail 4a (9 écrans) + Consultation + Édition + blocs 3b, 4b, 5a, 5b, 5c, 5e |
| `Plan de sécurité - Web praticien.dc.html` | Maquettes web : blocs 1a à 1e |
| `TICKETS - Plan de sécurité.md` | Source des 29 tickets |
| `PROMPT Claude Code - Plan de sécurité.md` | Ordre des lots mobile + 5 questions |
| `PROMPT Claude Code - Plan de sécurité web.md` | Ordre des lots web + 5 questions |
| `LISEZ-MOI - Plan de sécurité.md` | Mapping capture vers ticket · ⚠️ **en retard sur le canvas, cf. § 5.5** |

Les captures sont déjà collées dans les tickets. Manquent volontairement : les captures de bugs de #313.

---

## 10. Comment lancer les vérifications

```bash
cd apps/web    && npx tsc -b --noEmit      # typecheck-web
cd apps/web    && npx eslint .             # lint-web (200 warnings préexistants, 0 erreur)
cd apps/web    && npx vitest run           # test-web
cd apps/mobile && npx tsc --noEmit         # typecheck-mobile
cd apps/mobile && npx jest --passWithNoTests   # test-mobile
npm run test:shared                        # test-shared (nouveau job)
```

Procédure complète de merge : [`.claude/rules/merge-procedure.md`](../../.claude/rules/merge-procedure.md).

---

## 11. Décision qui attend Guillaume

**PR #332 n'est pas mergée.** C'est le socle dont dépendent les sept tickets suivants du lot 1 : une correction de fond sur cette PR se propagerait à tout ce qui serait construit dessus entre-temps.

Deux écarts au ticket y sont assumés et demandent un avis :

1. **La logique pure est dans `packages/shared`** et non à côté du layout mobile comme le demandait #301. Motif : elle est consommée par les deux apps, et la dupliquer rouvrait la porte à une divergence web/mobile (le défaut exact qui a mordu la chronobiologie).
2. **Le job CI `test-shared` a été ajouté**, hors périmètre du ticket, parce que le point 1 aurait sinon sorti 27 tests du filet, dans un dossier qui n'en exécutait déjà aucun.

Le ticket #301 **n'a pas été clos** : la PR porte `Closes #301`, qui le fermera au merge. Le clore avant relecture donnerait une epic qui se coche sans que rien ne soit intégré.
