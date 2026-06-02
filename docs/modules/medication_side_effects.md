# Module Suivi des effets indésirables du traitement (`medication_side_effects`)

## Objectif clinique

Permettre au patient de déclarer quotidiennement l'intensité des effets secondaires ressentis pour son traitement médicamenteux. Ces données brutes sont consultées par le praticien (IPA, psychiatre, psychologue) en consultation pour adapter le suivi et alimenter le dialogue thérapeutique.

**Base de preuves :** Les effets indésirables des psychotropes sont la cause n°1 de non-observance dans les troubles psychiatriques chroniques (HAS 2019, NICE CG178 — grade A). La surveillance systématique des effets secondaires est un acte central du protocole IPA en psychiatrie (Art. L4301-1 CSP). Inspiré de l'UKU Side Effect Rating Scale (Lingjaerde et al., 1987 — référence internationale pour la surveillance des psychotropes).

---

## Conformité MDR 2017/745

Ce module est un **carnet de bord numérique**. Il n'est pas un dispositif médical.

| Règle | Application |
|---|---|
| Le code affiche, jamais il ne conclut | Les 6 jauges sont des chiffres bruts déclarés par le patient |
| Aucun score global calculé | Pas de total, pas de taux, pas de label interprétatif |
| Aucune alerte conditionnelle | Pas de notification déclenchée par une valeur ≥ seuil |
| Aucune comparaison à une norme | Pas de référence à un "niveau acceptable" |
| Couleurs d'options neutres | Les options de réponse n'ont **aucune** couleur de gravité (pas de dégradé vert→rouge) : seul le chiffre 0–3 déclaré est affiché, sans encodage interprétatif |

---

## Les 6 effets surveillés

Le libellé patient utilise un terme courant suivi du terme médical entre parenthèses, pour que le praticien et le patient parlent le même langage en consultation.

| Libellé patient | Terme médical | Clé | Classes concernées | Référence UKU |
|---|---|---|---|---|
| Somnolence | sédation | `sedation` | Toutes classes | Item 1.1 |
| Agitation, besoin de bouger | akathisie | `akathisia` | Antipsychotiques | Item 2.3 |
| Tremblements | — | `tremors` | Lithium, valproate, antipsychotiques | Item 2.4 |
| Sécheresse buccale | — | `dry_mouth` | Anticholinergiques, tricycliques | Item 3.1 |
| Troubles du sommeil | — | `sleep` | ISRS, IRSN, stabilisateurs | Item 1.3 |
| Nausées / troubles digestifs | — | `nausea` | Lithium, valproate, ISRS | Item 3.4 |

**Échelle 0–3 :** 0 = Absent · 1 = Léger · 2 = Modéré · 3 = Sévère

---

## Architecture technique

### Stockage

Données stockées **localement** sur le téléphone via SQLite (`expo-sqlite`).

**Table :** `side_effects_entries`

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant unique |
| `date` | TEXT UNIQUE | YYYY-MM-DD — une saisie par jour |
| `sedation` | INTEGER | 0–3 |
| `akathisia` | INTEGER | 0–3 |
| `tremors` | INTEGER | 0–3 |
| `dry_mouth` | INTEGER | 0–3 |
| `sleep_disturbance` | INTEGER | 0–3 |
| `nausea` | INTEGER | 0–3 |
| `notes` | TEXT | Note libre optionnelle |
| `created_at` | TEXT | Horodatage ISO 8601 |

### Signal d'observance Supabase

À chaque sauvegarde, un événement anonymisé est envoyé à `patient_engagement_logs` :

```json
{ "event_type": "SAVE_SIDE_EFFECTS", "metadata": {} }
```

Aucune donnée clinique transmise au serveur.

### Fichiers

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/lib/database.ts` | Types, table SQLite, fonctions CRUD |
| `apps/mobile/src/lib/scaleScoring.ts` | Config scoring (`medication_side_effects`) + subscale scores |
| `apps/mobile/src/screens/modules/MedicationSideEffectsHistoryScreen.tsx` | Écran historique dédié — graphiques par symptôme + sélecteur 1M/3M/1A |
| `apps/mobile/src/screens/modules/ScaleEntryScreen.tsx` | Saisie via moteur générique (FieldRenderer) |
| `apps/mobile/src/navigation/AppStack.tsx` | Route `MedicationSideEffectsHistory` |
| `apps/mobile/src/screens/HomeScreen.tsx` | Entrée `medication_side_effects` dans `CUSTOM_ROUTES` |
| `apps/web/src/lib/modulePreviewContent.ts` | Aperçu praticien |

---

## Lancer les tests

```bash
cd apps/mobile
npx jest MedicationSideEffectsScreen.test.tsx
```

---

## Graphiques par symptôme

L'écran `MedicationSideEffectsHistoryScreen` affiche un graphique en barres pour chacun des 6 symptômes, avec un sélecteur de période :

| Période | Granularité | Nombre de barres |
|---|---|---|
| 1 mois | Jour par jour | 30 barres |
| 3 mois | Moyenne hebdomadaire | 13 barres |
| 1 an | Moyenne mensuelle | 12 barres |

**Conformité MDR :** les graphiques affichent uniquement les valeurs brutes ou leurs moyennes arithmétiques. Aucune couleur d'alerte, aucun seuil, aucun message d'interprétation.

---

## Checklist de livraison

- [x] Web : `medication_side_effects` présent dans `MODULE_LABELS`, `MODULE_DESCRIPTIONS`, `MODULE_CATEGORIES` (iatrogenic)
- [x] Web : libellé unifié "Suivi des effets indésirables du traitement" (mobile + web)
- [x] Web : aperçu praticien dans `MODULE_PREVIEW`
- [x] Mobile : `MedicationSideEffectsHistoryScreen.tsx` créé (graphiques + historique)
- [x] Mobile : route `MedicationSideEffectsHistory` dans `AppStack.tsx`
- [x] Mobile : entrée dans `CUSTOM_ROUTES` (`HomeScreen.tsx`)
- [x] Mobile : table SQLite dans `database.ts` + `initDatabase`
- [x] Mobile : terminologie patient — "somnolence (sédation)", "agitation, besoin de bouger (akathisie)"
- [x] Conformité MDR : aucun seuil interprétatif, aucune alerte, valeurs brutes uniquement
