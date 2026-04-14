# Module — Colonnes de Beck (`beck_columns`)

## Base clinique

**Référence :** Beck, A.T., Rush, A.J., Shaw, B.F., & Emery, G. (1979). *Cognitive Therapy of Depression*. Guilford Press.

Les Colonnes de Beck, également appelées *Dysfunctional Thought Record* (DTR), sont l'outil de restructuration cognitive fondateur de la TCC. Leur efficacité est documentée dans de nombreuses méta-analyses (Hofmann et al., 2012 ; Cuijpers et al., 2019) pour la dépression unipolaire, les troubles anxieux, le PTSD et l'insomnie chronique. Recommandées par la HAS, le NICE et l'APA.

**Version implémentée : 5 colonnes (standard)**

| # | Colonne | Ce que le patient renseigne |
|---|---|---|
| 1 | Situation | Contexte déclencheur (qui, quoi, quand, où) |
| 2 | Émotion(s) | Nom libre + intensité initiale (0–100) |
| 3 | Pensée automatique | Contenu + conviction initiale (0–100) |
| 4 | Réponse rationnelle | Pensée alternative construite par le patient |
| 5 | Résultat | Émotion après réexamen + intensité + conviction en la PA (0–100) |

---

## Conformité MDR 2017/745

PsyTool est un Carnet de Bord Numérique — non-Dispositif Médical.

**Règle appliquée :** le code affiche, jamais il ne conclut.

- Les valeurs d'intensité (0–100) sont des **chiffres bruts** saisis par le patient, affichés tels quels sans aucun label interprétatif (ni couleur, ni mention "sévère", "modéré", etc.).
- Aucun seuil ne déclenche une action ou une notification.
- L'historique est une liste neutre chronologique.
- L'interprétation appartient exclusivement au patient et au soignant en consultation.

---

## Architecture technique

### Stockage
- **Local uniquement** (offline-first) : table SQLite `beck_thought_records` dans `psytool.db`
- **Signal d'observance** anonymisé vers Supabase (`patient_engagement_logs`, `event_type: 'SAVE_BECK_THOUGHT_RECORD'`) — aucune donnée clinique transmise

### Schéma SQLite

```sql
CREATE TABLE IF NOT EXISTS beck_thought_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  situation TEXT NOT NULL DEFAULT '',
  emotion TEXT NOT NULL DEFAULT '',
  emotion_intensity INTEGER NOT NULL DEFAULT 50,
  automatic_thought TEXT NOT NULL DEFAULT '',
  thought_belief INTEGER NOT NULL DEFAULT 50,
  rational_response TEXT NOT NULL DEFAULT '',
  outcome_emotion TEXT NOT NULL DEFAULT '',
  outcome_intensity INTEGER NOT NULL DEFAULT 50,
  outcome_belief INTEGER NOT NULL DEFAULT 50,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Fichiers

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/lib/database.ts` | Types `ThoughtRecord`, CRUD SQLite, `createBeckColumnsTable` |
| `apps/mobile/src/screens/modules/BeckColumnsScreen.tsx` | Liste des enregistrements |
| `apps/mobile/src/screens/modules/BeckEntryScreen.tsx` | Formulaire 5 colonnes (création + édition) |
| `apps/mobile/src/screens/modules/BeckColumnsScreen.test.tsx` | 10 tests Jest + RNTL |
| `apps/mobile/src/navigation/AppStack.tsx` | Routes `BeckColumns` et `BeckEntry` |
| `apps/mobile/src/screens/HomeScreen.tsx` | Entrée `beck_columns` activée (`available: true`) |
| `apps/web/src/lib/modulePreviewContent.ts` | Preview praticien (5 étapes) |
| `packages/shared/src/index.ts` | `ModuleType` `beck_columns` déjà présent |
| `apps/web/src/lib/database.types.ts` | `MODULE_LABELS` + `MODULE_DESCRIPTIONS` déjà présents |

---

## Navigation mobile

```
HomeScreen
  └── BeckColumns (liste des enregistrements)
        ├── BeckEntry {}                    → nouvel enregistrement
        └── BeckEntry { recordId: string }  → édition
```

---

## Tests

10 tests dans `BeckColumnsScreen.test.tsx` :

1. Affiche l'état vide quand aucun enregistrement
2. Affiche le bouton "Nouvelle pensée" dans l'état vide
3. Affiche les enregistrements existants
4. Affiche l'émotion et son intensité brute (conformité MDR)
5. Affiche l'émotion résultante si renseignée
6. Navigue vers `BeckEntry` (nouvelle entrée) via le bouton
7. Navigue vers `BeckEntry` avec `recordId` via le crayon d'édition
8. Appelle `Alert.alert` en appuyant sur supprimer
9. Appelle `deleteThoughtRecord` après confirmation
10. N'affiche aucun label interprétatif (test de conformité MDR explicite)

### Lancer les tests

```bash
# Depuis la racine du projet
npx jest apps/mobile/src/screens/modules/BeckColumnsScreen.test.tsx
```
