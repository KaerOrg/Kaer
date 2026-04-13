# Module Psychoéducation

## Vue d'ensemble

Le module **Psychoéducation** permet au praticien de partager des cartes de savoir thérapeutique avec ses patients. Chaque carte contient du contenu éducatif formaté en Markdown. Le patient peut les lire dans l'app et confirmer sa lecture.

---

## Architecture : Dictionnaire Local / Clés Distantes

Le contenu des cartes est **codé en dur dans le frontend mobile** (`constants/psychoeducationCards.ts`). Supabase ne stocke que :
- les **IDs des cartes débloquées** par le praticien
- le **statut de lecture** (`is_read`) pour chaque carte

**Avantages :**
- Aucun coût d'infrastructure pour le texte
- Fonctionne hors ligne (contenu toujours disponible)
- Migration de contenu simple (mise à jour de l'app)

**Limite :** la modification d'un texte existant nécessite une nouvelle version de l'app.

---

## Structure des fichiers

```
apps/mobile/src/
├── constants/
│   └── psychoeducationCards.ts       # Dictionnaire des cartes (contenu Markdown)
├── lib/
│   └── psychoeducation.ts            # Utilitaire Supabase : markCardAsRead()
└── screens/modules/
    ├── PsychoeducationScreen.tsx      # Liste des cartes débloquées
    ├── CardDetailScreen.tsx           # Détail d'une carte + bouton "J'ai lu et compris"
    └── PsychoeducationScreen.test.tsx # Tests Jest + RNTL
```

---

## Format de la config Supabase

La colonne `config` (JSONB) de la table `patient_modules` pour le module `psychoeducation` :

```json
{
  "unlocked_cards": [
    {
      "card_id": "card_sleep_01",
      "is_read": false,
      "unlocked_at": "2024-06-01T10:00:00Z"
    },
    {
      "card_id": "card_grounding_01",
      "is_read": true,
      "unlocked_at": "2024-06-02T14:30:00Z"
    }
  ]
}
```

---

## Cartes disponibles (MVP)

| ID | Titre | Icône |
|---|---|---|
| `card_sleep_01` | Règles d'hygiène du sommeil | `sleep` |
| `card_grounding_01` | Technique d'ancrage 5-4-3-2-1 | `hand-heart` |
| `card_cbt_01` | Identifier les distorsions cognitives | `head-cog-outline` |

Pour ajouter une carte : ajouter une entrée dans `PSYCHOEDUCATION_CARDS` dans `constants/psychoeducationCards.ts`. Aucune migration SQL n'est nécessaire.

---

## Flux utilisateur

```
HomeScreen → appui "Psychoéducation"
  → PsychoeducationScreen (liste des cartes débloquées)
      → appui sur une carte
          → CardDetailScreen (contenu Markdown)
              → appui "J'ai lu et compris"
                  → loading → markCardAsRead(patientId, cardId) → Supabase UPDATE
                  → succès : bouton vert "Lu et compris" (désactivé)
                  → erreur : message rouge + bouton réactivé
```

---

## Côté praticien (interface web)

Pour débloquer des cartes pour un patient, le praticien crée ou met à jour la ligne `patient_modules` :

```sql
INSERT INTO patient_modules (patient_id, practitioner_id, module_type, config)
VALUES (
  '<patient_id>',
  '<practitioner_id>',
  'psychoeducation',
  '{"unlocked_cards": [
    {"card_id": "card_sleep_01", "is_read": false, "unlocked_at": "now()"},
    {"card_id": "card_cbt_01",   "is_read": false, "unlocked_at": "now()"}
  ]}'
)
ON CONFLICT (patient_id, module_type) DO UPDATE
  SET config = EXCLUDED.config;
```

---

## Sécurité (RLS)

| Opération | Acteur | Politique |
|---|---|---|
| SELECT | Patient | `modules_patient` — uniquement ses modules actifs |
| SELECT | Praticien | `modules_practitioner` — tous ses patients |
| INSERT / UPDATE / DELETE | Praticien | `modules_practitioner` |
| UPDATE config (is_read) | Patient | `modules_patient_update` — ses modules actifs uniquement |

> La politique `modules_patient_update` a été ajoutée spécifiquement pour ce module. Elle permet au patient de mettre à jour le champ `config` (et uniquement lui) — le praticien restant maître du déverrouillage et de la révocation.

---

## Tests

```bash
# Depuis la racine du monorepo
cd apps/mobile && npx jest PsychoeducationScreen.test.tsx
```

**Couverture :**
- `PsychoeducationScreen` : affichage des cartes débloquées, exclusion des cartes non débloquées, badges lu/non lu, compteur, état vide, erreur réseau, IDs inconnus
- `CardDetailScreen` : rendu Markdown, bouton "J'ai lu et compris", état loading, succès (désactivation + coche verte), erreur Supabase, carte déjà lue

---

## Dépendance ajoutée

- **`react-native-markdown-display`** `^7.0.2` — rendu Markdown dans React Native

Installation :
```bash
cd apps/mobile && npm install
```
