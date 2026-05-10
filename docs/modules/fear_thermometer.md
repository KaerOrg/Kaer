# Module — Thermomètre de la Peur (`fear_thermometer`)

## Base clinique

**Référence principale :**
- Wolpe, J. (1969). *The Practice of Behavior Therapy.* Pergamon Press. — Origine de l'échelle SUDs (Subjective Units of Distress).
- Marks, I.M. (1987). *Fears, Phobias and Rituals.* Oxford University Press. — Application SUDs aux thérapies d'exposition.
- Craske, M.G. & Barlow, D.H. (2007). *Mastery of Your Anxiety and Panic (MAP-4).* Oxford University Press.
- NICE CG113 (2011). *Generalised anxiety disorder and panic disorder in adults.*

**Concept :**
Le thermomètre de la peur (SUDs — Subjective Units of Distress) est un outil transversal, non spécifique à un diagnostic, permettant de mesurer l'intensité subjective de la détresse avant et après une stratégie de coping. Conçu pour accompagner les thérapies d'exposition (phobies, TOC, anxiété sociale, PTSD) mais applicable à toute situation génératrice d'anxiété.

**Transversal par design :** l'outil est indépendant du diagnostic et sert de mesure commune à l'ensemble des troubles anxieux.

**Échelle SUDs : 0–100 (pas de 10)**
- 0 = aucune détresse
- 100 = détresse maximale imaginable par le patient
- Valeur brute uniquement — aucun label interprétatif associé

---

## Conformité MDR 2017/745

PsyTool est un Carnet de Bord Numérique — non-Dispositif Médical.

- Les valeurs SUDs (0–100) sont des **chiffres bruts** saisis par le patient, affichés sans label interprétatif.
- Les barres visuelles (avant/après) sont **proportionnelles uniquement** — aucune couleur d'alerte, aucun commentaire automatique.
- Le champ `suds_after` est nullable : absence = donnée clinique neutre (l'interprétation de l'évitement appartient au praticien).
- Aucun seuil ne déclenche quoi que ce soit.
- L'interprétation appartient exclusivement au patient et au soignant en consultation.

---

## Architecture technique

### Stockage

- **Local uniquement** (offline-first) : 2 tables SQLite dans `psytool.db`
  - `fear_situations` — catalogue personnel de situations déclenchantes
  - `fear_entries` — saisies SUDs avec stratégies, avant/après
- **Signal d'observance** anonymisé Supabase (`event_type: 'SAVE_FEAR_ENTRY'`) — aucune donnée clinique transmise

### Schéma SQLite

```sql
CREATE TABLE IF NOT EXISTS fear_situations (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fear_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  situation_id TEXT,
  situation_label TEXT NOT NULL,
  suds_before INTEGER NOT NULL,
  strategies TEXT NOT NULL DEFAULT '{"selected":[],"custom":""}',
  custom_strategy TEXT,
  suds_after INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Sérialisation des stratégies

Le champ `strategies` est un JSON stringifié :
```json
{ "selected": ["Respiration lente", "Ancrage 5-4-3-2-1"], "custom": "Texte libre optionnel" }
```

Helpers : `serializeStrategies(selected, custom)` / `deserializeStrategies(raw)` dans `database.ts`.

### Stratégies prédéfinies (`COPING_STRATEGIES`)

1. Respiration lente
2. Ancrage 5-4-3-2-1
3. Marche / mouvement
4. Rester dans la situation (exposition)
5. Distraction cognitive
6. Contact avec un proche

+ champ texte libre pour toute stratégie non listée.

### Fichiers

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/lib/database.ts` | Types `FearSituation`, `FearEntry`, `COPING_STRATEGIES`, CRUD, helpers sérialisation |
| `apps/mobile/src/screens/modules/FearThermometerScreen.tsx` | Écran liste : onglet Saisies + onglet Mes situations |
| `apps/mobile/src/screens/modules/FearEntryScreen.tsx` | Formulaire de saisie SUDs |
| `apps/mobile/src/screens/modules/FearThermometerScreen.test.tsx` | 10 tests Jest + RNTL |
| `apps/mobile/src/navigation/AppStack.tsx` | Routes `FearThermometer` + `FearEntry` |
| `apps/mobile/src/screens/HomeScreen.tsx` | Entrée `fear_thermometer` activée |
| `apps/web/src/lib/modulePreviewContent.ts` | Preview praticien |

---

## Navigation mobile

```
HomeScreen
  └── FearThermometer  (onglet Saisies | onglet Mes situations)
        └── FearEntry  (nouvelle saisie | modification)
```

---

## Interface

### Écran liste (`FearThermometerScreen`)

**Onglet "Saisies" :**
- Carte par saisie : situation, date, barre SUDs avant/après (proportionnelle, valeur brute), badges stratégies, notes
- Bouton "Modifier" (crayon) → navigue vers `FearEntry` avec `entryId`
- Bouton "Supprimer" (poubelle) → confirmation + suppression
- Bouton FAB "Nouvelle saisie" → navigue vers `FearEntry` sans paramètre

**Onglet "Mes situations" :**
- Catalogue personnel de situations nommées, réutilisables
- Champ d'ajout + bouton "+"
- Suppression par croix avec confirmation Alert

### Formulaire (`FearEntryScreen`)

1. **Situation déclenchante**
   - Toggle "Mes situations" / "Texte libre"
   - Sélection radio dans le catalogue ou saisie libre

2. **SUDs avant (0–100)** — obligatoire
   - 11 boutons pastilles : 0, 10, 20, …, 100
   - Valeur brute affichée, accentColor rouge

3. **Stratégies utilisées**
   - Multi-sélect chips (6 prédéfinies)
   - Champ texte libre additionnel

4. **SUDs après (0–100)** — optionnel / nullable
   - 11 boutons pastilles + lien "Passer / à renseigner plus tard"
   - Valeur brute affichée, accentColor vert
   - `null` = non renseigné (signal clinique d'évitement pour le praticien)

5. **Notes libres** — optionnel

---

## Tests

10 tests dans `FearThermometerScreen.test.tsx` :

1. Affiche les deux onglets : Saisies et Mes situations
2. Affiche l'état vide et le bouton Nouvelle saisie
3. Affiche les saisies existantes avec situation et valeurs SUDs
4. Affiche les stratégies comme badges
5. Bascule vers l'onglet Mes situations
6. Ajoute une nouvelle situation via le champ texte
7. Ignore l'ajout si le champ est vide
8. Affiche les situations du catalogue
9. Appelle `deleteFearEntry` après confirmation
10. Conformité MDR — aucun label interprétatif (panique, sévère, critique, danger, alerte, normal)

### Lancer les tests

```bash
npx jest apps/mobile/src/screens/modules/FearThermometerScreen.test.tsx
```
