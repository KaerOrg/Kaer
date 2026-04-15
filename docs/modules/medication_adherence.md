# Module Observance Médicamenteuse (`medication_adherence`)

## Objectif clinique

Permettre au patient de déclarer quotidiennement s'il a pris son traitement médicamenteux, et de noter tout élément contextuel utile (oubli, difficulté, remarque). Ces données brutes sont consultées par le praticien en consultation pour alimenter le dialogue thérapeutique.

**Base de preuves :** L'auto-monitoring de l'observance est recommandé comme outil d'alliance thérapeutique dans le suivi des troubles psychiatriques chroniques (NICE CG178, grade B). L'IPA en psychiatrie peut assurer le suivi des traitements de fond dans le cadre d'un protocole de coopération (Art. L4301-1 CSP).

---

## Conformité MDR 2017/745

Ce module est un **carnet de bord numérique**. Il n'est pas un dispositif médical.

| Règle | Application |
|---|---|
| Le code affiche, jamais il ne conclut | Les 3 statuts sont des faits déclarés par le patient — aucune interprétation |
| Aucun calcul de taux affiché | L'historique est une liste brute, sans taux d'observance ni label |
| Aucune alerte conditionnelle aux données | Pas de notification déclenchée par un statut "Non pris" |
| Aucune comparaison à une norme | Aucune référence à une "observance cible" ou à un seuil |

---

## Fonctionnement (patient)

### Saisie du jour

Le patient voit la date du jour et choisit parmi 3 statuts :

| Statut | Valeur stockée | Description |
|---|---|---|
| Pris | `taken` | Traitement pris dans son intégralité |
| Partiellement | `partial` | Traitement pris en partie |
| Non pris | `missed` | Traitement non pris ce jour |

Un champ texte optionnel permet d'ajouter une note (oubli, difficulté, remarque).

### Historique

Les 30 dernières entrées sont affichées en liste brute : date, statut, note. Aucun calcul, aucun graphique interprétatif.

---

## Architecture technique

### Stockage

Données stockées **localement** sur le téléphone via SQLite (`expo-sqlite`).

**Table :** `medication_adherence_entries`

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant unique |
| `date` | TEXT UNIQUE | YYYY-MM-DD — une saisie par jour |
| `status` | TEXT | `'taken'` \| `'partial'` \| `'missed'` |
| `notes` | TEXT | Note libre optionnelle |
| `created_at` | TEXT | Horodatage ISO 8601 |

### Signal d'observance Supabase

À chaque sauvegarde, un événement anonymisé est envoyé à `patient_engagement_logs` :

```json
{
  "event_type": "SAVE_MEDICATION_ADHERENCE",
  "metadata": {}
}
```

**Aucune donnée clinique** n'est transmise au serveur. Le signal indique uniquement que le module a été utilisé, pour le suivi d'engagement praticien.

### Fichiers

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/lib/database.ts` | Types, table SQLite, fonctions CRUD |
| `apps/mobile/src/screens/modules/MedicationAdherenceScreen.tsx` | Écran mobile |
| `apps/mobile/src/screens/modules/MedicationAdherenceScreen.test.tsx` | Tests Jest + RNTL |
| `apps/mobile/src/navigation/AppStack.tsx` | Route `MedicationAdherence` |
| `apps/web/src/lib/modulePreviewContent.ts` | Aperçu praticien (armoire thérapeutique) |

---

## Lancer les tests

```bash
cd apps/mobile
npx jest MedicationAdherenceScreen.test.tsx
```

---

## Checklist de livraison

- [x] Web : `medication_adherence` présent dans `MODULE_LABELS`, `MODULE_DESCRIPTIONS`, `MODULE_CATEGORIES` (iatrogenic)
- [x] Web : aperçu praticien dans `MODULE_PREVIEW`
- [x] Mobile : `MedicationAdherenceScreen.tsx` créé
- [x] Mobile : route `MedicationAdherence` dans `AppStack.tsx`
- [x] Mobile : `available: true` + navigation dans `HomeScreen.tsx`
- [x] Mobile : table SQLite dans `database.ts` + `initDatabase`
- [x] Tests : 9 cas couverts (affichage, pré-remplissage, sauvegarde, historique, garde-fou sans statut)
- [x] Conformité MDR : aucun seuil, aucune alerte, aucune interprétation algorithmique
