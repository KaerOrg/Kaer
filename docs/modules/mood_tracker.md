# Module — Thermomètre de l'Humeur (`mood_tracker`)

## Base clinique

**Références :**
- Post, R.M. et al. (1988). *NIMH Life Chart Method* — gold standard en psychiatrie, notamment trouble bipolaire.
- Yatham, L.N. et al. (2018). *CANMAT and ISBD Guidelines for the Management of Bipolar Disorder.* Bipolar Disorders.
- Basco, M.R. & Rush, A.J. (2005). *Cognitive-Behavioral Therapy for Bipolar Disorder.* Guilford Press.
- NICE CG90 (2009, updated 2022). *Depression in adults: treatment and management.*

**4 dimensions retenues — saisie quotidienne, échelle 1–10 :**

| Dimension | Terme patient | Justification clinique |
|---|---|---|
| **Humeur** | Humeur | Mesure universelle — utile tous diagnostics |
| **Énergie** | Énergie | Distingue les polarités bipolaires, prédit les rechutes |
| **Anxiété** | Anxiété | Comorbidité chez ~60 % des patients en psychiatrie (CANMAT 2018) |
| **Anhédonie** | **Plaisir** | Critère DSM-5 cardinal de la dépression majeure (SHAPS, Snaith & Hamilton 1995). Distinct de l'énergie : dissociation fréquente en pratique clinique |

> **Pourquoi "Plaisir" et non "Anhédonie" ?** Le terme clinique est incompréhensible pour la plupart des patients. "Plaisir" est direct, sans connotation, et capture exactement la dimension hédonique (capacité à ressentir de la satisfaction dans les activités quotidiennes). Le hint guide : *"Rien ne m'a touché" ↔ "Pleinement ressenti"*.

**Rythme :** une saisie par jour. Si une entrée existe déjà, elle peut être mise à jour.

---

## Conformité MDR 2017/745

PsyTool est un Carnet de Bord Numérique — non-Dispositif Médical.

- Les valeurs 1–10 sont des **chiffres bruts** saisis par le patient, affichés sans label interprétatif.
- Les mini-graphiques (sparklines) sont des **barres de hauteur proportionnelle** — aucune couleur d'alerte, aucune flèche, aucun commentaire automatique.
- Aucun seuil ne déclenche quoi que ce soit.
- L'interprétation appartient exclusivement au patient et au soignant en consultation.

---

## Architecture technique

### Stockage
- **Local uniquement** (offline-first) : table SQLite `mood_entries` dans `psytool.db`
- **Contrainte UNIQUE sur `date`** — une seule entrée par jour, mise à jour via `INSERT OR REPLACE`
- **Signal d'observance** anonymisé Supabase (`event_type: 'SAVE_MOOD_ENTRY'`) — aucune donnée clinique transmise

### Schéma SQLite

```sql
CREATE TABLE IF NOT EXISTS mood_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  mood INTEGER NOT NULL DEFAULT 5,
  energy INTEGER NOT NULL DEFAULT 5,
  anxiety INTEGER NOT NULL DEFAULT 5,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Fichiers

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/lib/database.ts` | `MoodEntry`, `createMoodTrackerTable`, CRUD complet |
| `apps/mobile/src/screens/modules/MoodTrackerScreen.tsx` | Écran unique : saisie du jour + historique (onglets) |
| `apps/mobile/src/screens/modules/MoodTrackerScreen.test.tsx` | 11 tests Jest + RNTL |
| `apps/mobile/src/navigation/AppStack.tsx` | Route `MoodTracker` |
| `apps/mobile/src/screens/HomeScreen.tsx` | Entrée `mood_tracker` activée |
| `apps/web/src/lib/modulePreviewContent.ts` | Preview praticien (4 champs) |

---

## Navigation mobile

```
HomeScreen
  └── MoodTracker  (onglet Aujourd'hui | onglet Historique)
```

---

## Interface

**Onglet "Aujourd'hui" :**
- Indicateur si la saisie du jour existe déjà (modifiable)
- 3 ScalePicker (pastilles 1–10) pour humeur / énergie / anxiété
- Champ notes libres optionnel
- Bouton "Enregistrer" / "Mettre à jour"

**Onglet "Historique" :**
- 3 sparklines (mini-graphiques barres, 30 derniers jours) — une par dimension
- Liste chronologique des saisies avec valeurs + notes

---

## Tests

11 tests dans `MoodTrackerScreen.test.tsx` :

1. Affiche les 3 dimensions
2. Affiche le bouton Enregistrer
3. Valeur par défaut 5 pour chaque dimension
4. Pré-remplit si saisie existante du jour
5. Affiche "Mettre à jour" si saisie déjà enregistrée
6. Appelle `saveMoodEntry` à la sauvegarde
7. Affiche une alerte de confirmation
8. Bascule vers l'onglet Historique
9. Message vide si moins de 2 saisies
10. Affiche les entrées dans l'historique
11. Supprime après confirmation + appelle `deleteMoodEntry`
12. Test de conformité MDR — aucun label interprétatif

### Lancer les tests

```bash
npx jest apps/mobile/src/screens/modules/MoodTrackerScreen.test.tsx
```
