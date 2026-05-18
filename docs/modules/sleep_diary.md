# Agenda du sommeil (`sleep_diary`)

## Référence clinique

**Technique** : Agenda du sommeil — composant central de la TCC-I (Thérapie Cognitive et Comportementale de l'Insomnie)  
**Référence principale** : Trauer JM et al. (2015). *Cognitive Behavioral Therapy for Chronic Insomnia: A Systematic Review and Meta-Analysis.* Ann Intern Med. PMID 26054060. doi:10.7326/M14-2841  
**Niveau de preuve** : Revue systématique de 20 ECR (n=1 162) — TCC-I recommandée comme 1ère ligne pour l'insomnie chronique (HAS, NICE)  
**Indications principales** :
- Insomnie chronique (primaire ou comorbide)
- Monitoring du sommeil en complément de la TCC-I (restriction de sommeil, hygiène du sommeil)
- Suivi en psychiatrie (trouble bipolaire, dépression, PTSD)

**Principe** : Recueil quotidien des données objectives de sommeil par auto-déclaration. Les données brutes permettent au praticien de calculer l'efficacité du sommeil, d'ajuster la fenêtre de sommeil (restriction) et de suivre l'évolution sans interprétation algorithmique.

---

## Conformité MDR 2017/745

- Les valeurs saisies (horaires, durées, qualité 1–5) sont affichées sans label interprétatif
- Aucun seuil ne déclenche d'action ou de recommandation
- L'efficacité du sommeil et les paramètres cliniques sont calculés par le praticien en consultation
- Conformité stricte : affichage passif, interprétation appartenant exclusivement au soignant

---

## Architecture technique

### Stockage

Données stockées **localement** sur le téléphone via SQLite (`expo-sqlite`).

**Table :** `sleep_diary_entries`

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant unique (UUID) |
| `date` | TEXT UNIQUE | YYYY-MM-DD (la nuit enregistrée) — 1 seule entrée par nuit |
| `bedtime` | TEXT | Heure de coucher (HH:MM) ou NULL |
| `wake_time` | TEXT | Heure de lever (HH:MM) ou NULL |
| `sleep_onset_minutes` | INTEGER | Latence d'endormissement (minutes) |
| `awakenings` | INTEGER | Nombre de réveils nocturnes |
| `awakenings_duration_minutes` | INTEGER | Durée totale des réveils nocturnes (minutes) |
| `quality` | INTEGER | Qualité subjective du sommeil (1–5) ou NULL |
| `nightmares` | INTEGER | Présence de cauchemars (0=non, 1=oui) |
| `notes` | TEXT | Note libre optionnelle |
| `created_at` | TEXT | Horodatage ISO 8601 |

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
| **Horaires** | Coucher (HH:MM), Lever (HH:MM), Latence d'endormissement (min) |
| **Réveils** | Nombre de réveils, Durée totale des réveils (min) |
| **Cauchemars** | Présence oui/non |
| **Qualité** | Échelle 1–5 |
| **Notes** | Texte libre |

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
