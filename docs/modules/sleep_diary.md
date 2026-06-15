# Agenda du sommeil (`sleep_diary`)

## Référence clinique

**Technique** : Agenda du sommeil — composant central de la TCC-I (Thérapie Cognitive et Comportementale de l'Insomnie)  
**Structure de référence** : Carney CE et al. (2012). *The Consensus Sleep Diary: standardizing prospective sleep self-monitoring.* Sleep 35(2):287-302. PMID 22294820. doi:10.5665/sleep.1642 — instrument standard que le module implémente (4 horaires distincts, latence, réveils + WASO, qualité, items étendus).  
**Référence d'efficacité** : Trauer JM et al. (2015). *Cognitive Behavioral Therapy for Chronic Insomnia: A Systematic Review and Meta-Analysis.* Ann Intern Med 163(3):191-204. PMID 26054060. doi:10.7326/M14-2841  
**Validation de l'instrument** : Maich KHG, Lachowski AM, Carney CE (2016). *Behav Sleep Med* 16(2):117-134. PMID 27231885. doi:10.1080/15402002.2016.1173556 — le Consensus Sleep Diary distingue bons dormeurs / insomniaques, détecte l'amélioration post-TCC-I, 99,8 % de complétion sur 14 jours.  
**Guideline AASM** : Edinger JD et al. (2021). *J Clin Sleep Med* 17(2):255-262. PMID 33164742. doi:10.5664/jcsm.8986 — recommandation FORTE de la TCC-I ; restriction du sommeil et contrôle du stimulus (basés sur l'agenda) recommandés.  
**Guideline européenne** : Riemann D et al. (2023). *J Sleep Res* 32(6):e14035. PMID 38016484. doi:10.1111/jsr.14035 — agenda du sommeil recommandé pour le diagnostic (grade A) ; actigraphie non recommandée en routine.  
**Restriction du sommeil (ECR)** : Kyle SD et al. (2023). *Lancet* 402(10406):975-987 (essai HABIT). PMID 37573859. doi:10.1016/S0140-6736(23)00683-9 — restriction du sommeil infirmière en soins primaires, ISI -3,05 à 6 mois, coût-efficace.  
**Subjectif vs wearables** : Hamill K et al. (2019). *J Sleep Res* 29(1):e12944. PMID 31680327. doi:10.1111/jsr.12944 — l'auto-déclaration reste l'outil de la TCC-I.  
**Niveau de preuve** : convergence AASM 2021, NICE NG215 2022 et European Insomnia Guideline 2023 — TCC-I 1ère ligne de l'insomnie chronique, agenda du sommeil comme outil central.  
**Indications principales** :
- Insomnie chronique (primaire ou comorbide)
- Monitoring du sommeil en complément de la TCC-I (restriction de sommeil, hygiène du sommeil)
- Suivi en psychiatrie (trouble bipolaire, dépression, PTSD)

**Principe** : Recueil quotidien des données objectives de sommeil par auto-déclaration. Les données brutes permettent au praticien de calculer l'efficacité du sommeil, d'ajuster la fenêtre de sommeil (restriction) et de suivre l'évolution sans interprétation algorithmique.

---

## Conformité MDR 2017/745

- Les valeurs saisies (horaires, durées, qualité 1–5) sont affichées sans label interprétatif
- Aucun seuil ne déclenche d'action ou de recommandation
- **Côté patient** : couleurs de jugement neutralisées. Le calendrier encode « nuit
  renseignée vs non » (neutre), pas un gradient bon/mauvais ; l'efficacité s'affiche en
  valeur brute sans couleur de seuil
- **Côté praticien** : le codage visuel des métriques (courbes, grille) est autorisé —
  score calculé pour le soignant. L'interprétation appartient exclusivement au praticien
- Conformité stricte : affichage passif côté patient, interprétation au soignant

---

## Architecture technique

### Stockage

Données stockées **localement** sur le téléphone via SQLite (`expo-sqlite`).

**Table :** `sleep_diary_entries`

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant unique (UUID) |
| `date` | TEXT UNIQUE | YYYY-MM-DD (la nuit enregistrée) — 1 seule entrée par nuit |
| `in_bed_time` | TEXT | Heure de mise au lit (HH:MM) — CSD |
| `bedtime` | TEXT | Heure d'essai de dormir / extinction des lumières (HH:MM) — CSD |
| `wake_time` | TEXT | Heure du dernier réveil (HH:MM) — CSD |
| `out_of_bed_time` | TEXT | Heure de sortie du lit (HH:MM) — CSD |
| `sleep_onset_minutes` | INTEGER | Latence d'endormissement / SOL (minutes) |
| `awakenings` | INTEGER | Nombre de réveils nocturnes |
| `awakenings_duration_minutes` | INTEGER | Durée totale des réveils / WASO (minutes) |
| `nap_minutes` | INTEGER | Durée totale des siestes diurnes (minutes) — CSD étendu |
| `sleep_aid` | INTEGER | Aide au sommeil prise (0=non, 1=oui) — CSD étendu |
| `quality` | INTEGER | Qualité subjective du sommeil (1–5) ou NULL |
| `restedness` | INTEGER | Ressenti au réveil (1–5) ou NULL — CSD étendu |
| `nightmares` | INTEGER | Présence de cauchemars (0=non, 1=oui) |
| `notes` | TEXT | Note libre optionnelle |
| `created_at` | TEXT | Horodatage ISO 8601 |

**Calculs cliniques** (`lib/database.ts`) : `minutesBetween`, `computeSleepEfficiency`
(TPL précis = sortie du lit − mise au lit ; fallback fenêtre de sommeil si horaires CSD
absents), `computeSleepDuration`. SE = TST / TPL × 100.

### Moteur générique

Ce module utilise le moteur `FieldRenderer` avec `preview_kind = 'sleep_journal'`.

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/lib/database.ts` | Type `SleepEntry`, table `sleep_diary_entries`, CRUD complet |
| `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer.tsx` | Rendu `sleep_journal_*` field types |
| `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer.sleep_journal.test.tsx` | Tests Jest du rendu |
| `supabase/schema.sql` / `supabase/seed.sql` | `module_content_fields` de type `sleep_journal_*` |

### Sections de l'agenda

| Section | Champs |
|---|---|
| **Horaires de la nuit** | Mise au lit, Essai de dormir, Dernier réveil, Sortie du lit (HH:MM), Latence (min) |
| **Réveils** | Nombre de réveils, Durée totale des réveils / WASO (min) |
| **Siestes** | Durée des siestes diurnes (min) |
| **Aide au sommeil** | Prise oui/non |
| **Cauchemars** | Présence oui/non |
| **Qualité** | Échelle 1–5 |
| **Au réveil** | Ressenti / récupération 1–5 |
| **Notes** | Texte libre |

### Vue praticien web

Onglet « Données » du patient : panneau dédié `SleepDataPanel`
(`apps/web/src/pages/PatientPage/tabs/`) alimenté par `fetchSleepEvolution`
(`engagementService`) via `engagementQueries.moduleData` (kind `sleep`, TanStack Query) :

- **Grille agenda du sommeil** : barres 24h (axe midi→midi) par nuit — temps passé au
  lit + fenêtre de sommeil, marqueur de cauchemar.
- **Courbes de tendance** : efficacité du sommeil (%) et temps de sommeil total (h).
- **Stats** : moyennes efficacité / sommeil / endormissement / réveils, nuits saisies,
  cauchemars.

---

## Navigation mobile

```
ModuleContentScreen (générique) → sleep_journal fields via FieldRenderer
```

---

## Lancer les tests

```bash
npx jest FieldRenderer.sleep_journal.test.tsx
```
