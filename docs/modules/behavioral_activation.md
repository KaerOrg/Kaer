# Module Activation Comportementale (`behavioral_activation`)

## Objectif clinique

Permettre au patient de planifier des activités reliées à ses domaines de vie (quoi + quand, sans aucune évaluation imposée), de les réaliser, puis de noter ce qu'elles lui ont apporté (Plaisir et Accomplissement ressentis) au moment où il les coche. Le praticien lit l'évolution des ressentis dans le temps (levée de l'anhédonie, sentiment d'efficacité) sur son panneau web : le constat se fait en séance, accompagné, jamais par l'application.

Note de conception : la saisie d'une « prédiction » (P/M attendus) a été retirée du parcours patient. L'anhédonie anticipatoire est une cible réelle (Hallford 2019, g=-0,87) mais l'exercice prédire-puis-comparer en autonomie n'a pas de preuve directe (Wu 2016 : les patients déprimés prédisent leur plaisir avec justesse) ; les colonnes `expected_*` restent en base pour un éventuel usage futur en séance.

**Base de preuves :**

- Activation comportementale validée pour la dépression, équivalente à la TCC : Cuijpers et al. 2007 (méta-analyse, g=0,87), Richards et al. 2016 (essai COBRA, Lancet, non-infériorité, n=440), Dimidjian et al. 2006 (ECR, n=241).
- Protocole structurant domaines de vie → valeurs → activités : BATD-R, Lejuez et al. 2011. C'est le fondement de la co-construction praticien-patient de ce module.
- Déclinaison numérique : la planification d'activités figure parmi les éléments les plus efficaces des apps de santé mentale (Kraiss et al. 2026, méta-régression de 169 essais) ; une AC numérique automatisée réduit les symptômes dépressifs (Santopetro et al. 2024, ECR).
- Le mécanisme de prédiction (P/M attendus vs ressentis) s'appuie sur l'anticipation de la récompense comme levier du changement (Huys et al. 2022) et sur la sous-estimation anticipatoire du plaisir chez les patients déprimés.

Sources complètes seedées dans `module_sources` (voir `supabase/seed/sources_seed.sql`, section behavioral_activation) et visibles dans l'onglet Sources de l'aperçu praticien.

Applicable par les IPA, psychiatres et psychologues dans tout contexte de dépression unipolaire, bipolaire ou anxio-dépressive.

---

## Conformité MDR 2017/745

Ce module est un **carnet de bord numérique**. Il n'est pas un dispositif médical.

| Règle | Application |
|---|---|
| Le code affiche, jamais il ne conclut | P/M attendus et ressentis sont des chiffres bruts saisis par le patient, affichés côte à côte sans commentaire |
| Aucun score composite calculé | Pas de total, pas de moyenne interprétée, pas d'écart calculé et qualifié |
| Aucune alerte conditionnelle | Pas de notification déclenchée par une valeur ou une absence d'activité |
| Aucune comparaison à une norme | Pas de référence à un « niveau suffisant d'activité » |
| « Non renseigné » est un état légitime | P/M sont nullables : aucun défaut à 5, aucune valeur fabriquée |

`planned_time` prépare de futurs rappels **d'horaire fixe non conditionnels aux données** (le patient a lui-même posé l'heure). Aucune notification n'est envoyée dans le périmètre actuel.

---

## Fonctionnement (patient, mobile)

Layout `activity_log` (moteur FieldRenderer), 3 modes internes :

### Mode Agenda (défaut)

- **Aujourd'hui** toujours en tête, mis en évidence, même vide (invitation implicite à planifier)
- **À venir** : les jours futurs qui portent des activités, ordre croissant
- Chaque activité : carte avec statut, heure prévue et, une fois réalisée, P/A ressentis bruts

### Mode Historique (second onglet)

Les jours passés, plus récents en premier. Une activité planifiée non réalisée y glisse telle quelle, sans badge « en retard » ni relance (aucune culpabilisation ; les relances conditionnelles aux données sont interdites MDR). La rétrospection longue et l'évolution vivent côté praticien.

### Mode Formulaire : le statut est explicite, on n'évalue jamais avant d'avoir fait

Principe UX : **on ne demande jamais de noter une activité pas encore faite.** Le timing de chaque évaluation est le bon moment vécu.

Segment de statut en tête (`ui/SegmentedControl`) : **« Je la prévois »** / **« Je l'ai déjà faite »**.

**« Je la prévois »** (planification, 3 gestes) :

| Champ | Type | Description |
|---|---|---|
| Nom | Texte libre | Ou sélection d'une activité ci-dessous |
| Mes activités | Chips | Activités co-construites en consultation, proposées en premier ; la sélection affiche la phrase « valeur » du patient |
| Suggestions | Chips groupées par domaine de vie | Seed : 29 suggestions sur 6 domaines |
| Date + heure prévue | Sélecteur + `ui/TimePicker` (optionnel) | `planned_time` |
| Notes | Texte libre | — |

**« Je l'ai déjà faite »** (journalisation après coup) : les 2 sliders **ressentis** s'affichent directement. Pas d'heure prévue.

### Feuille d'évaluation à la complétion (`CompletionSheet`)

Cocher une activité **réalisée** (agenda ou historique) ouvre immédiatement une feuille bas d'écran : **« C'était comment ? »** + P/A ressentis. C'est LE moment de la notation.

- **Enregistrer** : réalisée + ressentis choisis
- **Passer** : réalisée sans noter (« non renseigné » est légitime)
- Refermer (backdrop) : rien ne change, l'activité reste planifiée
- Décocher une activité réalisée reste immédiat (pas de feuille) ; ses ressentis sont remis à zéro (une activité planifiée n'a pas de ressenti)

Partout : aucun défaut de valeur, re-taper le pip sélectionné efface la note.

---

## Fonctionnement (praticien, web)

### Configuration en consultation (`BehavioralActivationCard` + `useBAActivitiesEditor`)

Le praticien définit **avec** le patient des activités personnalisées : libellé + domaine de vie + phrase « pourquoi c'est important » formulée avec les mots du patient (ancrage aux valeurs, BATD-R). Stockage : `patient_modules.config.ba_activities` (même pattern que `medications`). L'app mobile les propose en premier dans le formulaire.

### Suivi dans l'onglet Évolution

L'onglet **Évolution** de la fiche patient intègre une section « Activation comportementale » (même motif que l'agenda du sommeil) : le panneau complet ci-dessous, filtré par le sélecteur de période global (3 mois / 6 mois / 1 an), avec badge « archivé » si le module a été révoqué.

### Panneau de données (`BehavioralActivationPanel`)

Trois étages, tous alimentés par `patient_entries` et datés par `payload.date` (date métier choisie par le patient, jamais l'horodatage de sync) :

1. **Compteurs bruts** : réalisées / non réalisées (planifiées échues) / à venir.
2. **Courbes P et A ressentis** : moyenne journalière des activités réalisées et notées (`dailyFeltMeans`), 2 séries sur un axe 0-10. Lecture clinicienne de l'évolution hédonique (levée de l'anhédonie) et du sentiment d'efficacité : l'agrégation côté soignant est autorisée, aucun seuil ni conclusion automatique.
3. **Grille hebdomadaire** : navigation semaine par semaine, statut, heure prévue, ressentis bruts, notes.

---

## Architecture technique

### Stockage mobile

**Table SQLite `activity_records`** (schéma v2, migration par rebuild depuis v1) :

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant unique |
| `date` | TEXT | YYYY-MM-DD, date métier (plusieurs activités par jour) |
| `label` | TEXT | Nom de l'activité |
| `expected_pleasure` | INTEGER NULL | 0-10 attendu (prédiction), NULL = non renseigné |
| `expected_mastery` | INTEGER NULL | 0-10 attendu |
| `pleasure` | INTEGER NULL | 0-10 ressenti (après réalisation) |
| `mastery` | INTEGER NULL | 0-10 ressenti |
| `done` | INTEGER | 0 = planifiée, 1 = réalisée |
| `notes` | TEXT NULL | Note libre |
| `planned_time` | TEXT NULL | HH:MM, heure prévue |
| `domain_id` | TEXT NULL | Domaine de vie (field `activity_log_domain`) |
| `config_activity_id` | TEXT NULL | Activité co-construite (config praticien) |
| `created_at` | TEXT | Horodatage ISO 8601 |

**Migration v1 → v2** (`createBehavioralActivationTable`) : SQLite ne sait pas retirer un `NOT NULL` → rebuild (create v2, copy, drop, rename), détecté par `PRAGMA table_info`. Mapping legacy : planifiée → P/M copiés vers `expected_*` ; réalisée → P/M conservés en ressentis. Statements exportés et testés (`database.test.ts`).

### Synchronisation

`activityRecordService` → `syncUpsert`/`syncDelete` (`entry_kind: 'activity_record'`). Le payload réplique toutes les colonnes métier (dont `date`, qui date l'activité côté web). Compat legacy côté web : payload sans `expected_*` → planifiée lue comme attendus, réalisée comme ressentis (`fetchActivityEntries`).

### Config praticien

`patient_modules.config.ba_activities: BAConfiguredActivity[]` (`@kaer/shared`) : `{ id, label, domain_id, value_text }`. Écriture web (`updateBAActivities`), lecture mobile (`baActivitiesService.fetchBAActivities`). RLS existantes de `patient_modules`.

### Seed (config-first)

- 6 fields `activity_log_domain` (catalogue extensible par INSERT)
- 29 fields `activity_log_suggestion`, chacun avec un prop atomique `domain`
- `activity_log_config` : bornes, couleurs, tous les libellés (clés i18n)

### Fichiers

| Fichier | Rôle |
|---|---|
| `apps/mobile/.../layouts/ActivityLog/ActivityLogLayout.tsx` | Routeur des 3 modes + données + handlers |
| `apps/mobile/.../layouts/ActivityLog/AgendaView.tsx` | Aujourd'hui + À venir |
| `apps/mobile/.../layouts/ActivityLog/ListView.tsx` | Onglet Historique (jours passés) |
| `apps/mobile/.../layouts/ActivityLog/EntryForm.tsx` | Formulaire (statut explicite, prédiction repliée) |
| `apps/mobile/.../layouts/ActivityLog/CompletionSheet.tsx` | Feuille « C'était comment ? » à la complétion |
| `apps/mobile/.../layouts/ActivityLog/ActivityListCard.tsx` | Carte d'une activité |
| `apps/mobile/.../layouts/ActivityLog/PickChip.tsx` | Chip sélectionnable mémoïsé |
| `apps/mobile/.../layouts/ActivityLog/activityLogConfig.ts` | Parsing pur de la config (+ test) |
| `apps/mobile/src/services/activityRecordService.ts` | SQLite + sync outbox (+ test) |
| `apps/mobile/src/services/baActivitiesService.ts` | Lecture config activités co-construites (+ test) |
| `apps/web/src/pages/PatientPage/tabs/BehavioralActivationPanel.tsx` | Panneau données praticien (+ test) |
| `apps/web/src/pages/PatientPage/tabs/BehavioralActivationCard.tsx` | Carte module + éditeur config |
| `apps/web/src/pages/PatientPage/hooks/useBAActivitiesEditor.ts` | Hook éditeur praticien (+ test) |
| `apps/web/.../layouts/ActivityLogLayout/ActivityLogLayout.tsx` | Aperçu praticien (props de config, comme le mobile) |
| `packages/shared/src/services/weekDates.ts` | Arithmétique de semaine partagée web ≡ mobile (+ test) |

---

## Lancer les tests

```bash
cd apps/mobile
npx jest FieldRenderer.activity_log activityLogConfig baActivitiesService activityRecordService database.test

cd apps/web
npx vitest run src/pages/PatientPage/tabs/BehavioralActivationPanel.test.tsx src/pages/PatientPage/hooks/useBAActivitiesEditor.test.ts
```

---

## Checklist de livraison (refonte 2026-07)

- [x] Web : panneau de données réelles (grille hebdo) branché dans `ModuleDataPanel`
- [x] Web : éditeur d'activités co-construites (domaines + phrase valeur) dans l'armoire
- [x] Web : aperçu praticien aligné sur le nouveau parcours (lecture des props de config)
- [x] Mobile : cycle prédire/faire/constater (attendus/ressentis nullables, fin du défaut à 5)
- [x] Mobile : vue semaine par défaut (remplace le calendrier mensuel), liste en second onglet
- [x] Mobile : suggestions groupées par domaines + activités de maîtrise au seed
- [x] Mobile : `planned_time` optionnel (préparation rappels, aucune notification)
- [x] Migration SQLite v1 → v2 par rebuild, mapping legacy testé
- [x] Parité date métier : mobile (SQLite `date`) ≡ web (`payload.date`)
- [x] i18n : fr/en common + teen (mobile), fr/en (web), best-effort de/es/it/pt
- [x] Sources : Richards 2016 (COBRA), Lejuez 2011 (BATD-R), Kraiss 2026, Santopetro 2024 (PMID vérifiés PubMed)
- [x] Conformité MDR : valeurs brutes, aucun écart calculé, aucune alerte, « non renseigné » légitime
