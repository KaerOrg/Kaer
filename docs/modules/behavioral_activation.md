# Module Activation Comportementale (`behavioral_activation`)

## Objectif clinique

Permettre au patient de planifier et d'évaluer des activités selon deux dimensions (Plaisir et Maîtrise), dans le cadre du traitement comportemental de la dépression. Ces données brutes sont consultées par le praticien en consultation pour guider l'entretien motivationnel et suivre l'évolution du retrait comportemental.

**Base de preuves :** L'activation comportementale est une intervention validée pour la dépression avec un niveau de preuve équivalent à la TCC (NICE CG90 — grade A). Référence principale : Martell, Dimidjian & Herman-Dunn (2010). *Behavioral Activation for Depression.* Modèle BATD-R (Lejuez et al., 2011).

Applicable par les IPA, psychiatres et psychologues dans tout contexte de dépression unipolaire, bipolaire ou anxio-dépressive.

---

## Conformité MDR 2017/745

Ce module est un **carnet de bord numérique**. Il n'est pas un dispositif médical.

| Règle | Application |
|---|---|
| Le code affiche, jamais il ne conclut | P et M sont des chiffres bruts saisis par le patient |
| Aucun score composite calculé | Pas de total P+M, pas de label interprétatif |
| Aucune alerte conditionnelle | Pas de notification déclenchée par une valeur faible |
| Aucune comparaison à une norme | Pas de référence à un "niveau suffisant d'activité" |

---

## Fonctionnement (patient)

### Écran liste (`BehavioralActivationScreen`)

- Liste des activités groupées par date (plus récentes en premier)
- Chaque carte affiche : nom, score P, score M, statut (planifiée / réalisée)
- Checkbox pour basculer le statut réalisée/non réalisée sans ouvrir l'éditeur
- Bouton flottant (+) pour ajouter une nouvelle activité

### Écran formulaire (`BehavioralActivationEntryScreen`)

| Champ | Type | Description |
|---|---|---|
| Date | Sélecteur | Date de l'activité (passée ou à venir) |
| Nom | Texte libre | Ex : "Marche 20 min", "Appel à un ami" |
| Réalisée | Checkbox | Planifiée → Réalisée |
| Plaisir (P) | Curseur 0–10 | Satisfaction retirée |
| Maîtrise (M) | Curseur 0–10 | Sentiment d'accomplissement |
| Notes | Texte libre | Contexte, ressenti |

---

## Architecture technique

### Stockage

Données stockées **localement** sur le téléphone via SQLite (`expo-sqlite`).

**Table :** `activity_records`

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant unique |
| `date` | TEXT | YYYY-MM-DD (pas UNIQUE — plusieurs activités par jour) |
| `label` | TEXT | Nom de l'activité |
| `pleasure` | INTEGER | 0–10 |
| `mastery` | INTEGER | 0–10 |
| `done` | INTEGER | 0 = planifiée, 1 = réalisée |
| `notes` | TEXT | Note libre optionnelle |
| `created_at` | TEXT | Horodatage ISO 8601 |

### Signal d'observance Supabase

À chaque sauvegarde, un événement anonymisé est envoyé à `patient_engagement_logs` :

```json
{ "event_type": "SAVE_BEHAVIORAL_ACTIVATION", "metadata": {} }
```

Aucune donnée clinique transmise au serveur.

### Fichiers

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/lib/database.ts` | Types, table SQLite, fonctions CRUD |
| `apps/mobile/src/screens/modules/BehavioralActivationScreen.tsx` | Écran liste |
| `apps/mobile/src/screens/modules/BehavioralActivationEntryScreen.tsx` | Écran formulaire |
| `apps/mobile/src/screens/modules/BehavioralActivationScreen.test.tsx` | Tests Jest + RNTL (8 cas) |
| `apps/mobile/src/navigation/AppStack.tsx` | Routes `BehavioralActivation` + `BehavioralActivationEntry` |
| `apps/web/src/lib/modulePreviewContent.ts` | Aperçu praticien |

---

## Lancer les tests

```bash
cd apps/mobile
npx jest BehavioralActivationScreen.test.tsx
```

---

## Checklist de livraison

- [x] Web : `behavioral_activation` présent dans `MODULE_LABELS`, `MODULE_DESCRIPTIONS`, `MODULE_CATEGORIES` (emotion)
- [x] Web : aperçu praticien dans `MODULE_PREVIEW`
- [x] Mobile : `BehavioralActivationScreen.tsx` créé (liste + FAB)
- [x] Mobile : `BehavioralActivationEntryScreen.tsx` créé (formulaire P/M)
- [x] Mobile : routes `BehavioralActivation` + `BehavioralActivationEntry` dans `AppStack.tsx`
- [x] Mobile : `available: true` + navigation dans `HomeScreen.tsx`
- [x] Mobile : table SQLite dans `database.ts` + `initDatabase`
- [x] Tests : 8 cas couverts (état vide, FAB, navigation, affichage, toggle réalisée, groupement par date)
- [x] Conformité MDR : aucun score composite, aucune alerte, valeurs P et M brutes uniquement
