# Décrocher d'une pensée (`cognitive_saturation`)

> Nom affiché patient : « Décrocher d'une pensée ». Sous-titre praticien : « défusion
> cognitive ». Le module conserve son identifiant historique `cognitive_saturation`
> (catalogue, déblocage, `GRAPHABLE_MODULE_TYPES`) ; seul son modèle de données a été
> refondu. L'ancien design (compteur de répétitions, zone de tap 90 s) est abandonné.

## Référence clinique

**Technique** : défusion cognitive (ACT). Deux exercices :

1. **Répétition de mot** (`word_repetition`, principale) : un mot répété à voix haute
   30 s, à une cadence visuelle de 1 Hz donnée par l'app. Effet de saturation
   sémantique : le mot perd sa charge émotionnelle et devient « juste des sons »
   (Titchener 1916 ; Masuda, Hayes, Sackett & Twohig 2004).
2. **Distanciation par le langage** (`linguistic_distancing`) : trois paliers de
   reformulation (« … » → « J'ai la pensée que … » → « Je remarque que j'ai la pensée
   que … »), sans minuteur, avancement au bouton.

**Principe de mesure** : le patient note, avant et après chaque exercice, son
**inconfort** et sa **conviction** sur deux curseurs 0 à 10 séparés. Jamais un score
unique, jamais un écart calculé.

## Architecture

### Stockage des données

SQLite local — table `defusion_sessions`, synchronisée vers Supabase
(`patient_entries`, `entry_kind = 'defusion_session'`) via `syncUpsert` / `syncDelete`.

| Champ | Type | Description |
|---|---|---|
| `id` | TEXT | UUID |
| `technique` | TEXT | `word_repetition` \| `linguistic_distancing` |
| `word_or_thought` | TEXT | Mot répété ou pensée travaillée (donnée intime, synchronisée côté praticien) |
| `duration_seconds` | INTEGER | Durée effective (répétition de mot ; 0 pour la distanciation) |
| `discomfort_before` | INTEGER NULL | Inconfort 0 à 10 avant l'exercice |
| `discomfort_after` | INTEGER NULL | Inconfort 0 à 10 après l'exercice |
| `belief_before` | INTEGER NULL | Conviction 0 à 10 avant l'exercice |
| `belief_after` | INTEGER NULL | Conviction 0 à 10 après l'exercice |
| `created_at` | TEXT | Horodatage ISO 8601 |

**Nullabilité par paire** : l'étape de mesure est passable (« Passer cette étape »).
Un « Passer » saute une étape **entière**, donc `discomfort_before` et `belief_before`
sont `NULL` ensemble (idem `_after`). Jamais une dimension seule renseignée sans sa
jumelle — invariant garanti côté application (le lecteur modélise une mesure comme un
objet `{ discomfort, belief } | null`).

### Service

`apps/mobile/src/services/defusionService.ts` :

- `fetchDefusionSessions(limit)` — historique local, plus récent d'abord.
- `saveDefusionSession(session)` — SQLite + enqueue `defusion_session`.
- `removeDefusionSession(id)` — suppression locale + enqueue delete.
- `fetchEnabledTechniques(patientId)` — lit `patient_modules.config.enabled_techniques`
  (écrit par le web, epic #201 story 5) ; défaut robuste = les deux techniques.

## Flux patient (mobile)

- **Accueil** : intro courte, carte « Répétition de mot » dominante (seul bouton plein
  « Commencer »), carte « Distanciation » secondaire, 3 dernières séances + accès à
  l'historique. N'affiche que les techniques activées par le praticien.
- **Lecteur** (modale plein écran, pattern `BreathingPacerLayout`) : saisie du mot /
  pensée → mesure avant (2 curseurs vides) → exercice (halo pulsant 1 Hz, 30 s) →
  mesure après → écran de fin (4 chiffres bruts, grille Avant / Après).
- **Historique** : liste chronologique, « Inconfort 8 puis 5 · Conviction 7 puis 6 »
  (jamais de flèche), mot masqué par défaut (chip « ••• Afficher »), remasquage en
  quittant l'écran.

## Conformité MDR 2017/745

- Chiffres bruts, jamais interprétés ; aucun calcul avant / après (écart, %, points).
- Aucune flèche, courbe ou symbole d'amélioration : dans l'historique « 8 puis 5 »,
  jamais « 8 → 5 ».
- Aucun codage couleur selon la valeur : tous les chiffres au même style `colors.text`.
- Aucune comparaison à une norme, une moyenne ou une séance précédente.
- Aucune notification déclenchée par le contenu saisi ; curseurs vides au départ
  (`value = null`, aucune valeur d'ancrage).

## Vues praticien (web)

Déblocage, onglet Données, Évolution, Configuration des techniques et Vue patient :
voir l'epic web #201.

Module type : `cognitive_saturation`
Table : `defusion_sessions` · Service : `defusionService.ts`
