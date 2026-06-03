# Module Suivi des effets indésirables du traitement (`medication_side_effects`)

## Objectif clinique

Permettre au patient de déclarer l'intensité des effets indésirables ressentis pour son
traitement médicamenteux, et d'en suivre l'évolution dans le temps. Ces données brutes
sont consultées par le praticien (IPA, psychiatre, psychologue) en consultation pour
adapter le suivi et alimenter le dialogue thérapeutique.

**Base de preuves :** les effets indésirables des psychotropes sont la cause n°1 de
non-observance dans les troubles psychiatriques chroniques (HAS 2019, NICE CG178 — grade A).
La surveillance systématique des effets secondaires est un acte central du protocole IPA en
psychiatrie (Art. L4301-1 CSP). Catalogue inspiré de l'UKU Side Effect Rating Scale
(Lingjaerde et al., 1987).

> **Refonte (2026)** : ce module suivait auparavant 6 effets sur une échelle 0–3 via le
> questionnaire générique. Il a été refondu sur la mécanique du `mood_tracker` (tracker
> multi-dimensions, 3 onglets, courbes, repères, calendrier), avec deux apports majeurs :
> **échelle 0–10** et **effets suivis paramétrables par patient**.

---

## Conformité MDR 2017/745

Carnet de bord numérique — **non dispositif médical**.

| Règle | Application |
|---|---|
| Le code affiche, jamais il ne conclut | Sliders = chiffres bruts déclarés par le patient |
| Aucun score interprétatif | Le « total » éventuel n'est qu'une moyenne arithmétique brute, sans label |
| Aucune alerte conditionnelle | Aucune notification déclenchée par une valeur ; rappels = horaires fixes |
| Aucune comparaison à une norme | Aucune référence à un « niveau acceptable » |
| Couleurs neutres | Les couleurs par effet sont décoratives (identité visuelle), aucun jugement |
| Repères | Simples étiquettes datées (événements de traitement) saisies par le patient |

---

## Effets suivis : paramétrables par patient

**Cœur du module.** On n'affiche que les effets qui concernent le patient — jamais les autres.
La liste vit dans **`patient_modules.config.tracked_effects`** (Supabase), **config partagée** :
modifiable par le **praticien** (app web) ET le **patient** (app mobile), via la policy RLS
`modules_patient_update`.

- **Défaut = aucun effet** : à l'ouverture, le suivi est vide et invite à configurer.
- **Effets fixes** : sous-ensemble du catalogue de 12 (clé seule ; libellé/couleur via catalogue + i18n).
- **Effets personnalisés** : clé `c_*`, libellé texte libre + couleur auto (hors i18n).

```jsonc
// patient_modules.config
{ "tracked_effects": [
  { "key": "sedation" },
  { "key": "nausea" },
  { "key": "c_l9x2ab", "custom": true, "label": "Bouffées de chaleur", "color": "#F43F5E" }
] }
```

### Catalogue des 12 effets

| Libellé patient | Clé | Réf. UKU |
|---|---|---|
| Somnolence (sédation) | `sedation` | 1.1 |
| Troubles du sommeil | `sleep` | 1.3 |
| Agitation, besoin de bouger (akathisie) | `akathisia` | 2.3 |
| Tremblements | `tremors` | 2.4 |
| Sécheresse buccale | `dry_mouth` | 3.1 |
| Nausées / troubles digestifs | `nausea` | 3.4 |
| Constipation | `constipation` | 3.6 |
| Prise de poids / appétit | `weight` | 3.9 |
| Baisse d'appétit | `appetite_loss` | 3.7 |
| Vertiges / étourdissements | `dizziness` | 3.13 |
| Maux de tête | `headache` | 3.15 |
| Troubles sexuels | `sexual` | 3.18 |

**Échelle 0–10** par effet : 0 = absent → 10 = très intense. Base à 0, pas de repère central.

---

## Architecture (pattern « tracker multi-dimensions », partagé avec `mood_tracker`)

| Brique | Fichier | Partagé |
|---|---|---|
| Vue mobile (3 onglets, courbes, repères, calendrier) | `apps/mobile/src/components/features/DimensionTrackerView/` | ✅ mood_tracker |
| Aperçu web praticien | `apps/web/.../ModuleRenderer/layouts/SliderDashboardLayout/` (générique `slider_dashboard`) | ✅ mood_tracker |
| Courbes / calendrier / sélecteur de période | `apps/mobile/src/components/features/TimeRangeCharts/` | ✅ toutes |
| Stockage saisies | SQLite `scale_entries` (`subscale_scores` par clé d'effet) | ✅ toutes |
| Repères temporels (événements de traitement) | SQLite `mood_markers` (colonne `scale_id`) + `getAllTimelineMarkers`/`saveTimelineMarker`/`deleteTimelineMarker` | ✅ mood_tracker |

### Coquilles / spécifique au module

| Fichier | Rôle |
|---|---|
| `apps/mobile/.../MedicationSideEffectsHistoryScreen.tsx` | Charge la config patient, construit les dimensions actives, modal de paramétrage, rend `DimensionTrackerView` |
| `apps/mobile/.../MedicationSideEffectsEntryScreen.tsx` | Saisie 0–10 **dynamique** (1 curseur par effet actif) → `scale_entries` |
| `apps/mobile/src/lib/sideEffectsCatalog.ts` | Catalogue 12 effets + type `TrackedEffect` + helpers perso |
| `apps/mobile/src/services/sideEffectsConfigService.ts` | Lit/écrit `tracked_effects` (patient) |
| `apps/web/src/lib/sideEffectsCatalog.ts` | Miroir web (sans icône) |
| `apps/web/src/services/moduleAssignmentService.ts` | `fetchTrackedEffects`/`updateTrackedEffects` (praticien) |
| `apps/web/.../PatientPage/hooks/useMedicationEffectsEditor.ts` | Hook éditeur praticien |
| `apps/web/.../PatientPage/tabs/PatientModulesTab.tsx` | Carte praticien : cocher parmi les 12 + effets perso |
| `apps/mobile/src/lib/scaleScoring.ts` | `SCALE_SCORING['medication_side_effects']` (moyenne 0–10, 12 sous-scores) |

### Seed

- `modules.preview_kind = 'slider_dashboard'` (layout générique partagé avec `mood_tracker`).
- `module_content_fields` : 12 `scale_slider_question` (0–10) + `scale_instruction` + `footer_note`
  → servent à l'**aperçu web** (catalogue illustratif). La saisie patient réelle est pilotée par
  la config `tracked_effects`, pas par ces champs.
- `field_props` : couleur/icône/min=0/max=10 + hints partagés (Absent / Très intense),
  **aucun `mid_hint_code`** (échelle unidirectionnelle).

---

## Tests

```bash
npm run test:mobile   # MedicationSideEffectsHistoryScreen.test.tsx (onglets, état vide,
                      # effets configurés uniquement, navigation saisie dynamique)
npm run test:web      # MedicationSideEffectsLayout.test.tsx (aperçu + MDR)
                      # useMedicationEffectsEditor.test.ts (toggle / ajout perso / persistance)
```

---

## Différences clés avec `mood_tracker`

| | mood_tracker | medication_side_effects |
|---|---|---|
| Dimensions | 6 fixes | paramétrables par patient (12 + perso) |
| Échelle | 1–10, repère « Normal » central | 0–10, base 0 (absent), pas de repère |
| Saisie | `ScaleEntry` générique (indexée) | écran dédié dynamique (par clé d'effet) |
| Repères | événements de vie | événements de traitement |
