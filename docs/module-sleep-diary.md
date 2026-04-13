# Module Agenda du sommeil (`sleep_diary`)

## Vue d'ensemble

Le module **Agenda du sommeil** permet au patient de saisir chaque matin les données de sa nuit : horaires, réveils, qualité ressentie. L'app calcule en temps réel l'**efficacité du sommeil** (SE), indicateur central de la thérapie cognitivo-comportementale de l'insomnie (TCC-I).

Toutes les données sont **stockées localement** (SQLite) — rien n'est envoyé à Supabase.

---

## Écrans

| Écran | Route | Rôle |
|---|---|---|
| `SleepDiaryScreen` | `SleepDiary` | Liste des entrées récentes + bouton saisir |
| `SleepDiaryEntryScreen` | `SleepDiaryEntry` | Formulaire de saisie/édition d'une nuit |
| `SleepDiaryMonthScreen` | `SleepDiaryMonth` | Vue calendaire mensuelle |

---

## Formulaire de saisie (`SleepDiaryEntryScreen`)

### Champs

| Champ | Type | Description |
|---|---|---|
| Heure du coucher | `TimeField` | Picker natif iOS/Android |
| Heure du lever | `TimeField` | Picker natif iOS/Android |
| Temps pour s'endormir | `MinutesInput` (stepper ±5 min) | Latence d'endormissement |
| Nombre de réveils | `Counter` (±1) | Éveils nocturnes |
| Durée totale des réveils | `MinutesInput` (stepper ±5 min) | En minutes |
| Cauchemars | Toggle booléen | Présence de cauchemars |
| Qualité de la nuit | `StarRating` (1–5 ⭐) | Ressenti subjectif |
| Notes | `TextInput` multiline | Remarques libres (facultatif) |

### Header de navigation

Le header affiche dynamiquement :
- **Gauche** : bouton retour (natif)
- **Centre** : 🌙 + date au format `dd/mm/yyyy`
- **Droite** : ⚡ SE % (coloré) + icône disquette (sauvegarde)

L'efficacité du sommeil se met à jour en temps réel pendant la saisie.

---

## Calcul de l'efficacité du sommeil

```
SE = TST / TPL × 100

TPL (Temps Passé au Lit) = wake_time - bedtime (en minutes)
TST (Temps de Sommeil Total) = TPL - sleep_onset_minutes - awakenings_duration_minutes
```

| Seuil | Label | Couleur |
|---|---|---|
| SE ≥ 85 % | `bon` | Vert |
| 70 % ≤ SE < 85 % | `moyen` | Orange |
| SE < 70 % | `insuffisant` | Rouge |

Implémenté dans `src/lib/database.ts` : `computeSleepEfficiency()` et `sleepEfficiencyLabel()`.

---

## Structure des fichiers

```
apps/mobile/src/
├── screens/modules/
│   ├── SleepDiaryScreen.tsx             # Liste des entrées
│   ├── SleepDiaryEntryScreen.tsx        # Formulaire de saisie
│   ├── SleepDiaryEntryScreen.test.tsx   # 20 tests Jest+RNTL
│   └── SleepDiaryMonthScreen.tsx        # Vue mensuelle
└── lib/
    ├── database.ts                      # CRUD SQLite + calculs SE
    ├── database.test.ts                 # Tests computeSleepDuration / generateId
    └── sleepEfficiency.test.ts          # Tests computeSleepEfficiency / sleepEfficiencyLabel
```

---

## Base de données locale (SQLite)

Table : `sleep_diary_entries`

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID généré localement |
| `date` | TEXT | Date de la nuit (`YYYY-MM-DD`) |
| `bedtime` | TEXT | Heure du coucher (`HH:MM`) |
| `wake_time` | TEXT | Heure du lever (`HH:MM`) |
| `sleep_onset_minutes` | INTEGER | Temps pour s'endormir |
| `awakenings` | INTEGER | Nombre de réveils |
| `awakenings_duration_minutes` | INTEGER | Durée totale des réveils |
| `nightmares` | INTEGER | 0 ou 1 |
| `quality` | INTEGER | 1–5 |
| `notes` | TEXT | Remarques libres (nullable) |
| `created_at` | TEXT | Timestamp de création |

Une seule entrée par date (`INSERT OR REPLACE`).

---

## Tests (20 tests)

```bash
cd apps/mobile && npx jest SleepDiaryEntryScreen.test
```

| Groupe | Nb |
|---|---|
| Rendu initial & pré-remplissage | 4 |
| Stepper minutes (±5 min, plancher, format heures) | 4 |
| Compteur réveils | 2 |
| Toggle cauchemars | 1 |
| Étoiles qualité | 1 |
| Sauvegarde (alerte, données, navigation) | 3 |
| Suppression (présence bouton, alerte) | 3 |
| Efficacité dans le header | 2 |

Tests unitaires séparés pour `computeSleepEfficiency` (6 cas) et `sleepEfficiencyLabel` (3 cas) dans `sleepEfficiency.test.ts`.
