# Module Techniques de Respiration (`breathing_techniques`)

## Objectif clinique

Proposer au patient un guide animé pour 5 techniques de respiration validées, couvrant les indications principales rencontrées par les IPA, psychiatres et psychologues : anxiété, stress, dépression, PTSD, troubles du sommeil.

---

## Techniques implémentées

| Technique | Rythme | Indication principale | Niveau de preuve |
|---|---|---|---|
| Cohérence cardiaque | 5s–5s | Anxiété, stress chronique, dépression | Grade B — Lehrer & Gevirtz (2014) |
| Respiration diaphragmatique | 4s–7s | Base TCC, anxiété, douleur chronique | Grade B — HAS, Conrad et al. (2007) |
| Respiration carrée (Box Breathing) | 4-4-4-4 | Stress aigu, PTSD | Grade C — VA/DoD PTSD Guidelines |
| Technique 4-7-8 | 4s-7s-8s | Endormissement, crise anxieuse | Grade C — accord experts international |
| Pleine conscience respiratoire | 4-1-6-1 | Prévention rechute dépressive, ruminations | Grade A — NICE CG90, MBCT Segal et al. (2002) |

---

## Conformité MDR 2017/745

| Règle | Application |
|---|---|
| Guide à rythme fixe | Le minuteur est prédéfini, non conditionnel à des données patient |
| Pas de biofeedback | Aucun capteur, aucune mesure physiologique réelle |
| Aucune interprétation | L'historique stocke la technique + la durée — aucun label ("vous êtes plus calme") |
| Aucune notification conditionnelle | Les rappels éventuels sont programmés à l'avance par le praticien |

---

## Architecture technique

### Écrans

| Écran | Route | Rôle |
|---|---|---|
| `BreathingTechniquesScreen` | `BreathingTechniques` | Liste des 5 techniques avec description, niveau de preuve, historique de sessions |
| `BreathingExerciseScreen` | `BreathingExercise` | Guide animé : cercle respiratoire, barre de phases, compteurs cycles/durée |

### Stockage

**Table SQLite :** `breathing_sessions`

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant unique |
| `date` | TEXT | YYYY-MM-DD |
| `technique_key` | TEXT | Clé de la technique (ex: `coherence_cardiaque`) |
| `duration_seconds` | INTEGER | Durée effective de la session |
| `created_at` | TEXT | Horodatage ISO 8601 |

### Configuration des techniques (config-first, issue #69)

La définition des 5 techniques (couleur, durée recommandée, séquence de phases) vit
**en base**, plus dans un tableau TypeScript. Source de vérité : `supabase/seed.sql`.

- **`module_content_fields`** : 1 field `breathing_technique` par technique
  (`bt.tech.<key>`), chaque phase = un field enfant `breathing_phase`
  (`parent_field_id`), ordonnée par `sort_order`.
- **`field_props`** (atomiques) :
  - technique → `technique_key`, `color` (hex), `recommended_duration_min`
  - phase → `phase_type` (`inhale`|`hold_in`|`exhale`|`hold_out`), `phase_seconds`
- **Lecture mobile** : `breathingService.fetchBreathingTechniques()` appelle
  `fetchModuleFields('breathing_techniques')` (cache mémoire) et mappe les fields
  en `BreathingTechnique[]`.

Les libellés (nom, sous-titre, description, niveau de preuve, label de phase) restent
en i18n bundlé : `modules.breathing_techniques.<key>_name` / `_subtitle` /
`_description` / `_evidence` et `modules.breathing_techniques.phase_<type>`, déclinés
`fr`/`en` en `common` et `teen`. Les sources cliniques et la note MDR sont conservées
en commentaire d'en-tête du bloc seed.

### Signal d'observance Supabase

À chaque session terminée :
```json
{ "event_type": "SAVE_BREATHING_SESSION", "metadata": {} }
```

### Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/seed.sql` | Config des techniques (`breathing_technique`/`breathing_phase` + `field_props`) |
| `apps/mobile/src/services/breathingService.ts` | Lecture config (`fetchBreathingTechniques`) + sessions + sync |
| `apps/mobile/src/lib/database.ts` | Table + CRUD `breathing_sessions` |
| `apps/mobile/src/screens/modules/BreathingTechniquesScreen/` | Écran liste + test |
| `apps/mobile/src/screens/modules/BreathingExerciseScreen/` | Guide animé + test |
| `apps/mobile/src/services/breathingService.test.ts` | Tests service (save, fetch, parsing) |
| `apps/mobile/src/navigation/AppStack.tsx` | Routes `BreathingTechniques` + `BreathingExercise` |
| `apps/web/src/lib/modulePreviewContent.ts` | Aperçu praticien |

---

## Lancer les tests

```bash
cd apps/mobile
npx jest BreathingTechniquesScreen.test.tsx
```

---

## Checklist de livraison

- [x] Web : aperçu praticien dans `MODULE_PREVIEW`
- [x] Config-first : 5 techniques en base (`module_content_fields` / `field_props`)
- [x] Mobile : `breathingService.fetchBreathingTechniques()` lit la config depuis la base
- [x] Mobile : `BreathingTechniquesScreen` — liste + historique
- [x] Mobile : `BreathingExerciseScreen` — guide animé avec cercle, phases, compteurs
- [x] Mobile : table SQLite `breathing_sessions` + `initDatabase`
- [x] Mobile : routes `BreathingTechniques` + `BreathingExercise` dans `AppStack.tsx`
- [x] Mobile : `available: true` + navigation dans `HomeScreen.tsx`
- [x] i18n : clés `fr`/`en` en `common` + `teen`
- [x] Tests : service + 2 écrans
- [x] Conformité MDR : rythme fixe, pas de biofeedback, aucune interprétation
