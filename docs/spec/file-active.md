# File active — Tour de contrôle praticien

> **Statut : spec de conception (à valider).** Ce document décrit le *quoi* et le *pourquoi*.
> Aucune ligne de code n'est écrite tant qu'il n'est pas relu et approuvé.
> Public : praticien novice en informatique — le document évite le jargon.

## 1. En une phrase

Une **tour de contrôle de la file active** : dès la connexion, le praticien voit
*« ce que je dois faire aujourd'hui, dans quel ordre, et ce que je risque d'oublier »*.
Ce n'est pas un tableur amélioré — c'est un filet de sécurité qui vide la charge mentale.

## 2. Décisions cadrées (validées avec l'utilisateur)

| Décision | Choix retenu |
|---|---|
| **Périmètre** | Dossiers **libres** : n'importe quel patient peut être suivi, même s'il n'utilise pas l'app. Lien **optionnel** vers une fiche patient de l'app quand elle existe. |
| **Placement** | La page devient le **nouvel accueil** du web praticien (vue « Aujourd'hui » par défaut). L'accès aux fiches patients reste à un clic. |
| **Périmètre v1** | On construit **un seul moteur** (données + matrice). La vue « Aujourd'hui » est une *vue intelligente* de ce moteur, livrée en priorité car c'est le bénéfice quotidien. |

## 3. Principe directeur — l'adoption avant l'esthétique

> Un outil de suivi ne marche que si **noter coûte moins cher que retenir**.

- La **capture** d'une action doit être quasi gratuite (une ligne, une date, entrée — 10 s en fin de consultation).
- Le **rangement** (priorité, étiquettes, statut) peut venir après, au calme.
- Ne **jamais** bloquer la saisie derrière un formulaire complet.

Si on rate ce point, le reste ne sert à rien.

## 4. Les trois vues (même donnée, trois angles)

```
┌─────────────────────────────────────────────────────────────────┐
│  [ Aujourd'hui ]   [ Ma file active ]   [ Vue d'ensemble ]        │  ← onglets
├─────────────────────────────────────────────────────────────────┤
```

### ① Aujourd'hui (vue par défaut — la tour de contrôle)

Liste verticale, déjà triée, de ce qui est actionnable aujourd'hui, **groupée par bucket** :

```
⏱ EN RETARD (2)
  ▮ HB  Bernard H.   Renouvellement                  en retard 2j   🟥
  ▮ ...
📌 AUJOURD'HUI (1)
  ▮ ML  Martin L.    Appel partenaire                échéance ce jour 🟧
⏳ RELANCES À FAIRE (1)
  ▮ ...  en attente du bilan psycho — relancer aujourd'hui
🔔 RÉVEILS (0)
☀️ Si tout est traité : « Tout est sous contrôle aujourd'hui 👌 »
```

Chaque ligne affiche **pourquoi** elle est là (« en retard », « échéance proche »).
Au survol : **✓ Fait · ⏰ Reporter (+1j / +1sem / date) · ✎ Note**.

### ② Ma file active (la matrice — pour le pilotage)

Le tableau complet, triable et filtrable. C'est ici qu'on saisit et qu'on a la vue large.
Saisie **au clic dans la cellule** (édition inline, enregistrement automatique).
**Une ligne par patient** : la cellule « Actions » montre l'action la plus urgente + un badge
« +N » ; un clic **déplie** un panneau à 4 sections — **Patient de l'app** (statut de liaison,
lecture seule), **Actions** (cocher / ajouter / supprimer, chacune avec date + heure optionnelle),
**En attente de retour** (étiquette + date de relance optionnelle), **Observations** (la plus
récente + historique daté). Les **« Soins en cours »** et le résumé **« En attente de retour »**
s'affichent dans la ligne ; l'**⭐ Important** épingle le patient en haut.

**Édition du nom sécurisée.** Le nom du patient s'affiche en **lecture seule** ; l'édition demande
un clic explicite sur le **crayon**, puis une **validation** (Entrée / ✓) — pas de modification
accidentelle (composant `EditableName`). Les autres champs (actions, attentes, soins, observations)
restent éditables au clic, car ce sont des contenus à faible risque.

**Liaison patient (app) — automatique.** Au chargement, `syncCaseloadWithPatients` (idempotent) :
- **patient inscrit** (`practitioner_patients`) sans dossier lié → **dossier lié** créé ;
- **invitation en attente** (`invitations`, non acceptée) sans dossier → **dossier libre** créé, marqué
  `invited_email` (statut « Invité — en attente d'inscription ») ;
- patient qui **s'inscrit** alors qu'un dossier libre existait à son email → ce dossier est **converti**
  en dossier lié (`patient_id` posé, `invited_email` effacé) — **pas de doublon**.

Déduplication sur **tous statuts** (un dossier archivé ne réapparaît pas). Une fois lié, les **modules
débloqués** du patient (`patient_modules`, via `fetchPatientsWithModules`) s'affichent **automatiquement**
en chips lecture seule dans « Soins en cours », à côté des étiquettes manuelles (coexistence ; les modules
ne sont jamais édités ici). Les dossiers saisis à la main pour des patients hors app restent **libres**.

```
┌─┬───────────────┬──────────────────────┬───────────────┬──────────┐
│▮│ HB Bernard H. │ Renouvellement       │ ⏱ EN RETARD 2j │ 🟥 ⋯     │
│ │ Actif · Urgent│ HOP · psychothérapie │  (04/06)       │          │
└─┴───────────────┴──────────────────────┴───────────────┴──────────┘
  ↑ bord = priorité   ↑ étiquettes pastel    ↑ délai relatif  ↑ pastille
```

Filtres en **chips** au-dessus : `Important` `En retard` `En attente`.
Recherche par nom. En-tête figé au scroll. Lignes compactes.

**Ordre des colonnes** : Patient · Statut · ⭐ (étoile, colonne étroite sans titre) · Soins en cours ·
Actions · En attente de retour · Délais. Soins et Actions sont voisins, comme Actions et En attente —
regroupement logique. Dégradé horizontal très léger (déclinaison du teal Kaer) pour délimiter les colonnes.

**Archivage / désarchivage** : le `select` Statut d'une ligne permet d'archiver (→ `archived`, masqué du
filtre « Actifs et en veille »). Le filtre Statut **« Archivés »** les retrouve ; il suffit de repasser le
`select` sur *Actif* ou *En veille* pour **désarchiver** (`archived_at` remis à `null`). `fetchCaseload`
est appelé avec `includeArchived: true` ; le filtrage actif/archivé est client-side (`selectCaseloadRows`).

### ③ Vue d'ensemble (les compteurs « en un coup d'œil »)

Cartes KPI **cliquables** (chaque carte filtre la vue ②) :
Dossiers actifs · Urgences du jour · À venir ≤ 15 j · En attente d'un tiers · En veille à relancer.

## 5. Modèle de données

### Table `caseload_entries` (les dossiers — le CONTEXTE)

```sql
caseload_entries (
  id              uuid PK,
  practitioner_id uuid FK practitioners,        -- propriétaire
  patient_id      uuid FK patients NULL,         -- lien app OPTIONNEL
  display_name    text,                          -- nom OU initiales saisis librement
  status          text CHECK (active|paused|archived) DEFAULT 'active',
  is_important    boolean DEFAULT false,         -- ⭐ patient épinglé en haut (MANUEL)
  wake_date       date NULL,                     -- « revoir le » (réveil d'un dossier en veille)
  invited_email   text NULL,                     -- dossier libre issu d'une invitation en attente (conversion auto à l'inscription)
  care_pathways   text[] DEFAULT '{}',           -- « Soins en cours » : étiquettes HOP, psychothérapie, ETP…
  last_reviewed_at date NULL,                     -- « Revu le » — MANUEL (dernier contact réel)
  updated_at      timestamptz,                    -- « Modifié le » — AUTO (trigger)
  created_at      timestamptz,
  archived_at     timestamptz NULL
)
```

### Table `caseload_actions` (les tâches à faire — un dossier → plusieurs)

```sql
caseload_actions (
  id              uuid PK,
  entry_id        uuid FK caseload_entries ON DELETE CASCADE,
  practitioner_id uuid FK practitioners,
  label           text,                          -- la tâche à faire
  due_date        date NULL,                     -- échéance propre à CETTE action (pilote la couleur)
  due_time        time NULL,                     -- heure optionnelle (confort d'affichage, ne déclenche rien)
  is_urgent       boolean DEFAULT false,         -- urgence FORCÉE à la main (ex. signalement) → critique
  is_done         boolean DEFAULT false,         -- coche « fait »
  done_at         timestamptz NULL,
  recurrence_days int NULL,                       -- récurrence de l'action (ex. 90 = tous les 3 mois)
  sort_order      int DEFAULT 0,
  created_at      timestamptz,
  updated_at      timestamptz                     -- AUTO (trigger)
)
```

> Un patient a souvent **plusieurs choses à faire** avec des échéances distinctes.
> L'**alerte du dossier** = celle de son **action ouverte la plus urgente**.
> L'urgence vient **uniquement des dates des actions** ; le drapeau **⭐ Important** (au niveau du
> dossier) épingle simplement le patient en haut, sans niveau ni jugement.

### Table `caseload_waits` (« En attente de retour » — un dossier → plusieurs)

```sql
caseload_waits (
  id              uuid PK,
  entry_id        uuid FK caseload_entries ON DELETE CASCADE,
  practitioner_id uuid FK practitioners,
  label           text,                          -- ce qu'on attend (bilan, retour pro, réponse ASE…)
  relance_date    date NULL,                     -- quand relancer (boomerang → « Aujourd'hui »)
  created_at      timestamptz,
  updated_at      timestamptz                     -- AUTO (trigger)
)
```

> « En attente de retour » remplace « En attente d'un tiers » et devient **multiple** : tout ce
> qu'on attend de l'extérieur avant d'avancer. Chaque attente porte une **date de relance
> optionnelle** ; ce jour-là elle resurgit dans « Aujourd'hui » (« relancer le labo »).

### Table `caseload_notes` (Observations — journal daté, append-only)

Voir plus bas. L'**Observation** d'un dossier est rendue dans le **panneau dépliable** : la note la
plus récente est l'observation actuelle, l'historique daté est accessible en un clic, rien n'est
jamais écrasé.

### Table `caseload_notes` (journal daté, append-only)

```sql
caseload_notes (
  id           uuid PK,
  entry_id     uuid FK caseload_entries ON DELETE CASCADE,
  practitioner_id uuid FK practitioners,
  body         text,
  is_pinned    boolean DEFAULT false,
  created_at   timestamptz
)
```

> **« Dernière note »** = la note la plus récente (ou épinglée) de ce journal.
> Clic = ouvre l'historique complet, daté, jamais écrasé.

### Conventions

- **`updated_at`** est posé automatiquement par un trigger à chaque modification de ligne.
- **`last_reviewed_at`** est saisi à la main — c'est le sens clinique (« je l'ai vu le… »), distinct de la traçabilité technique.
- **`display_name`** : nom complet OU initiales, au choix du praticien (regards par-dessus l'épaule).
- **`care_pathways`** : étiquettes libres en v1 ; un catalogue partagé pourra venir plus tard (règle *config-first*).

## 6. Calcul de l'alerte (dérivé, jamais stocké — MDR-safe)

Fonctions pures (`caseloadLogic.ts`) : `computeActionAlert(action, today)` pour une action,
`computeEntryAlert(actions, today)` pour un dossier (= l'alerte de son **action ouverte la plus urgente**).
Résultat : `'critical' | 'upcoming' | 'ok'`.
**Aucune valeur n'est stockée** : tout se recalcule à l'affichage à partir de dates que *le praticien a saisies*.

> Colonne affichée **« Délais »** (libellé UI). La feature est nommée **« Mes suivis »** côté praticien
> (route `/file-active`, tables `caseload_*` inchangées).

| Niveau (`AlertLevel`) | Pastille | Condition (administrative, sur les dates) |
|---|---|---|
| `critical` | 🟥 **Urgent** | `due_date` à **moins de 3 jours** (`≤ 2 j` : en retard, aujourd'hui, demain, après-demain) OU **action marquée urgente** (`is_urgent`, forçage manuel) |
| `upcoming` | 🟧 À venir | `due_date` dans **3 à 7 jours** |
| `ok` | 🟩 OK | sinon (`> 7 j` ou aucune échéance) |

> Seuils dans `caseloadLogic.ts` : `URGENT_WITHIN_DAYS = 2`, `UPCOMING_WITHIN_DAYS = 7` (réglables).

- **L'urgence vient des dates OU d'un forçage manuel par action** (`is_urgent`) — ex. rédiger un signalement est urgent quelle que soit la date. Aucun niveau de priorité, aucun curseur. Le drapeau ⭐ Important ne change pas l'alerte ; il **épingle** le patient en haut du tri.
- **Jamais la couleur seule** : chaque pastille porte aussi un mot (« Critique ») et une forme — lisible en cas de daltonisme.
- **Pastille auto-explicative** : le **délai** est affiché à côté du libellé (« À venir · 3 j », « Critique · retard 2 j », « Critique · auj. ») — on comprend sans réfléchir. Le délai vient de l'**action la plus urgente** du dossier.

## 7. Tri de la vue « Aujourd'hui »

Pure function `buildTodayList(entries, today)` :

1. Filtrer sur `status = active`.
2. Répartir en buckets : **En retard** → **Aujourd'hui** → **Relances dues** (`relance_date ≤ today`) → **Réveils** (`wake_date ≤ today`).
3. À l'intérieur d'un bucket : trier par `priority` (urgent d'abord) puis par `due_date` croissante.
4. Chaque item porte la **raison** de sa présence (affichée à l'écran).

Tri 100 % mécanique sur des dates saisies par le praticien → transparent et conforme MDR.

## 8. Les boucles intelligentes (anti-oubli)

- **Veille avec réveil** : un dossier `paused` + `wake_date` resurgit tout seul dans « Aujourd'hui » le jour dit. La veille n'est jamais un trou noir.
- **Relance en boomerang** : une entrée `caseload_waits` avec une `relance_date` réapparaît dans « Aujourd'hui » le jour de la relance (« relancer le labo »).
- **Récurrence** : au **✓ Fait** d'une action avec `recurrence_days`, l'action est recréée avec `due_date = aujourd'hui + recurrence_days`. (Ex. renouvellement tous les 90 j.)

## 9. Confiance & sérénité

- **Tout est annulable** : archiver / clôturer / marquer fait → toast `Annuler` (réutilise `useToast()`).
- **Rien ne disparaît en silence** : un retard reste visible et remonte tant qu'il n'est pas traité.
- **Verrou de page** (phase ultérieure) : re-verrouillage par code court après inactivité.

## 10. Architecture technique

> Respecte les règles du projet : **aucun appel Supabase dans un composant**, tout passe par un service ;
> réutilise le **design system** existant (`Card`, `Button`, `StatusBadge`, `Toggle`, tokens CSS) ;
> **zéro texte hardcodé** (i18n `t('clé')`).

| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` | DDL : 2 tables + trigger `updated_at` + RLS |
| `apps/web/src/lib/caseload.types.ts` | Types TypeScript (`CaseloadEntry`, `CaseloadNote`, `AlertLevel`, `TodayItem`) |
| `apps/web/src/services/caseloadService.ts` | CRUD Supabase + fonctions pures `computeAlert`, `buildTodayList` |
| `apps/web/src/services/caseloadService.test.ts` | Tests vitest (alerte, tri, buckets, edge cases) |
| `apps/web/src/components/ui/DataTable/` | Table générique du design system (structure, en-têtes, scroll, dépliage, état vide) — sans métier |
| `apps/web/src/components/features/CaseloadTable/` | La matrice (vue ②) — câble `DataTable` avec colonnes + détail métier (édition inline, filtres, tri) |
| `apps/web/src/components/features/TodayList/` | La vue « Aujourd'hui » (vue ①) — buckets + actions rapides |
| `apps/web/src/components/features/CaseloadOverview/` | Les cartes KPI (vue ③) |
| `apps/web/src/components/features/NoteJournal/` | Historique daté des notes d'un dossier |
| `apps/web/src/pages/HomePage.tsx` | Page d'accueil hôte des 3 onglets |

> Les fonctions `computeAlert` et `buildTodayList` sont **pures** (zéro réseau) — testables isolément
> et exécutées côté client pour l'affichage instantané.

## 11. RLS (sécurité)

| Table | Praticien | Patient |
|---|---|---|
| `caseload_entries` | ALL (ses propres lignes via `auth.uid()`) | **aucun accès** |
| `caseload_actions` | ALL (ses propres lignes) | **aucun accès** |
| `caseload_waits` | ALL (ses propres lignes) | **aucun accès** |
| `caseload_notes` | ALL (ses propres lignes) | **aucun accès** |

> Le patient ne voit **jamais** cet outil — c'est l'espace de travail privé du praticien.
> `practitioner_id` toujours dérivé de `auth.uid()`, jamais du payload client.

## 12. Conformité MDR 2017/745

Module **purement organisationnel** — il gère le travail du praticien, pas l'état clinique du patient.

- L'alerte/couleur est une **fonction de dates saisies à la main** : c'est un agenda, pas un diagnostic.
- **Ligne rouge absolue** : ni l'échéance, ni le drapeau ⭐ Important ne doivent **jamais** être dérivés d'une donnée clinique (score, symptôme). Toujours manuels.
- Le tri affiche sa **raison** : tri mécanique, aucune interprétation de l'état du patient.
- Aucune notification conditionnée par une donnée clinique.

## 13. Plan de construction par étapes (chaque étape est livrable)

| Phase | Contenu | Bénéfice |
|---|---|---|
| **0 ✅** | Schéma SQL (2 tables + trigger + RLS), types, logique pure (`caseloadLogic`) + service + tests | Fondations |
| **1 ✅** | Matrice (vue ②) : lecture, édition inline, filtres, tri, pastilles d'alerte, capture rapide ; route `/file-active` + menu | Remplace l'Excel |
| **2** | Vue « Aujourd'hui » (vue ①) : buckets + ✓ Fait / ⏰ Reporter | Le bénéfice quotidien |
| **3** | Journal de notes daté + accès historique 1 clic | Mémoire des dossiers |
| **4** | Boucles intelligentes : réveil de veille, relance boomerang, récurrence | Anti-oubli structurel |
| **5** | Vue d'ensemble (KPI) + compteur d'urgences dans le menu | Coup d'œil global |
| **6** | Finitions : annulation (toast), initiales, accessibilité daltonisme, confort mobile, verrou | Sérieux & sérénité |

## 14. Hors périmètre v1 (décidé, pour ne pas se disperser)

- Statistiques / graphiques de tendance de la file.
- Partage secrétariat / multi-praticiens (phase SaaS).
- Notifications poussées automatiques (zone grise MDR).
- Export / impression (donnée sensible qui sort de l'app — à cadrer séparément).
