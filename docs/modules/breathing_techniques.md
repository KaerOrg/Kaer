# Module Techniques de Respiration (`breathing_techniques`)

## Objectif clinique

Proposer au patient un guide animé pour 5 techniques de respiration validées, couvrant les indications principales rencontrées par les IPA, psychiatres et psychologues : anxiété, stress, dépression, PTSD, troubles du sommeil.

---

## Techniques implémentées

| Technique | Rythme | Indication principale | Niveau de preuve |
|---|---|---|---|
| Cohérence cardiaque | 5s–5s | Anxiété, stress chronique, dépression | Grade B — Lehrer & Gevirtz (2014) |
| Respiration diaphragmatique | 4s–7s | Base TCC, anxiété, douleur chronique | Grade B — HAS, Conrad et al. (2007) |
| Respiration carrée (Box Breathing) | 4-4-4-4 | Stress aigu, PTSD | Grade C — VA/DoD PTSD Guidelines |
| Technique 4-7-8 | 4s-7s-8s | Endormissement, crise anxieuse | Grade C — accord experts international |
| Pleine conscience respiratoire | 4-1-6-1 | Prévention rechute dépressive, ruminations | Grade A — NICE CG90, MBCT Segal et al. (2002) |

---

## Conformité MDR 2017/745

| Règle | Application |
|---|---|
| Guide à rythme fixe | Le minuteur est prédéfini, non conditionnel à des données patient |
| Pas de biofeedback | Aucun capteur, aucune mesure physiologique réelle |
| Aucune interprétation | L'historique stocke la technique + la durée — aucun label ("vous êtes plus calme") |
| Aucune notification conditionnelle | Les rappels éventuels sont programmés à l'avance par le praticien |

---

## Architecture technique

### Rendu (moteur générique, issue #19)

Le module n'a plus d'écran custom : il passe par le moteur générique via
`preview_kind = 'breathing_pacer'` (`ModuleContentScreen` → `FieldRenderer` →
`BreathingPacerLayout`).

| Composant | Rôle |
|---|---|
| `layouts/BreathingPacer/BreathingPacerLayout` | Liste des 5 techniques (config lue des fields) + historique de sessions ; ouvre le lecteur en modale |
| `layouts/BreathingPacer/BreathingExercisePlayer` | Lecteur animé (modale) : cercle respiratoire, barre de phases, compteurs cycles/durée |
| `layouts/BreathingPacer/{TechniqueCard,BreathCircle,PhaseBar}` | Primitives présentationnelles du layout |

Côté web praticien, `breathing_pacer` rend l'aperçu descriptif (`field_row`) via
`FieldsLayout` : le praticien n'exécute pas l'exercice.

### Stockage

**Table SQLite :** `breathing_sessions`

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant unique |
| `date` | TEXT | YYYY-MM-DD |
| `technique_key` | TEXT | Clé de la technique (ex: `coherence_cardiaque`) |
| `duration_seconds` | INTEGER | Durée effective de la session |
| `created_at` | TEXT | Horodatage ISO 8601 |

### L'activation praticien (W0, web)

L'onglet « Techniques & objectif » de la modale du module porte **le geste clinique** :
quelles techniques le patient voit, laquelle est travaillée en séance, et l'objectif
proposé (en sessions par semaine, jamais en minutes).

> **Où vit cette config, et pourquoi pas dans `breathing_settings`.** T0 a créé la table
> `breathing_settings` avec une policy praticien, mais **rien ne l'alimente** : le mobile
> écrit ses réglages dans `patient_entries` et lit sa config depuis SQLite local. Une
> écriture praticien dans cette table serait donc invisible côté patient.
>
> L'activation passe par **`patient_modules.config`** (`enabled_techniques`,
> `primary_technique`, `weekly_goal_sessions`), le canal que le mobile lit déjà, comme
> pour `cognitive_saturation` (#201). `breathing_settings` reste les préférences
> d'appareil du patient (durées, sons, rappel).
>
> **Dette ouverte** : personne ne projette `patient_entries` vers `breathing_sessions` /
> `breathing_settings`. À câbler, ou à assumer explicitement.

| Fichier | Rôle |
|---|---|
| `packages/shared/services/breathingTechniques.ts` | Lecture des techniques déclarées en base, partagée web ≡ mobile |
| `services/moduleAssignmentService` | `fetchBreathingPractitionerConfig`, `updateBreathingPractitionerConfig`, lecteur pur |
| `hooks/queries/moduleQueries.breathingConfig` | Factory de lecture (clé canonique, invalidée à l'enregistrement) |
| `PatientPage/hooks/useBreathingConfigEditor` | Brouillon local, enregistrement explicite |
| `PatientPage/tabs/BreathingConfigPanel` + `BreathingTechniqueRow` + `BreathingGoalField` | L'onglet |

**Invariants tenus par le code** : la technique de séance reste toujours parmi les
activées (désactiver la principale la démet) ; l'objectif est borné à 1-14 comme le
`check` en base ; le formulaire n'est pas rendu tant que la config n'est pas lue, sans
quoi enregistrer écraserait l'activation réelle par une activation vide.

**Repli au déverrouillage** : la cohérence cardiaque est activée d'office, pour qu'un
patient n'ouvre jamais un module vide.

### L'onglet « Données » (W1, web)

Vue praticien complète : barre de contrôle (période 30 jours / 3 mois / 6 mois / Tout,
filtre par technique, export CSV), quatre tuiles de synthèse, ressentis par technique,
moment de pratique, et journal paginé.

**D'où viennent les sessions.** De `patient_entries` filtré sur
`entry_kind = 'breathing_session'`, comme les vingt autres modules, **pas** de la table
`breathing_sessions` que personne n'alimente. `client_created_at` porte l'instant métier
(le mobile y recopie `started_at`), ce qui place une session au bon jour même
enregistrée plus tard.

Les agrégations vivent dans `packages/shared/services/breathingReport.ts`, pures et
testées : filtres de période, synthèse, comptes de ressenti, moments de la journée,
lignes CSV.

> **MDR 2017/745, à relire avant toute évolution de cet écran.** Tout ce qui s'affiche
> est un **compte brut** ou une durée. Sont interdits : moyenne pondérée du ressenti,
> courbe de tendance, corrélation technique × ressenti, et tout texte qui désignerait
> une technique comme efficace. L'ordre des segments d'une barre est fixe, jamais trié
> par effectif, pour qu'aucune lecture de classement ne s'installe.
>
> **Les trois ressentis portent chacun leur couleur ici**, ce que le ticket autorise
> explicitement (« la couleur code l'identité d'un ressenti nommé »). C'est l'inverse de
> l'écran de clôture mobile (M4), où les trois **choix** partagent une teinte unique :
> proposer un « bon » et un « mauvais » bouton au moment de répondre orienterait la
> réponse. Ici, la saisie est déjà faite.

**Le rythme hebdomadaire** rapporte les jours de pratique à une semaine sur la fenêtre
observée. Sur « Tout », la fenêtre est l'écart réel entre la première et la dernière
session, sans quoi une fenêtre arbitraire fausserait le chiffre. Une fenêtre plus courte
qu'une semaine est ramenée à une semaine, pour ne pas afficher « 3,5 jours par semaine »
sur deux jours d'observation.

**L'export CSV** sort les lignes brutes, sans colonne calculée interprétative, avec un
BOM UTF-8 pour qu'Excel n'affiche pas « CohÃ©rence » à l'ouverture.

### L'onglet Notifications, en lecture seule (W3, web)

Le rappel de pratique est **créé et réglé par le patient** dans son app (M1/M5). L'onglet
praticien le lit, il ne l'édite pas : deux endroits qui pilotent la même chose, c'est un
endroit de trop, et l'ancien réglage praticien produisait des rappels que le patient
n'avait pas demandés.

Ce n'est pas retirer au praticien son influence sur la pratique : elle passe par
l'**objectif proposé** (W0), qui est le bon levier parce qu'il se discute en séance.

La lecture vient de `patient_entries` (`entry_kind = 'breathing_setting'`, entrée unique
remplacée à chaque changement, donc on lit la plus récente). Le même appel légende la
carte « Moment de pratique » de l'onglet Données : une seule clé de cache, un seul fetch.

> **Un rappel n'est affiché « actif » que s'il déclenche réellement quelque chose** :
> bascule activée **et** heure posée **et** au moins un jour coché. Afficher « actif »
> une bascule sans heure mentirait au praticien sur ce que vit son patient.

Le changement est propre à `breathing_techniques` : les autres modules gardent leur
éditeur de routine (`NotificationRoutinePanel`).

### L'onglet Sources : niveau de preuve par technique (W4, web)

Le panneau générique liste les sources d'un module groupées par niveau de preuve. Pour
la respiration, une table s'ajoute **en tête** : une ligne par technique graduée, avec
son grade et ses références clés. C'est ce que le praticien lit pour décider quoi
activer en séance ; les revues transversales restent en dessous.

Les grades vivent dans `field_props` (`evidence_grade` sur chaque `bt.tech.*`), les
références en i18n (`<clé>_evidence`) : corriger un grade ou ajouter une technique ne
demande pas de toucher au code. `evidence_scope` précise le périmètre quand le grade ne
vaut que pour une indication (pleine conscience : grade A **sur la rechute dépressive**,
pas au-delà).

Une technique sans grade déclaré est écartée de la table plutôt que d'y figurer avec une
case vide.

> **La teinte du badge distingue un grade établi (A, B) d'un accord d'experts (C).** Elle
> qualifie un **niveau de preuve scientifique**, jamais une donnée patient : la règle MDR
> sur les couleurs de valence ne s'applique pas ici.

> ⚠️ **Les grades sont repris de l'existant et restent à faire valider par le référent
> clinique avant mise en production** (demande explicite du ticket #376). La note sous la
> table le dit à l'écran.

### Configuration des techniques (config-first, issue #69)

La définition des 5 techniques (couleur, durée recommandée, séquence de phases) vit
**en base**, plus dans un tableau TypeScript. Source de vérité : `supabase/seed.sql`.

- **`module_content_fields`** : 1 field `breathing_technique` par technique
  (`bt.tech.<key>`), chaque phase = un field enfant `breathing_phase`
  (`parent_field_id`), ordonnée par `sort_order`.
- **`field_props`** (atomiques) :
  - technique → `technique_key`, `color` (hex), `recommended_duration_min`
  - phase → `phase_type` (`inhale`|`hold_in`|`exhale`|`hold_out`), `phase_seconds`
- **Lecture mobile** : le layout `breathing_pacer` reçoit déjà les fields et les
  convertit via `breathingService.techniquesFromFields()` (helper pur) ;
  `breathingService.fetchBreathingTechniques()` réutilise ce même helper après
  `fetchModuleFields('breathing_techniques')` (cache mémoire).

Les libellés (nom, sous-titre, description, niveau de preuve, label de phase) restent
en i18n bundlé : `modules.breathing_techniques.<key>_name` / `_subtitle` /
`_description` / `_evidence` et `modules.breathing_techniques.phase_<type>`, déclinés
`fr`/`en` en `common` et `teen`. Les sources cliniques et la note MDR sont conservées
en commentaire d'en-tête du bloc seed.

### Signal d'observance Supabase

À chaque session terminée :
```json
{ "event_type": "SAVE_BREATHING_SESSION", "metadata": {} }
```

### Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/seed.sql` | Config des techniques (`breathing_technique`/`breathing_phase` + `field_props`) |
| `apps/mobile/src/services/breathingService.ts` | Lecture config (`techniquesFromFields` / `fetchBreathingTechniques`) + sessions + sync |
| `apps/mobile/src/lib/database.ts` | Table + CRUD `breathing_sessions` |
| `apps/mobile/src/components/features/ModuleRenderer/layouts/BreathingPacer/` | Layout `breathing_pacer` : liste + lecteur animé + primitives + tests |
| `apps/mobile/src/services/breathingService.test.ts` | Tests service (save, fetch, parsing) |
| `apps/web/src/components/features/ModuleRenderer/FieldRenderer/LayoutDispatcher.tsx` | Aperçu praticien web (`breathing_pacer` → `FieldsLayout`) |

---

## Lancer les tests

```bash
cd apps/mobile
npx jest BreathingPacer
```

---

## Checklist de livraison

- [x] Web : aperçu praticien via `breathing_pacer` → `FieldsLayout` (`field_row`)
- [x] Config-first : 5 techniques en base (`module_content_fields` / `field_props`)
- [x] Mobile : `techniquesFromFields()` convertit les fields en techniques
- [x] Mobile : `BreathingPacerLayout` : liste + historique
- [x] Mobile : `BreathingExercisePlayer` : guide animé (modale) avec cercle, phases, compteurs
- [x] Mobile : table SQLite `breathing_sessions` + `initDatabase`
- [x] Mobile : rendu via le moteur générique (`preview_kind = 'breathing_pacer'`), aucun écran custom
- [x] i18n : clés `fr`/`en` en `common` + `teen`
- [x] Tests : service + layout + lecteur
- [x] Conformité MDR : rythme fixe, pas de biofeedback, aucune interprétation
