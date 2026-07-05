# Module — Colonnes de Beck (`beck_columns`)

## Base clinique

**Référence :** Beck, A.T., Rush, A.J., Shaw, B.F., & Emery, G. (1979). *Cognitive Therapy of Depression*. Guilford Press.

Les Colonnes de Beck, également appelées *Dysfunctional Thought Record* (DTR), sont l'outil de restructuration cognitive fondateur de la TCC. Leur efficacité est documentée dans de nombreuses méta-analyses (Hofmann et al., 2012 ; Cuijpers et al., 2019) pour la dépression unipolaire, les troubles anxieux, le PTSD et l'insomnie chronique. Recommandées par la HAS, le NICE et l'APA.

**Version implémentée : 6 colonnes (standard + distorsion optionnelle)**

| # | Colonne | Ce que le patient renseigne |
|---|---|---|
| 1 | Situation | Contexte déclencheur (qui, quoi, quand, où) |
| 2 | Émotion(s) | Nom libre + chips d'aide au vocabulaire + intensité initiale (0 à 100) |
| 3 | Pensée automatique | Contenu + conviction initiale (0 à 100) |
| 4 | Distorsion cognitive (optionnelle) | Piège de pensée auto-étiqueté par le patient : texte libre + chips des 8 pièges classiques (Burns) |
| 5 | Réponse rationnelle | Pensée alternative construite par le patient |
| 6 | Résultat | Émotion après réexamen + intensité + conviction en la PA (0 à 100) |

**Examen des preuves, format 7 colonnes de Padesky (2026-07, optionnel)** : deux
colonnes « Preuves pour la pensée » / « Preuves contre la pensée » (groupe
`optional_group='evidence'`) s'insèrent entre la distorsion et la réponse
rationnelle. Masquées par défaut ; le praticien les active **par patient** via la
bascule « Examen des preuves » de la card Beck
(`patient_modules.config.enabled_groups`). La numérotation des étapes est
dynamique (position parmi les colonnes visibles). Référence : Greenberger &
Padesky, *Mind Over Mood* (examen des preuves avant la pensée alternative).

**Saisie assistée (2026-07)** : les colonnes Émotion et Distorsion portent des
chips de suggestions (`suggestion_1..n` sur le `column_text_field`, codes i18n
en seed). Une chip ajoute/retire son mot dans le champ ; le texte libre reste
roi. Conformité MDR : auto-étiquetage par le patient, aucune détection ni
suggestion conditionnelle aux données. La liste des pièges est alignée sur les
fiches psyedu du module `cognitive_distortions` (ressource pédagogique sœur),
sans couplage technique.

---

## Conformité MDR 2017/745

Kær est un Carnet de Bord Numérique — non-Dispositif Médical.

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

## Capture en deux temps (mobile)

La friction de saisie est le premier facteur d'abandon des colonnes de Beck : la
pensée automatique est fugace, le formulaire complet est long. Depuis 2026-07, le
mode liste propose deux entrées :

- **« Noter vite »** (bouton secondaire) : formulaire réduit aux colonnes
  Situation + Pensée automatique (`quick_key_1..n` sur `column_form_config`).
  La fiche sauvegardée ne contient QUE ces valeurs : aucun défaut de curseur
  n'est écrit, donc aucune fausse donnée dans le graphe praticien.
- **« Nouvelle pensée »** (bouton principal) : parcours complet 5 colonnes.

Une fiche dont la réponse rationnelle (`complete_key_1`) est vide porte une puce
« À compléter » (statut **dérivé** des valeurs, jamais stocké ni synchronisé) ;
appuyer dessus ouvre l'édition complète pour terminer la restructuration, seul
ou en séance. Conforme MDR : statut de workflow non clinique, aucune notification.

Config seed : `quick_btn_label`, `quick_key_1/2`, `complete_key_1`,
`to_complete_label` sur `beck.cfg` (voir `docs/module-engine.md` § column_form).

---

## Vue praticien (web) — panneau « Données »

Depuis 2026-07, le panneau « Données » de la card `beck_columns` (`PatientPage`)
restitue les fiches synchronisées du patient (après opt-in `share_consent`) :

- **Courbes brutes de tous les curseurs** du module (intensité initiale, conviction
  dans la pensée automatique, intensité après réexamen, conviction dans la pensée
  alternative), une série par curseur, libellées par leurs clés i18n. Rendu
  `ModuleChart` (même pattern que `fear_thermometer`).
- **Fiches complètes antichronologiques** : chaque colonne renseignée avec ses
  textes intégraux et ses valeurs de curseurs brutes ; pagination « voir plus »
  (10 par page).

Circuit : `fetchFormEntries(patientId, moduleId)` (`engagementService`, lit
`patient_entries` `entry_kind='form_entry'`) → `engagementQueries.moduleData`
(kind `'form'`) → `ColumnFormDataPanel`. La structure (colonnes, libellés,
couleurs, curseurs) est dérivée de `module_content_fields` via
`moduleQueries.fields` — **zéro hardcode Beck** : tout module `column_form`
routé vers le kind `'form'` hérite du panneau.

Conformité MDR 2017/745 : valeurs brutes uniquement, aucun seuil, label
interprétatif ni couleur de jugement (les accents de colonne sont la config
visuelle du module, identique au mobile).

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
