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
| Aucune interprétation | L'historique stocke la technique, la durée et un ressenti nommé : aucun score, aucune moyenne, aucun label calculé |
| Aucune couleur à valence | Les trois ressentis, la barre d'objectif et les pastilles de semaine gardent la même teinte quelle que soit la valeur |
| Aucune notification conditionnelle | Les rappels éventuels sont programmés à l'avance par le praticien |

---

## Architecture technique

### Rendu (moteur générique, issue #19)

Le module n'a plus d'écran custom : il passe par le moteur générique via
`preview_kind = 'breathing_pacer'` (`ModuleContentScreen` → `FieldRenderer` →
`BreathingPacerLayout`).

Depuis la refonte (epic #195, M1), le layout est un **hub** en trois blocs, et non
plus une liste académique des cinq techniques.

| Composant | Rôle |
|---|---|
| `layouts/BreathingPacer/BreathingPacerLayout` | Hub : orchestration, chargement des sessions et de la config, feuilles |
| `.../PrimaryTechniqueCard` + `BreathingPulse` | Carte « Travaillée en séance » et sa pastille animée en boucle |
| `.../WeekCard` + `WeekDots` + `ReminderRow` | Carte « Cette semaine » : pastilles, série, objectif, ligne de rappel |
| `.../TechniqueRow` | Une ligne de la liste « Vos techniques » |
| `.../{GoalSheet,ReminderSheet,TechniqueInfoSheet}` + `DayChip` | Feuilles objectif, rappel, « En savoir plus » |
| `.../PreparationSheet` + `AmbientChip` | Feuille de préparation : durée, vibrations, souffle, ambiance |
| `.../{rhythmLabels,weekDayOrder,formatDuration,preferredDuration}` | Helpers purs du dossier (rythmes, ordre de semaine, durées) |
| `.../BreathingSessionScreen` | Écran de session immersif (modale plein écran) |
| `.../{SessionOrb,SessionProgress,SessionControls}` + `sessionStyles` | Orbe animée, jauge + temps restant, commandes |
| `.../{sessionClock,sessionPhases,sessionAudio}` | Moteur pur de la session (temps, phases, son) |
| `.../SessionSummaryScreen` + `SummaryStat` + `summaryStyles` | Clôture de session et ressenti facultatif |

Côté web praticien, `breathing_pacer` rend l'aperçu descriptif (`field_row`) via
`FieldsLayout` : le praticien n'exécute pas l'exercice.

### Le hub (M1)

Trois blocs, dans cet ordre :

1. **« Travaillée en séance »**, la `primary_technique` : pastille animée, bénéfice en
   une ligne **orienté patient** (jamais une citation), puces de rythme, CTA
   « Démarrer · N min » (`preferred_duration_min`), dernière session en sous-texte.
2. **« Cette semaine »** : sept pastilles L à D, série en cours, `n / objectif`
   sessions, barre de progression, puis la **ligne de rappel** (opt-in).
3. **« Vos techniques »** : les autres techniques **activées par le praticien**.

**Invariant d'activation.** Le patient ne voit que ce que son praticien a activé :
`breathing_settings.enabled_techniques`. Aucune technique verrouillée, aucun teaser.
Tant que l'écran praticien web (W0) n'existe pas, `enabled_techniques` est vide et le
hub retombe sur la technique déclarée en base (`bt.config.default_technique_key` =
`coherence_cardiaque`) : le repli est **en config**, pas dans une constante TypeScript.

**Objectif en sessions par semaine, jamais en minutes** (`weekly_goal_sessions`, 1 à 14,
borné par un `check` en base). Proposé en séance, librement ajustable par le patient.

**Preuves scientifiques** : retirées des cartes, elles vivent derrière « En savoir plus »
(`TechniqueInfoSheet`), repliées par défaut. M6 (#371) enrichira cette feuille.

### Stockage

**Table SQLite :** `breathing_sessions` (enrichie par T0, epic #195)

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant unique |
| `date` | TEXT | YYYY-MM-DD, dérivé de `started_at` (local, non synchronisé) |
| `started_at` | TEXT | Horodatage ISO du début de session (date métier) |
| `technique_key` | TEXT | Clé de la technique (ex: `coherence_cardiaque`) |
| `duration_seconds` | INTEGER | Durée réellement pratiquée |
| `planned_duration_seconds` | INTEGER | Durée choisie avant la session |
| `cycles_completed` | INTEGER | Cycles menés au bout |
| `completed` | INTEGER | 1 = menée au bout, 0 = interrompue |
| `feeling` | TEXT | `calmer` / `same` / `tenser`, ou NULL (facultatif) |
| `created_at` | TEXT | Horodatage ISO 8601 |

**Table SQLite :** `breathing_settings` (une ligne par patient) : techniques activées,
technique de séance, objectif hebdomadaire, rappel (`reminder_enabled` / `_time` /
`_days`), accompagnements de session (`haptics`, `breath_sound`, `ambient_sound`,
`ambient_sound_key`) et `preferred_duration_min`. Détail : [`docs/database.md`](../database.md).

### La préparation de session (M2)

Une feuille de bas d'écran s'intercale entre « Démarrer » (ou le tap sur une technique
de la liste) et la session. Elle donne le temps de s'installer, et laisse régler :

| Réglage | Défaut | Persisté dans |
|---|---|---|
| Durée (2 / 5 / 10 min, lues en config) | `preferred_duration_min` | `preferred_duration_min` |
| Vibrations | ON | `haptics` |
| Souffle guidé | OFF | `breath_sound` |
| Ambiance sonore (+ choix parmi 5) | OFF, `river` | `ambient_sound`, `ambient_sound_key` |

Les durées proposées et la liste des ambiances viennent de `bt.config` (clés indexées
`duration_1..3`, `ambient_sound_1..5`) : les changer ne demande pas de redéploiement.
Une ambiance inconnue de l'énumération `BreathingAmbientSound` est écartée à la lecture
(la colonne en base la refuserait de toute façon).

Les trois accompagnements sont **cumulables**. Le souffle guidé est un enregistrement
de respiration calé sur les phases, **jamais une voix parlée** (aucune voix en v1).

Revenir en arrière (voile, retour Android) ne démarre rien et n'enregistre rien : les
réglages ne sont écrits qu'au « Commencer ».

> **Les fichiers audio n'existent pas encore dans le projet.** Les bascules « Souffle
> guidé » et « Ambiance sonore » sont réglées et persistées de bout en bout, mais aucun
> son n'est joué tant que les assets n'ont pas été fournis. La lecture est câblée dans
> l'écran de session (M3), qui reste silencieux en leur absence.

### L'écran de session (M3)

Plein écran, couleurs sombres **codées en dur** (`sessionStyles.SESSION_COLORS`, gradient
teal profond, status bar claire). C'est un **choix d'écran**, pas le chantier « dark mode »
global : le thème ne bouge nulle part ailleurs, et ces teintes ne rejoignent volontairement
pas les tokens partagés.

**Le moteur est pur, donc testable sans horloge :**

| Fichier | Rôle |
|---|---|
| `sessionClock.ts` | Temps réellement pratiqué, mesuré à l'horloge murale, pauses exclues |
| `sessionPhases.ts` | `cursorAt(phases, elapsed)` : phase courante, décompte, cycles. `isCompleted`, `formatRemaining` |
| `sessionAudio.ts` | Accompagnement sonore (silencieux tant que les assets manquent) |

`cursorAt` sert **les cinq techniques sans cas particulier** : le nombre de phases (2, 3
ou 4) vient de la config, jamais du code.

**L'animation ne saccade pas.** L'orbe est animée par `Animated` avec driver natif, relancée
au changement d'**instance de phase**, jamais au décompte. Le timer de l'écran rafraîchit
seulement l'affichage (200 ms) et lit l'horloge murale : il ne dérive pas et ne pilote
aucune taille. Une rétention tient la taille avec une pulsation subtile.

**Comportements :**
- Vibration à chaque changement de phase si `haptics` (API `Vibration` de React Native).
- Fin automatique à la durée choisie, sortie anticipée par le bouton d'arrêt ou le retour
  Android (`stopRequested`, le layout demande, la session conclut).
- `completed = false` si moins de la moitié de la durée choisie a été pratiquée : la session
  est enregistrée **quand même**, c'est une donnée et pas un échec.
- **Keep-awake** actif pendant la session (`useKeepAwake`), verrou relâché au démontage.
- **Quitter l'app met en pause** : le temps passé en fond n'est jamais compté, et la reprise
  repart exactement où on en était.

**Couches** : l'écran ne persiste rien. Il remonte un `SessionResult` au hub, qui écrit via
`saveBreathingSession` : la feuille ne possède pas son cycle de données.

### La clôture de session (M4)

Écran clair présenté à la fin de la session, automatique ou anticipée : coche dans une
pastille turquoise pâle, « Session terminée » et le nom de la technique, puis trois tuiles
de **comptes bruts** (durée réellement pratiquée, cycles, jours de suite), la carte
« Comment vous sentez-vous ? », un encart de régularité et les actions.

**Le ressenti est facultatif et vaut un mot, pas une mesure.** Trois choix exclusifs
(`calmer` / `same` / `tenser`), stockés bruts dans `breathing_sessions.feeling`, restitués
bruts. Interdits sans exception : toute note chiffrée, tout score, toute moyenne, toute
pondération, toute courbe de tendance ou corrélation avec la technique ou la durée, tout
texte du type « efficace pour vous ».

> **Les trois choix portent la même couleur d'accent.** La palette de l'epic proposait une
> teinte par ressenti (turquoise « plus calme », orange « plus tendu ») : c'est un codage
> de valence sur une donnée clinique, que la règle d'or interdit explicitement, y compris
> statique. Le garde-fou MDR de l'epic, qui l'interdit lui aussi, l'emporte sur sa ligne
> palette.

L'encart de régularité est un **texte fixe** (« La régularité compte plus que la durée… »),
jamais dérivé des données : il ne commente pas la session qui vient d'avoir lieu.

**Ordre d'écriture.** La session est écrite **dès la fin de la session**, avant la clôture,
avec `feeling: null`. Ajouter un ressenti met à jour la **même entrée** (même `id`, donc
upsert via `syncUpsert`), sans en créer une seconde. « Passer » n'écrit donc rien de plus :
la session est déjà enregistrée et aucun refus n'est noté nulle part. Ce choix garantit
qu'une session n'est jamais perdue si l'app est fermée sur l'écran de clôture.

### Les rappels locaux (M5)

Notifications programmées **sur l'appareil**, aux jours et à l'heure choisis par le
patient dans le hub. Rien à voir avec `notification_routines` (rappels serveur posés
par le praticien) : ici tout est local et piloté par `breathing_settings`.

| Fichier | Rôle |
|---|---|
| `lib/breathingReminderPlan.ts` | Pur : `breathing_settings` → occurrences hebdomadaires |
| `services/breathingReminderService.ts` | `syncBreathingReminders`, `cancelBreathingReminders` |

**Opt-in strict.** Rien n'est programmé tant que le patient n'a pas créé de rappel.
`buildReminderPlan` rend `[]` dans tous les cas où il ne doit rien y avoir (bascule
coupée, heure absente ou illisible, aucun jour coché), et l'appelant se contente alors
d'annuler l'existant.

**Jamais de doublon.** `syncBreathingReminders` annule systématiquement avant de
reprogrammer. Ses notifications sont reconnues au marqueur `kind: 'breathing_reminder'`
du payload : celles des autres modules ne sont jamais touchées.

**Conversion des jours.** `reminder_days` est au format `Date.getDay()` (0 = dimanche),
`expo-notifications` attend 1 à 7 (1 = dimanche). La conversion vit dans
`buildReminderPlan`, à un seul endroit.

**Le tap ouvre le hub.** Le payload porte `module_type` et `screen: 'home'` ; le routage
est assuré par `useNotificationNavigation`, déjà en place et générique.

**Permission** demandée seulement au moment où un rappel est réellement voulu, jamais à
l'ouverture du module. Si l'OS refuse, le réglage reste enregistré et un toast le dit.

> **Invariant MDR 2017/745 : le texte du rappel est une CONSTANTE.** Il ne dépend
> d'aucune donnée saisie, d'aucun compte de sessions, d'aucun objectif atteint ou
> manqué. Un rappel n'est jamais déclenché par l'état des données : ni « vous n'avez pas
> pratiqué depuis 3 jours », ni « plus qu'une session pour votre objectif ».
> **L'objectif hebdomadaire ne pilote jamais les rappels.** Le service reçoit le titre et
> le corps déjà traduits, il n'a aucun moyen d'y injecter quoi que ce soit. Verrouillé
> par `src/__tests__/breathingReminderText.guard.test.ts`, qui échoue si une
> interpolation apparaît dans une locale ou si le service se met à composer son message.

### Statistiques de la semaine (partagées web ≡ mobile)

Les comptes affichés par le hub viennent de `packages/shared/src/services/breathingStats.ts` :
`buildWeekPractice`, `sessionsInWeek`, `currentStreak`, `lastSession`. Purs, sans I/O,
sur un contrat structurel minimal (`{ date }`, plus `started_at` pour la dernière
session). La vue praticien web (W1/W2) lira les mêmes fonctions, donc les mêmes chiffres.

**Restitution brute.** La série est un nombre de jours consécutifs, rien d'autre : pas de
félicitation, pas de jugement calculé, pas de couleur qui varierait selon la valeur.

### Configuration des techniques (config-first, issue #69)

La définition des 5 techniques (couleur, durée recommandée, séquence de phases) vit
**en base**, plus dans un tableau TypeScript. Source de vérité : `supabase/seed.sql`.

- **`module_content_fields`** : 1 field `breathing_technique` par technique
  (`bt.tech.<key>`), chaque phase = un field enfant `breathing_phase`
  (`parent_field_id`), ordonnée par `sort_order`.
- **`field_props`** (atomiques) :
  - technique → `technique_key`, `color` (hex), `recommended_duration_min`
  - phase → `phase_type` (`inhale`|`hold_in`|`exhale`|`hold_out`), `phase_seconds`
- **`bt.config`** (field `exercise_config`), lu par `breathingService.breathingConfigFromFields()` :
  - `default_technique_key` : la technique activée par défaut tant que le praticien
    n'a rien activé (repli avant W0)
  - `duration_1..3` : durées proposées par la feuille de préparation (minutes)
  - `ambient_sound_1..5` : ambiances proposées (clés de `ambient_sound_key`)
- **Lecture mobile** : le layout `breathing_pacer` reçoit déjà les fields et les
  convertit via `breathingService.techniquesFromFields()` (helper pur) ;
  `breathingService.fetchBreathingTechniques()` réutilise ce même helper après
  `fetchModuleFields('breathing_techniques')` (cache mémoire).

Les libellés (nom, sous-titre, bénéfice, description, niveau de preuve, label de phase)
restent en i18n bundlé : `modules.breathing_techniques.<key>_name` / `_subtitle` /
`_benefit` / `_description` / `_evidence` et `modules.breathing_techniques.phase_<type>`,
déclinés `fr`/`en` en `common` et `teen`. Le hub ajoute les clés `hub_*`, `goal_*`,
`reminder_*` et `info_*`. Les sources cliniques et la note MDR sont conservées
en commentaire d'en-tête du bloc seed.

### Signal d'observance Supabase

À chaque session terminée :
```json
{ "event_type": "SAVE_BREATHING_SESSION", "metadata": {} }
```

### Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/seed.sql` | Config des techniques + `bt.config` (`default_technique_key`) |
| `apps/mobile/src/services/breathingService.ts` | Config (`techniquesFromFields`, `breathingConfigFromFields`, `resolveActivation`) + sessions + réglages + sync |
| `packages/shared/src/services/breathingStats.ts` | Semaine, série, compteurs (purs, partagés web ≡ mobile) |
| `apps/mobile/src/lib/database.ts` | Tables + CRUD `breathing_sessions` / `breathing_settings` |
| `apps/mobile/src/components/features/ModuleRenderer/layouts/BreathingPacer/` | Layout `breathing_pacer` : hub + feuilles + lecteur animé + tests |
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
- [x] Mobile : `BreathingPacerLayout` : hub en trois blocs (M1, #366)
- [x] Mobile : activation praticien + repli `bt.config` (aucune technique non activée affichée)
- [x] Mobile : objectif en sessions/semaine et ligne de rappel opt-in, écrits dans `breathing_settings`
- [x] Mobile : feuille de préparation (durée, vibrations, souffle, ambiance), réglages mémorisés (M2, #367)
- [x] Mobile : session immersive, orbe animée en continu, keep-awake, pause en arrière-plan (M3, #368)
- [x] Mobile : sessions interrompues enregistrées (`completed = false`)
- [x] Mobile : clôture de session et ressenti facultatif, stocké brut (M4, #369)
- [x] Mobile : rappels locaux opt-in, texte constant, sans doublon (M5, #370)
- [x] Mobile : `BreathingSessionScreen` : session immersive animée en continu (remplace `BreathingExercisePlayer`)
- [x] Mobile : table SQLite `breathing_sessions` + `initDatabase`
- [x] Mobile : rendu via le moteur générique (`preview_kind = 'breathing_pacer'`), aucun écran custom
- [x] i18n : clés `fr`/`en` en `common` + `teen`
- [x] Tests : service + layout + lecteur
- [x] Conformité MDR : rythme fixe, pas de biofeedback, aucune interprétation
